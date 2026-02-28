// ─── CARENET AI Agent System — Core Types ───────────────────────────────────

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

  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  currentStep?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface PipelineConfig {
  patientId: string;
  providerId: string;
  transcript: string;
  steps?: string[];  // Optional: run only specific agents
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
