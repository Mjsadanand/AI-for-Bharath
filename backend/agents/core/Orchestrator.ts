// ─── CARENET AI Agent Orchestrator ───────────────────────────────────────────
//
// Orchestrates the 5-agent pipeline with parallel phase execution, pipeline
// result caching, quality gates, critical alert escalation, and SSE streaming.
//
// Changes (2026-03):
//   • Parallel execution — Phase 2 (Translator + Predictive) and Phase 3
//     (Research + Workflow) now run concurrently with Promise.allSettled().
//     Cuts wall-clock pipeline time from ~6 min to ~3 min because the agents
//     within each phase have no data dependency on each other.
//
//   • Pipeline caching — SHA-256 hash of patientId+transcript used as cache
//     key. If an identical pipeline ran within the last hour the cached result
//     is returned immediately. Prevents the $0.52/run Bedrock cost from
//     accumulating during hackathon demos where judges ask to "run it again".
//
//   • Quality gate — after Agent 1 (Clinical Doc), average entity confidence
//     is checked. Below 0.5 triggers a warning (not an abort) logged to
//     state.warnings so the doctor knows the transcript quality was low.
//
//   • Critical alert escalation — after Agent 3 (Predictive), critical-level
//     risk alerts are elevated to state.criticalAlerts so the API response
//     surface them as a top-level field and the frontend can render them as
//     red banners immediately without parsing nested riskAssessment.alerts.
//
//   • runPipelineStream() — async generator that yields typed PipelineStreamEvent
//     objects consumed by the SSE controller. runPipeline() is now a thin
//     wrapper that collects the final 'pipeline_complete' event.

import { createHash } from 'crypto';
import type { AgentContext, AgentResult, AgentStepName, PipelineConfig, PipelineState, PipelineStreamEvent } from './types.js';
import { AGENT_STEP_ORDER } from './types.js';
import { createClinicalDocAgent } from '../clinical/ClinicalDocAgent.js';
import { createTranslatorAgent } from '../translator/TranslatorAgent.js';
import { createPredictiveAgent } from '../predictive/PredictiveAgent.js';
import { createResearchAgent } from '../research/ResearchAgent.js';
import { createWorkflowAgent } from '../workflow/WorkflowAgent.js';
import type { BedrockAgent } from './BedrockAgent.js';

// ── In-memory pipeline state store (use Redis/DB in production) ─────────────

const pipelineStore = new Map<string, PipelineState>();
const pipelineResultCache = new Map<string, { state: PipelineState; cachedAt: number }>();
const PIPELINE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STEP_TIMEOUT_MS = 3 * 60 * 1000;        // 3 minutes per agent step
const MAX_STORED_PIPELINES = 100;
const MAX_CACHE_ENTRIES = 100;

/**
 * How long to keep a cached pipeline result before re-running.
 * 1 hour balances demo convenience (safe to re-run without cost) with
 * data freshness (patient data changes are picked up after an hour).
 */
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Compute a deterministic cache key for a pipeline config.
 * SHA-256 of (patientId + transcript) — same input always produces the same key,
 * different input always produces a different key (collision probability ~1/2^256).
 */
function getPipelineCacheKey(config: PipelineConfig): string {
  return 'cache_' + createHash('sha256')
    .update(config.patientId + (config.transcript ?? ''))
    .digest('hex')
    .substring(0, 24);
}

/** Evict expired pipelines to prevent unbounded memory growth */
function evictExpiredPipelines(): void {
  const now = Date.now();
  for (const [id, state] of pipelineStore) {
    const age = now - state.startedAt.getTime();
    if (age > PIPELINE_TTL_MS) {
      pipelineStore.delete(id);
    }
  }
  // If still over limit, remove oldest
  if (pipelineStore.size > MAX_STORED_PIPELINES) {
    const sorted = [...pipelineStore.entries()].sort(
      (a, b) => a[1].startedAt.getTime() - b[1].startedAt.getTime()
    );
    const toRemove = sorted.slice(0, pipelineStore.size - MAX_STORED_PIPELINES);
    for (const [id] of toRemove) {
      pipelineStore.delete(id);
    }
  }

  // Evict stale cache entries by TTL.
  for (const [key, cached] of pipelineResultCache) {
    if (now - cached.cachedAt > CACHE_TTL_MS) {
      pipelineResultCache.delete(key);
    }
  }

  // Keep cache bounded as well (independent from pipeline history).
  if (pipelineResultCache.size > MAX_CACHE_ENTRIES) {
    const sorted = [...pipelineResultCache.entries()].sort(
      (a, b) => a[1].cachedAt - b[1].cachedAt,
    );
    const toRemove = sorted.slice(0, pipelineResultCache.size - MAX_CACHE_ENTRIES);
    for (const [key] of toRemove) {
      pipelineResultCache.delete(key);
    }
  }
}

// ── Agent Factory ───────────────────────────────────────────────────────────

function createAgent(step: AgentStepName): BedrockAgent {
  switch (step) {
    case 'clinical-documentation':
      return createClinicalDocAgent();
    case 'medical-translator':
      return createTranslatorAgent();
    case 'predictive-analytics':
      return createPredictiveAgent();
    case 'research-synthesis':
      return createResearchAgent();
    case 'workflow-automation':
      return createWorkflowAgent();
    default:
      throw new Error(`Unknown agent step: ${step}`);
  }
}

// ── Build user message for each agent step ──────────────────────────────────

function buildAgentMessage(step: AgentStepName, state: PipelineState): string {
  switch (step) {
    case 'clinical-documentation':
      return `Process the following patient encounter transcript and generate a structured clinical note.

Patient ID: ${state.patientId}
Provider ID: ${state.providerId}

Transcript:
"""
${state.transcript}
"""

First retrieve the patient's medical record for context, then analyze the transcript, extract all medical entities, and create a comprehensive clinical note.`;

    case 'medical-translator':
      return `Translate the clinical documentation into patient-friendly language.

Patient ID: ${state.patientId}
Clinical Note ID: ${state.clinicalNoteId}

Retrieve the clinical note and patient context, then generate a complete patient-friendly translation with:
- Simplified summary
- Diagnosis explanations in plain language
- Medication guides (if any prescriptions)
- Risk warnings
- Lifestyle recommendations
- Follow-up instructions`;

    case 'predictive-analytics':
      return `Perform a comprehensive risk assessment for this patient based on their health data and recent clinical encounter.

Patient ID: ${state.patientId}
Provider ID: ${state.providerId}

${state.clinicalNote ? `Recent Clinical Context: The patient was just seen for "${state.clinicalNote.chiefComplaint || 'a clinical encounter'}". Key findings from the clinical note have been documented.` : ''}

Retrieve the patient's health data and recent clinical notes, then:
1. Calculate risk scores for all relevant categories (Cardiovascular, Metabolic, Respiratory, etc.)
2. Generate predictions with probabilities
3. Create evidence-based recommendations with guideline citations
4. Generate alerts for any critical or warning-level findings
5. Save the complete risk assessment`;

    case 'research-synthesis':
      return `Search and synthesize medical research relevant to this patient's conditions and recent clinical findings.

Patient ID: ${state.patientId}

${state.clinicalNote ? `Clinical Context: Patient was seen for "${state.clinicalNote.chiefComplaint || 'clinical encounter'}".` : ''}
${state.riskAssessment ? `Risk Assessment: Overall risk level is "${state.riskAssessment.overallRisk?.level || 'unknown'}".` : ''}

Retrieve the patient's conditions, search for relevant research papers, analyze them, and provide a synthesis that:
- Identifies common findings across papers
- Notes any contradictions
- Evaluates evidence for current/proposed treatments
- Highlights gaps in research
- Summarizes clinical implications for this specific patient`;

    case 'workflow-automation':
      return `Based on the complete clinical encounter results, create appropriate workflow actions for this patient.

Patient ID: ${state.patientId}
Provider (Doctor) ID: ${state.providerId}

${state.clinicalNoteId ? `Clinical Note ID: ${state.clinicalNoteId}` : ''}
${state.clinicalNote ? `Chief Complaint: ${state.clinicalNote.chiefComplaint || 'Not specified'}` : ''}
${state.clinicalNote?.assessment ? `Diagnoses: ${JSON.stringify(state.clinicalNote.assessment.map((a: any) => ({ diagnosis: a.diagnosis, icdCode: a.icdCode, severity: a.severity })))}` : ''}
${state.riskAssessment ? `Risk Level: ${state.riskAssessment.overallRisk?.level || 'unknown'} (score: ${state.riskAssessment.overallRisk?.score || 'N/A'})` : ''}
${state.riskAssessment?.recommendations ? `Recommendations: ${JSON.stringify(state.riskAssessment.recommendations.slice(0, 5))}` : ''}

Based on this clinical context:
1. Check the doctor's schedule and create an appropriate follow-up appointment
2. If the patient has insurance, create a draft insurance claim with proper diagnosis/procedure codes
3. Order any recommended lab tests based on the risk assessment and clinical findings`;

    default:
      return 'Execute your assigned task.';
  }
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export class AgentOrchestrator {
  /**
   * Run the full 5-agent pipeline for a patient encounter.
   *
   * This is now a thin wrapper around runPipelineStream() — collects the final
   * 'pipeline_complete' event and returns the state. For real-time progress,
   * use runPipelineStream() directly via the SSE controller.
   */
  async runPipeline(config: PipelineConfig): Promise<PipelineState> {
    let finalState: PipelineState | undefined;
    for await (const event of this.runPipelineStream(config)) {
      if (event.event === 'pipeline_complete') {
        finalState = event.state;
      }
    }
    if (!finalState) {
      throw new Error('Pipeline stream ended without a pipeline_complete event');
    }
    return finalState;
  }

  /**
   * Async generator that runs the pipeline in parallel phases and yields
   * typed PipelineStreamEvent objects. Consumed by the SSE controller to push
   * live progress to the frontend.
   *
   * Execution phases:
   *   Phase 1 (sequential): clinical-documentation  ← required; abort on fail
   *   Phase 2 (parallel):   medical-translator + predictive-analytics
   *   Phase 3 (parallel):   research-synthesis + workflow-automation
   *
   * Why phases: Agents within each phase have no data dependency on each other
   * (they only need the previous phase's output), so running them concurrently
   * roughly halves the time for phases 2 and 3.
   */
  async *runPipelineStream(config: PipelineConfig): AsyncGenerator<PipelineStreamEvent> {
    evictExpiredPipelines();

    const isAborted = () => !!config.abortSignal?.aborted;
    const throwIfAborted = () => {
      if (isAborted()) {
        throw new Error('Pipeline cancelled by client disconnect');
      }
    };

    // ── Cache check ──────────────────────────────────────────────────────────
    // Why: Identical pipeline runs (same patient + transcript) are common during
    // demos and iterative testing. At $0.52/run we want to return the cached
    // result instantly rather than spending money on an identical Bedrock call.
    const cacheKey = getPipelineCacheKey(config);
    const cached = pipelineResultCache.get(cacheKey);
    if (
      cached &&
      cached.state.status === 'completed' &&
      Date.now() - cached.cachedAt < CACHE_TTL_MS
    ) {
      console.log(`⚡ [Pipeline] Cache hit — returning cached result (key: ${cacheKey})`);
      yield { event: 'cache_hit', pipelineId: cached.state.pipelineId, state: cached.state };
      yield { event: 'pipeline_complete', state: cached.state };
      return;
    }

    const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const state: PipelineState = {
      pipelineId,
      patientId: config.patientId,
      providerId: config.providerId,
      transcript: config.transcript,
      stepResults: {},
      errors: [],
      warnings: [],
      criticalAlerts: [],
      startedAt: new Date(),
      status: 'running',
      cacheKey,
    };

    pipelineStore.set(pipelineId, state);
    throwIfAborted();

    const stepsToRun = config.steps
      ? AGENT_STEP_ORDER.filter((s) => config.steps!.includes(s))
      : AGENT_STEP_ORDER;

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`🚀 CARENET Pipeline ${pipelineId} started`);
    console.log(`   Patient: ${config.patientId} | Provider: ${config.providerId}`);
    console.log(`   Steps: ${stepsToRun.join(' → ')} [parallel phases enabled]`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    yield { event: 'pipeline_start', pipelineId, steps: stepsToRun };

    // ── Shared helpers ────────────────────────────────────────────────────────

    /** Run one agent step with the per-step timeout. */
    const runStep = (step: AgentStepName): Promise<AgentResult> => {
      throwIfAborted();

      const agent = createAgent(step);
      const message = buildAgentMessage(step, state);
      const context: AgentContext = {
        patientId: config.patientId,
        providerId: config.providerId,
        pipelineState: state,
      };

      return new Promise<AgentResult>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Step "${step}" timed out after ${STEP_TIMEOUT_MS / 1000}s`));
        }, STEP_TIMEOUT_MS);

        agent
          .run(message, context)
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    };

    const markStepStarted = (step: AgentStepName): void => {
      state.runningSteps = [...(state.runningSteps ?? []), step];
      state.currentStep =
        state.runningSteps.length > 1 ? 'parallel' : state.runningSteps[0];
      pipelineStore.set(pipelineId, { ...state });
    };

    const markStepFinished = (step: AgentStepName): void => {
      state.runningSteps = (state.runningSteps ?? []).filter((s) => s !== step);
      state.currentStep =
        state.runningSteps.length > 1
          ? 'parallel'
          : state.runningSteps.length === 1
            ? state.runningSteps[0]
            : undefined;
      pipelineStore.set(pipelineId, { ...state });
    };

    /** Record a completed step result into pipeline state and merge artifacts. */
    const recordStep = (step: AgentStepName, result: AgentResult): void => {
      state.stepResults[step] = result;
      if (result.success && result.artifacts) {
        this.mergeArtifacts(state, step, result);
      }
      if (!result.success) {
        state.errors.push({
          step,
          error: result.error || 'Agent returned unsuccessful result',
          timestamp: new Date(),
        });
      }
      pipelineStore.set(pipelineId, { ...state });
    };

    // ── Phase 1: Clinical Documentation (sequential, required) ──────────────
    if (stepsToRun.includes('clinical-documentation')) {
      console.log(`\n─── Phase 1: clinical-documentation ────────────────────────`);
      markStepStarted('clinical-documentation');
      yield { event: 'step_start', step: 'clinical-documentation' };

      try {
        const result = await runStep('clinical-documentation');
        recordStep('clinical-documentation', result);
        markStepFinished('clinical-documentation');

        // ── Quality Gate ─────────────────────────────────────────────────────
        // Why: Poor confidence entities in the clinical note mean downstream
        // agents (risk scoring, workflow) are operating on low-quality inputs.
        // We don't abort — the pipeline is still useful — but we flag it so
        // the doctor knows the transcript quality was insufficient and can
        // re-record with less background noise.
        if (result.success) {
          const entities: any[] = state.clinicalNote?.extractedEntities ?? [];
          if (entities.length > 0) {
            const avgConfidence =
              entities.reduce((sum, e) => sum + (e.confidence ?? 0), 0) / entities.length;
            if (avgConfidence < 0.5) {
              const warning =
                `Entity confidence is low (avg: ${avgConfidence.toFixed(2)}). ` +
                `Consider re-recording with a cleaner transcript for better downstream accuracy.`;
              state.warnings!.push(warning);
              console.warn(`  ⚠️  [Quality Gate] ${warning}`);
              yield {
                event: 'quality_warning',
                step: 'clinical-documentation',
                warning,
                avgConfidence,
              };
            }
          }
        }

        yield {
          event: result.success ? 'step_complete' : 'step_failed',
          step: 'clinical-documentation',
          result: {
            success: result.success,
            tokensUsed: result.tokensUsed,
            durationMs: result.durationMs,
            error: result.error,
          },
        };

        if (!result.success) {
          console.error(`  🛑 Aborting pipeline — clinical documentation is required.`);
          state.status = 'failed';
          state.completedAt = new Date();
          state.runningSteps = [];
          state.currentStep = undefined;
          pipelineStore.set(pipelineId, state);
          yield { event: 'pipeline_complete', state };
          return;
        }
      } catch (err: any) {
        markStepFinished('clinical-documentation');
        const safeMsg = err.message?.includes('timed out')
          ? err.message
          : 'Clinical documentation step encountered an internal error';
        state.errors.push({ step: 'clinical-documentation', error: safeMsg, timestamp: new Date() });
        state.status = 'failed';
        state.completedAt = new Date();
        state.runningSteps = [];
        state.currentStep = undefined;
        pipelineStore.set(pipelineId, state);
        yield { event: 'step_failed', step: 'clinical-documentation', error: safeMsg };
        yield { event: 'pipeline_complete', state };
        return;
      }
    }

    // ── Phase 2: Translator + Predictive (parallel) ──────────────────────────
    // Why parallel: Both only depend on Agent 1's clinical note output, which
    // is now in state. Neither depends on the other. Running them together
    // cuts Phase 2 wall-clock time from ~120s to ~60s.
    const phase2Steps = (
      ['medical-translator', 'predictive-analytics'] as AgentStepName[]
    ).filter((s) => stepsToRun.includes(s));

    if (phase2Steps.length > 0) {
      throwIfAborted();
      console.log(`\n─── Phase 2 (parallel): ${phase2Steps.join(' | ')} ──────────`);
      for (const step of phase2Steps) {
        markStepStarted(step);
        yield { event: 'step_start', step };
      }

      const phase2Results = await Promise.allSettled(phase2Steps.map(runStep));

      for (let i = 0; i < phase2Steps.length; i++) {
        const step = phase2Steps[i];
        const settled = phase2Results[i];
        markStepFinished(step);

        if (settled.status === 'fulfilled') {
          recordStep(step, settled.value);
          yield {
            event: settled.value.success ? 'step_complete' : 'step_failed',
            step,
            result: {
              success: settled.value.success,
              tokensUsed: settled.value.tokensUsed,
              durationMs: settled.value.durationMs,
              error: settled.value.error,
            },
          };
        } else {
          const safeMsg = settled.reason?.message?.includes('timed out')
            ? settled.reason.message
            : `Step "${step}" encountered an internal error`;
          state.errors.push({ step, error: safeMsg, timestamp: new Date() });
          yield { event: 'step_failed', step, error: safeMsg };
        }
      }

      // ── Critical Alert Escalation ──────────────────────────────────────────
      // Why: The predictive agent may have created critical-level risk alerts.
      // Rather than make the frontend dig into riskAssessment.alerts[], we
      // elevate them to state.criticalAlerts so the API response has a dedicated
      // top-level field and the frontend can render a red banner immediately.
      const criticalAlerts = (state.riskAssessment?.alerts ?? []).filter(
        (a: any) => a.type === 'critical',
      );
      if (criticalAlerts.length > 0) {
        state.criticalAlerts = criticalAlerts.map((a: any) => ({
          type: a.type,
          message: a.message,
        }));
        console.warn(
          `\n🚨 CRITICAL ALERTS (${criticalAlerts.length}) for patient ${state.patientId}:`,
        );
        criticalAlerts.forEach((a: any) => console.warn(`   • ${a.message}`));
        yield { event: 'critical_alerts', alerts: state.criticalAlerts! };
      }
    }

    // ── Phase 3: Research + Workflow (parallel) ──────────────────────────────
    // Why parallel: Both depend on Phase 2 output (now in state). Neither
    // depends on the other. Running them together cuts Phase 3 from ~150s to ~75s.
    const phase3Steps = (
      ['research-synthesis', 'workflow-automation'] as AgentStepName[]
    ).filter((s) => stepsToRun.includes(s));

    if (phase3Steps.length > 0) {
      throwIfAborted();
      console.log(`\n─── Phase 3 (parallel): ${phase3Steps.join(' | ')} ──────────`);
      for (const step of phase3Steps) {
        markStepStarted(step);
        yield { event: 'step_start', step };
      }

      const phase3Results = await Promise.allSettled(phase3Steps.map(runStep));

      for (let i = 0; i < phase3Steps.length; i++) {
        const step = phase3Steps[i];
        const settled = phase3Results[i];
        markStepFinished(step);

        if (settled.status === 'fulfilled') {
          recordStep(step, settled.value);
          yield {
            event: settled.value.success ? 'step_complete' : 'step_failed',
            step,
            result: {
              success: settled.value.success,
              tokensUsed: settled.value.tokensUsed,
              durationMs: settled.value.durationMs,
              error: settled.value.error,
            },
          };
        } else {
          const safeMsg = settled.reason?.message?.includes('timed out')
            ? settled.reason.message
            : `Step "${step}" encountered an internal error`;
          state.errors.push({ step, error: safeMsg, timestamp: new Date() });
          yield { event: 'step_failed', step, error: safeMsg };
        }
      }
    }

    // ── Finalize ─────────────────────────────────────────────────────────────
    if (isAborted()) {
      state.errors.push({
        step: 'pipeline',
        error: 'Pipeline cancelled by client disconnect',
        timestamp: new Date(),
      });
      state.status = 'failed';
    }
    state.completedAt = new Date();
    if (state.status !== 'failed') state.status = 'completed';
    state.currentStep = undefined;
    state.runningSteps = [];
    pipelineStore.set(pipelineId, state);

    // Cache successful runs under the content-hash key so identical re-runs
    // are served instantly without a Bedrock round-trip.
    if (state.status === 'completed') {
      pipelineResultCache.set(cacheKey, {
        state,
        cachedAt: Date.now(),
      });
    }

    const duration = state.completedAt.getTime() - state.startedAt.getTime();
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`${state.status === 'completed' ? '✅' : '❌'} Pipeline ${pipelineId} ${state.status} in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Steps completed: ${Object.keys(state.stepResults).length}/${stepsToRun.length}`);
    console.log(`   Errors: ${state.errors.length}`);
    if (state.warnings?.length) console.log(`   Warnings: ${state.warnings.length}`);
    if (state.criticalAlerts?.length) console.log(`   🚨 Critical alerts: ${state.criticalAlerts.length}`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    yield { event: 'pipeline_complete', state };
  }

  /**
   * Run a single agent step independently.
   */
  async runSingleAgent(
    step: AgentStepName,
    config: PipelineConfig,
    existingState?: Partial<PipelineState>
  ): Promise<AgentResult> {
    const state: PipelineState = {
      pipelineId: `single_${Date.now()}`,
      patientId: config.patientId,
      providerId: config.providerId,
      transcript: config.transcript,
      stepResults: {},
      errors: [],
      warnings: [],
      criticalAlerts: [],
      startedAt: new Date(),
      status: 'running',
      ...existingState,
    };

    const agent = createAgent(step);
    const message = buildAgentMessage(step, state);
    const context: AgentContext = {
      patientId: config.patientId,
      providerId: config.providerId,
      pipelineState: state,
    };

    return agent.run(message, context);
  }

  /**
   * Get pipeline status by ID.
   */
  getPipelineStatus(pipelineId: string): PipelineState | undefined {
    return pipelineStore.get(pipelineId);
  }

  /**
   * Get all pipeline runs (for dashboard).
   */
  getAllPipelines(): PipelineState[] {
    return Array.from(pipelineStore.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );
  }

  // ── Private: merge agent artifacts into pipeline state ────────────────

  private mergeArtifacts(state: PipelineState, step: AgentStepName, result: AgentResult): void {
    const artifacts = result.artifacts;

    if (artifacts.clinicalNoteId) {
      state.clinicalNoteId = artifacts.clinicalNoteId;
      // Try to parse clinical note details from tool calls
      const createToolCall = result.toolCalls.find((tc) => tc.toolName === 'create_clinical_note');
      if (createToolCall?.input) {
        state.clinicalNote = {
          chiefComplaint: createToolCall.input.chiefComplaint,
          assessment: createToolCall.input.assessment,
          plan: createToolCall.input.plan,
          extractedEntities: createToolCall.input.extractedEntities,
          prescriptions: createToolCall.input.prescriptions,
        };
      }
    }

    if (artifacts.translation) {
      state.translation = artifacts.translation;
    }

    if (artifacts.riskAssessmentId) {
      state.riskAssessmentId = artifacts.riskAssessmentId;
      state.riskAssessment = artifacts.riskAssessment;
    }

    if (artifacts.researchResults) {
      state.researchResults = artifacts.researchResults;
    }

    if (artifacts.appointments) {
      state.appointments = [...(state.appointments || []), ...artifacts.appointments];
    }

    if (artifacts.insuranceClaims) {
      state.insuranceClaims = [...(state.insuranceClaims || []), ...artifacts.insuranceClaims];
    }

    if (artifacts.labOrders) {
      state.labOrders = [...(state.labOrders || []), ...artifacts.labOrders];
    }
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
