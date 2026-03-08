// ─── Agent API Controller ────────────────────────────────────────────────────
//
// REST endpoints for running the CARENET AI agent pipeline and individual agents.
//
// Changes (2026-03):
//   • streamAgentPipeline (POST /api/agents/pipeline/stream) — Server-Sent Events
//     endpoint that wraps runPipelineStream(). The frontend receives live
//     step_start / step_complete / critical_alerts / pipeline_complete events
//     so judges see the pipeline working in real-time. Without this, the UI
//     just shows a spinner for up to 6 minutes — a terrible demo experience.
//
//   • getAgentTelemetry (GET /api/agents/telemetry) — returns per-agent
//     statistics (runs, success rate, avg tokens, avg latency) accumulated by
//     the telemetry store in BedrockAgent. Gives judges live operational
//     metrics without any extra database or metrics service.

import type { Request, Response } from 'express';
import { orchestrator } from '../agents/core/Orchestrator.js';
import { getAgentTelemetry } from '../agents/core/BedrockAgent.js';
import { AGENT_STEP_ORDER } from '../agents/core/types.js';
import type {
  AgentStepName,
  PipelineConfig,
  PipelineSseEvent,
  PipelineState,
  PipelineStreamEvent,
} from '../agents/core/types.js';
import { handleControllerError } from '../middleware/errorHandler.js';

function toPipelineStateSse(state: PipelineState) {
  return {
    pipelineId: state.pipelineId,
    patientId: state.patientId,
    providerId: state.providerId,
    clinicalNoteId: state.clinicalNoteId,
    riskAssessmentId: state.riskAssessmentId,
    warnings: state.warnings ?? [],
    criticalAlerts: state.criticalAlerts ?? [],
    cacheKey: state.cacheKey,
    startedAt: state.startedAt.toISOString(),
    completedAt: state.completedAt?.toISOString(),
    currentStep: state.currentStep,
    runningSteps: state.runningSteps,
    status: state.status,
    errors: state.errors.map((e) => ({
      step: e.step,
      error: e.error,
      timestamp: e.timestamp.toISOString(),
    })),
    // Keep per-step stream payload compact and free of full LLM outputs/tool traces.
    stepResults: Object.fromEntries(
      Object.entries(state.stepResults).map(([step, result]) => [
        step,
        {
          agentName: result.agentName,
          success: result.success,
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
          error: result.error,
        },
      ]),
    ),
  };
}

function toSseEvent(event: PipelineStreamEvent): PipelineSseEvent {
  if (event.event === 'cache_hit' || event.event === 'pipeline_complete') {
    return {
      ...event,
      state: toPipelineStateSse(event.state),
    };
  }
  return event;
}

// ── POST /api/agents/pipeline/run — Run the full 5-agent pipeline ───────────

export const runAgentPipeline = async (req: Request, res: Response) => {
  try {
    const { patientId, transcript, steps } = req.body;
    const providerId = (req as any).user?._id;

    if (!patientId || !transcript) {
      return res.status(400).json({
        success: false,
        message: 'patientId and transcript are required',
      });
    }

    const config: PipelineConfig = {
      patientId,
      providerId,
      transcript,
      steps: steps || undefined, // Optional: run only specific steps
    };

    console.log(`\n🩺 Agent pipeline requested by provider ${providerId} for patient ${patientId}`);

    const state = await orchestrator.runPipeline(config);

    res.json({
      success: state.status === 'completed',
      data: {
        pipelineId: state.pipelineId,
        status: state.status,
        patientId: state.patientId,

        // Key artifacts
        clinicalNoteId: state.clinicalNoteId,
        translation: state.translation,
        riskAssessmentId: state.riskAssessmentId,
        riskAssessment: state.riskAssessment ? {
          overallRisk: state.riskAssessment.overallRisk,
          alertCount: state.riskAssessment.alerts?.length || 0,
        } : null,
        researchResults: state.researchResults ? {
          papersAnalyzed: state.researchResults.papersAnalyzed,
          synthesis: state.researchResults.synthesis,
        } : null,
        appointments: state.appointments,
        insuranceClaims: state.insuranceClaims,
        labOrders: state.labOrders,

        // Elevated critical alerts — surface at top level for immediate frontend rendering
        criticalAlerts: state.criticalAlerts ?? [],
        // Quality / safety warnings from quality gate and drug interactions
        warnings: state.warnings ?? [],

        // Step summaries
        steps: Object.entries(state.stepResults).map(([step, result]) => ({
          step,
          success: result.success,
          agentName: result.agentName,
          output: result.output,
          toolCallCount: result.toolCalls.length,
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
          error: result.error,
        })),

        errors: state.errors,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        totalDurationMs: state.completedAt
          ? state.completedAt.getTime() - state.startedAt.getTime()
          : null,
      },
    });
  } catch (err: any) {
    console.error('Pipeline error:', err);
    handleControllerError(res, err, 'Pipeline execution failed');
  }
};

// ── POST /api/agents/run/:agentName — Run a single agent ────────────────────

export const runSingleAgent = async (req: Request, res: Response) => {
  try {
    const { agentName } = req.params;
    const { patientId, transcript, context } = req.body;
    const providerId = (req as any).user?._id;

    if (!AGENT_STEP_ORDER.includes(agentName as AgentStepName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid agent name. Must be one of: ${AGENT_STEP_ORDER.join(', ')}`,
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required',
      });
    }

    const config: PipelineConfig = {
      patientId,
      providerId,
      transcript: transcript || '',
    };

    const result = await orchestrator.runSingleAgent(
      agentName as AgentStepName,
      config,
      context || {}
    );

    res.json({
      success: result.success,
      data: {
        agentName: result.agentName,
        output: result.output,
        artifacts: result.artifacts,
        toolCalls: result.toolCalls.map((tc) => ({
          tool: tc.toolName,
          success: tc.success,
          durationMs: tc.durationMs,
          error: tc.error,
        })),
        tokensUsed: result.tokensUsed,
        durationMs: result.durationMs,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error('Single agent error:', err);
    handleControllerError(res, err, 'Agent execution failed');
  }
};

// ── GET /api/agents/pipeline/status/:pipelineId — Check pipeline status ─────

export const getPipelineStatus = async (req: Request, res: Response) => {
  try {
    const pipelineId = req.params.pipelineId as string;
    const state = orchestrator.getPipelineStatus(pipelineId);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    res.json({
      success: true,
      data: {
        pipelineId: state.pipelineId,
        status: state.status,
        currentStep: state.currentStep,
        runningSteps: state.runningSteps ?? [],
        completedSteps: Object.keys(state.stepResults),
        errors: state.errors,
        startedAt: state.startedAt,
        completedAt: state.completedAt,

        // Artifacts summary
        artifacts: {
          clinicalNoteId: state.clinicalNoteId || null,
          hasTranslation: !!state.translation,
          riskAssessmentId: state.riskAssessmentId || null,
          hasResearch: !!state.researchResults,
          appointmentCount: state.appointments?.length || 0,
          claimCount: state.insuranceClaims?.length || 0,
          labOrderCount: state.labOrders?.length || 0,
        },
      },
    });
  } catch (err: any) {
    handleControllerError(res, err, 'Failed to get pipeline status');
  }
};

// ── GET /api/agents/pipelines — List all pipeline runs ──────────────────────

export const listPipelines = async (_req: Request, res: Response) => {
  try {
    const pipelines = orchestrator.getAllPipelines();

    res.json({
      success: true,
      data: pipelines.map((p) => ({
        pipelineId: p.pipelineId,
        patientId: p.patientId,
        status: p.status,
        stepsCompleted: Object.keys(p.stepResults).length,
        totalSteps: AGENT_STEP_ORDER.length,
        errors: p.errors.length,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
      })),
    });
  } catch (err: any) {
    handleControllerError(res, err, 'Failed to list pipelines');
  }
};

// ── POST /api/agents/pipeline/stream — Live SSE pipeline stream ─────────────
//
// Why SSE instead of WebSocket:
//   SSE is unidirectional (server→client), requires no handshake protocol,
//   works through standard HTTP/2 multiplexing, and is trivially consumed by
//   a fetch ReadableStream client. The pipeline only needs to push events — no
//   bidirectional channel is required.
//
// Event types emitted: pipeline_start | cache_hit | step_start | step_complete
//   | step_failed | quality_warning | critical_alerts | pipeline_complete
//
// We intentionally use POST so the pipeline config (including transcript) can
// be sent in the request body.

export const streamAgentPipeline = async (req: Request, res: Response) => {
  // ── SSE headers ────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering — critical for SSE

  // Flush headers immediately so the browser establishes the stream
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const sendEvent = (event: string, data: Record<string, any>) => {
    if (res.writableEnded || req.aborted) return;
    // SSE format: "event: <name>\ndata: <json>\n\n"
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    // Flush each event immediately — Node's default HTTP buffering would
    // batch writes and delay delivery to the browser
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  // Heartbeat every 15s to keep the connection alive through load balancers
  const heartbeat = setInterval(() => {
    if (res.writableEnded || req.aborted) return;
    res.write(': heartbeat\n\n');
  }, 15_000);

  const abortController = new AbortController();

  // Clean up heartbeat and abort in-flight orchestration if client disconnects.
  req.on('close', () => {
    clearInterval(heartbeat);
    abortController.abort();
  });

  try {
    const { patientId, transcript, steps } = req.body;
    const providerId = (req as any).user?._id;

    if (!patientId || !transcript) {
      sendEvent('error', { message: 'patientId and transcript are required' });
      clearInterval(heartbeat);
      return res.end();
    }

    const config: PipelineConfig = {
      patientId,
      providerId,
      transcript,
      steps: steps || undefined,
      abortSignal: abortController.signal,
    };

    console.log(`\n📡 [SSE] Pipeline stream requested by provider ${providerId} for patient ${patientId}`);

    for await (const event of orchestrator.runPipelineStream(config)) {
      if (req.aborted || res.writableEnded || abortController.signal.aborted) {
        break;
      }
      // Emit each pipeline event exactly as typed
      const sseEvent = toSseEvent(event);
      sendEvent(sseEvent.event, sseEvent as unknown as Record<string, any>);

      // Terminate the stream after the final event
      if (event.event === 'pipeline_complete') {
        break;
      }
    }
  } catch (err: any) {
    console.error('[SSE] Pipeline stream error:', err);
    if (!abortController.signal.aborted) {
      sendEvent('error', { message: 'Pipeline execution failed' });
    }
  } finally {
    clearInterval(heartbeat);
    if (!res.writableEnded) {
      res.end();
    }
  }
};

// ── GET /api/agents/telemetry — Per-agent runtime statistics ────────────────
//
// Returns accumulated in-memory telemetry from BedrockAgent.recordTelemetry().
// Resets when the server restarts — intentional for hackathon (no DB needed).
// Shows: runs, success rate, avg latency, total tokens per agent.
// Why this matters for judges: demonstrates the system is production-aware and
// can be monitored operationally, not just run blindly.

export const getAgentTelemetryEndpoint = async (_req: Request, res: Response) => {
  try {
    const telemetry = getAgentTelemetry();

    const totalRuns = telemetry.reduce((s, t) => s + t.runs, 0);
    const totalTokens = telemetry.reduce(
      (s, t) => s + t.totalInputTokens + t.totalOutputTokens,
      0,
    );
    // Approximate cost: Nova Premier = $2.50/1M input + $10.00/1M output
    const totalInputTokens = telemetry.reduce((s, t) => s + t.totalInputTokens, 0);
    const totalOutputTokens = telemetry.reduce((s, t) => s + t.totalOutputTokens, 0);
    const estimatedCostUSD =
      (totalInputTokens / 1_000_000) * 2.5 + (totalOutputTokens / 1_000_000) * 10.0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRuns,
          totalTokensUsed: totalTokens,
          estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(4)),
          agentsTracked: telemetry.length,
        },
        agents: telemetry.map((t) => ({
          agentName: t.agentName,
          runs: t.runs,
          successRate:
            t.runs > 0 ? parseFloat(((t.successfulRuns / t.runs) * 100).toFixed(1)) : 0,
          failedRuns: t.failedRuns,
          avgDurationMs: t.avgDurationMs,
          avgDurationSec: parseFloat((t.avgDurationMs / 1000).toFixed(1)),
          totalInputTokens: t.totalInputTokens,
          totalOutputTokens: t.totalOutputTokens,
          avgTokensPerRun:
            t.runs > 0
              ? Math.round((t.totalInputTokens + t.totalOutputTokens) / t.runs)
              : 0,
          estimatedCostPerRun:
            t.runs > 0
              ? parseFloat(
                  (
                    (t.totalInputTokens / 1_000_000 / t.runs) * 2.5 +
                    (t.totalOutputTokens / 1_000_000 / t.runs) * 10.0
                  ).toFixed(4),
                )
              : 0,
          lastRunAt: t.lastRunAt,
        })),
        note: 'Telemetry is in-memory and resets on server restart.',
      },
    });
  } catch (err: any) {
    handleControllerError(res, err, 'Failed to retrieve telemetry');
  }
};

// ── GET /api/agents/info — List available agents ────────────────────────────

export const getAgentInfo = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      agents: [
        {
          name: 'clinical-documentation',
          displayName: 'Clinical Documentation Agent',
          description: 'Processes patient transcripts, extracts medical entities via LLM, and generates structured SOAP clinical notes.',
          capabilities: ['NLP Entity Extraction', 'ICD-10 Coding', 'SOAP Note Generation', 'Drug Interaction Flagging'],
        },
        {
          name: 'medical-translator',
          displayName: 'Medical Translator Agent',
          description: 'Translates clinical documentation into patient-friendly language with medication guides and lifestyle recommendations.',
          capabilities: ['Medical Jargon Translation', 'Medication Guides', 'Risk Warnings', 'Lifestyle Recommendations'],
        },
        {
          name: 'predictive-analytics',
          displayName: 'Predictive Analytics Agent',
          description: 'Analyzes patient data for risk assessment across categories with evidence-based predictions and recommendations.',
          capabilities: ['Multi-Category Risk Scoring', 'Predictive Modeling', 'Evidence-Based Recommendations', 'Critical Alert Generation'],
        },
        {
          name: 'research-synthesis',
          displayName: 'Research Synthesis Agent',
          description: 'Searches and synthesizes medical literature relevant to patient conditions with evidence comparison.',
          capabilities: ['Literature Search', 'Evidence Synthesis', 'Treatment Evidence Grading', 'Gap Analysis'],
        },
        {
          name: 'workflow-automation',
          displayName: 'Workflow Automation Agent',
          description: 'Autonomously manages follow-up scheduling, insurance claims, and lab orders based on clinical context.',
          capabilities: ['Intelligent Scheduling', 'Insurance Claim Drafting', 'Lab Ordering', 'Conflict Detection'],
        },
      ],
      pipeline: {
        order: AGENT_STEP_ORDER,
        description: 'Phase 1 (sequential): Clinical Doc. Phase 2 (parallel): Translator + Predictive. Phase 3 (parallel): Research + Workflow. Phases run concurrently within each group.',
        streamEndpoint: 'POST /api/agents/pipeline/stream — SSE endpoint for real-time progress events.',
      },
    },
  });
};
