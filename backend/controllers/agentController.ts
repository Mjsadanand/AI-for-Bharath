// ─── Agent API Controller ────────────────────────────────────────────────────
//
// REST endpoints for running the CARENET AI agent pipeline and individual agents.

import type { Request, Response } from 'express';
import { orchestrator } from '../agents/core/Orchestrator.js';
import { AGENT_STEP_ORDER } from '../agents/core/types.js';
import type { AgentStepName, PipelineConfig } from '../agents/core/types.js';
import { handleControllerError } from '../middleware/errorHandler.js';

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
        description: 'Agents run sequentially: Clinical Doc → Translator → Predictive → Research → Workflow. State is passed between agents.',
      },
    },
  });
};
