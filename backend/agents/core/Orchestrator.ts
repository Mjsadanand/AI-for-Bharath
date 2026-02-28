// ─── CARENET AI Agent Orchestrator ───────────────────────────────────────────
//
// Orchestrates the 5-agent pipeline: Clinical Doc → Translator → Predictive →
// Research → Workflow. Manages state passing between agents, error recovery,
// and provides real-time progress tracking.

import type { AgentContext, AgentResult, AgentStepName, PipelineConfig, PipelineState } from './types.js';
import { AGENT_STEP_ORDER } from './types.js';
import { createClinicalDocAgent } from '../clinical/ClinicalDocAgent.js';
import { createTranslatorAgent } from '../translator/TranslatorAgent.js';
import { createPredictiveAgent } from '../predictive/PredictiveAgent.js';
import { createResearchAgent } from '../research/ResearchAgent.js';
import { createWorkflowAgent } from '../workflow/WorkflowAgent.js';
import type { BedrockAgent } from './BedrockAgent.js';

// ── In-memory pipeline state store (use Redis/DB in production) ─────────────

const pipelineStore = new Map<string, PipelineState>();
const PIPELINE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STEP_TIMEOUT_MS = 3 * 60 * 1000;        // 3 minutes per agent step
const MAX_STORED_PIPELINES = 100;

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
   */
  async runPipeline(config: PipelineConfig): Promise<PipelineState> {
    // Housekeeping: evict old pipelines to prevent memory leaks
    evictExpiredPipelines();

    const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const state: PipelineState = {
      pipelineId,
      patientId: config.patientId,
      providerId: config.providerId,
      transcript: config.transcript,
      stepResults: {},
      errors: [],
      startedAt: new Date(),
      status: 'running',
    };

    pipelineStore.set(pipelineId, state);

    const stepsToRun = config.steps
      ? AGENT_STEP_ORDER.filter((s) => config.steps!.includes(s))
      : AGENT_STEP_ORDER;

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`🚀 CARENET Pipeline ${pipelineId} started`);
    console.log(`   Patient: ${config.patientId} | Provider: ${config.providerId}`);
    console.log(`   Steps: ${stepsToRun.join(' → ')}`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    for (const step of stepsToRun) {
      state.currentStep = step;
      pipelineStore.set(pipelineId, { ...state });

      console.log(`\n─── Step: ${step} ─────────────────────────────────────────`);

      try {
        const agent = createAgent(step);
        const message = buildAgentMessage(step, state);

        const context: AgentContext = {
          patientId: config.patientId,
          providerId: config.providerId,
          pipelineState: state,
        };

        // Run agent with per-step timeout
        const result: AgentResult = await Promise.race([
          agent.run(message, context),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Step "${step}" timed out after ${STEP_TIMEOUT_MS / 1000}s`)), STEP_TIMEOUT_MS)
          ),
        ]);

        // Store result
        state.stepResults[step] = result;

        // Merge artifacts into pipeline state
        if (result.success && result.artifacts) {
          this.mergeArtifacts(state, step, result);
        }

        if (!result.success) {
          state.errors.push({
            step,
            error: result.error || 'Agent returned unsuccessful result',
            timestamp: new Date(),
          });
          console.error(`  ❌ Step "${step}" failed: ${result.error}`);

          // Continue pipeline even if one step fails (graceful degradation)
          // Only abort on critical steps
          if (step === 'clinical-documentation') {
            console.error(`  🛑 Aborting pipeline — clinical documentation is required for subsequent steps.`);
            state.status = 'failed';
            break;
          }
        }

      } catch (err: any) {
        const safeMsg = err.message?.includes('timed out')
          ? err.message
          : `Step "${step}" encountered an internal error`;
        state.errors.push({
          step,
          error: safeMsg,
          timestamp: new Date(),
        });
        console.error(`  ❌ Step "${step}" threw exception: ${err.message}`);

        if (step === 'clinical-documentation') {
          state.status = 'failed';
          break;
        }
      }
    }

    state.completedAt = new Date();
    if (state.status !== 'failed') {
      state.status = 'completed';
    }
    state.currentStep = undefined;
    pipelineStore.set(pipelineId, state);

    const duration = state.completedAt.getTime() - state.startedAt.getTime();
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`${state.status === 'completed' ? '✅' : '❌'} Pipeline ${pipelineId} ${state.status} in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Steps completed: ${Object.keys(state.stepResults).length}/${stepsToRun.length}`);
    console.log(`   Errors: ${state.errors.length}`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    return state;
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
