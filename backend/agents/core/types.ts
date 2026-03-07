// ─── CARENET AI Agent System — Core Types ───────────────────────────────────
//
// Changes (2026-03):
//   • AgentTelemetry — per-agent run statistics (runs, tokens, latency, success
//     rate). Exposed via GET /api/agents/telemetry to show operational metrics
//     without a separate monitoring database.
//   • PipelineStreamEvent — typed union for all events emitted by the
//     runPipelineStream() async generator, consumed by the SSE controller.
//   • PipelineState.criticalAlerts — predictive agent critical alerts are
//     elevated to a top-level field so the API response and frontend banner
//     can surface them immediately without parsing nested arrays.
//   • PipelineState.warnings — non-fatal quality issues (e.g. low entity
//     confidence) that don't abort the pipeline but should be shown to the doctor.
//   • PipelineState.cacheKey — SHA-256 content hash used for pipeline caching
//     to prevent duplicate Bedrock charges ($0.52/run) during demos.
//   • AgentContext.onToken — optional streaming callback for future SSE
//     token-by-token streaming support per agent.

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (input: any, context: AgentContext) => Promise<any>;
}

export interface AgentConfig {
  name: string;
  description: string;
  modelId: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  maxIterations: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ToolCallRecord {
  toolName: string;
  toolUseId: string;
  input: any;
  output: any;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface AgentResult {
  agentName: string;
  success: boolean;
  output: string;
  toolCalls: ToolCallRecord[];
  artifacts: Record<string, any>;
  tokensUsed: { input: number; output: number };
  durationMs: number;
  error?: string;
}

export interface AgentContext {
  patientId: string;
  providerId: string;
  pipelineState: PipelineState;
  /** Optional callback invoked with each text token during streaming runs. */
  onToken?: (token: string) => void;
}

/**
 * Per-agent runtime statistics tracked in-memory by BedrockAgent.
 * Surfaced via GET /api/agents/telemetry to show operational health without
 * needing a separate metrics database.
 */
export interface AgentTelemetry {
  agentName: string;
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalDurationMs: number;
  /** Rolling average duration in milliseconds across all runs. */
  avgDurationMs: number;
  lastRunAt?: Date;
}

export interface PipelineState {
  pipelineId: string;
  patientId: string;
  providerId: string;
  transcript?: string;

  // Artifacts from each step
  clinicalNoteId?: string;
  clinicalNote?: any;
  translation?: any;
  riskAssessmentId?: string;
  riskAssessment?: any;
  researchResults?: any;
  appointments?: any[];
  insuranceClaims?: any[];
  labOrders?: any[];

  // Agent results per step
  stepResults: Record<string, AgentResult>;

  // Error tracking
  errors: Array<{ step: string; error: string; timestamp: Date }>;

  /**
   * Non-fatal quality warnings (e.g. low entity confidence from clinical doc
   * agent). Pipeline continues but doctor should be informed.
   */
  warnings?: string[];

  /**
   * Critical-level risk alerts elevated from predictive agent output.
   * Kept here for immediate surfacing in API response & frontend red banner.
   * Why top-level: avoids frontend needing to dig into nested riskAssessment.alerts.
   */
  criticalAlerts?: Array<{ type: string; message: string }>;

  /**
   * SHA-256 content hash of patientId+transcript.
   * Used as the cache lookup key to avoid re-running identical pipelines.
   */
  cacheKey?: string;

  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  currentStep?: string;
  /** Steps currently in-flight (used for parallel phase visibility). */
  runningSteps?: AgentStepName[];
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface PipelineConfig {
  patientId: string;
  providerId: string;
  transcript: string;
  steps?: string[];  // Optional: run only specific agents
  /** Optional cancellation signal (used by SSE disconnect handling). */
  abortSignal?: AbortSignal;
}

export type AgentStepName =
  | 'clinical-documentation'
  | 'medical-translator'
  | 'predictive-analytics'
  | 'research-synthesis'
  | 'workflow-automation';

export const AGENT_STEP_ORDER: AgentStepName[] = [
  'clinical-documentation',
  'medical-translator',
  'predictive-analytics',
  'research-synthesis',
  'workflow-automation',
];

/**
 * Typed events emitted by Orchestrator.runPipelineStream().
 *
 * Why: The SSE controller needs strongly-typed events to serialize correctly.
 * Using a discriminated union (event field as literal) lets the TypeScript
 * compiler enforce that each event carries the right payload.
 */
export type PipelineStreamEvent =
  | { event: 'pipeline_start'; pipelineId: string; steps: string[] }
  | { event: 'cache_hit'; pipelineId: string; state: PipelineState }
  | { event: 'step_start'; step: AgentStepName }
  | {
      event: 'step_complete';
      step: AgentStepName;
      result: { success: boolean; tokensUsed: { input: number; output: number }; durationMs: number; error?: string };
    }
  | {
      event: 'step_failed';
      step: AgentStepName;
      result?: { success: boolean; tokensUsed: { input: number; output: number }; durationMs: number; error?: string };
      error?: string;
    }
  | { event: 'quality_warning'; step: AgentStepName; warning: string; avgConfidence: number }
  | { event: 'critical_alerts'; alerts: Array<{ type: string; message: string }> }
  | { event: 'pipeline_complete'; state: PipelineState };

/**
 * JSON-safe state shape emitted over SSE. Date objects are serialized to ISO strings.
 */
export type PipelineStateSse = Omit<PipelineState, 'startedAt' | 'completedAt' | 'errors' | 'stepResults' | 'transcript'> & {
  startedAt: string;
  completedAt?: string;
  errors: Array<{ step: string; error: string; timestamp: string }>;
  stepResults: Record<
    string,
    {
      agentName: string;
      success: boolean;
      tokensUsed: { input: number; output: number };
      durationMs: number;
      error?: string;
    }
  >;
};

/**
 * Wire payload emitted by the SSE endpoint.
 */
export type PipelineSseEvent =
  | { event: 'pipeline_start'; pipelineId: string; steps: string[] }
  | { event: 'cache_hit'; pipelineId: string; state: PipelineStateSse }
  | { event: 'step_start'; step: AgentStepName }
  | {
      event: 'step_complete';
      step: AgentStepName;
      result: { success: boolean; tokensUsed: { input: number; output: number }; durationMs: number; error?: string };
    }
  | {
      event: 'step_failed';
      step: AgentStepName;
      result?: { success: boolean; tokensUsed: { input: number; output: number }; durationMs: number; error?: string };
      error?: string;
    }
  | { event: 'quality_warning'; step: AgentStepName; warning: string; avgConfidence: number }
  | { event: 'critical_alerts'; alerts: Array<{ type: string; message: string }> }
  | { event: 'pipeline_complete'; state: PipelineStateSse }
  | { event: 'error'; message: string };
