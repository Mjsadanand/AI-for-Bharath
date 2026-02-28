// ─── CARENET AI Agent System — Base Bedrock Agent ────────────────────────────
//
// Implements a ReAct-style agentic loop using AWS Bedrock's Converse API
// with native tool-use. Each specialized agent extends this base class.
// Hardened with: request timeouts, transient error retries, safe error masking.

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type ContentBlock,
  type ToolConfiguration,
  type ToolResultBlock,
} from '@aws-sdk/client-bedrock-runtime';
import type { AgentConfig, AgentContext, AgentResult, ToolCallRecord, ToolDefinition } from './types.js';

// Transient error codes that warrant automatic retry
const TRANSIENT_ERRORS = new Set([
  'ThrottlingException',
  'ServiceUnavailableException',
  'InternalServerException',
  'ModelTimeoutException',
  'RequestTimeout',
  'ECONNRESET',
  'ETIMEDOUT',
]);

const REQUEST_TIMEOUT_MS = 90_000; // 90s per Bedrock API call
const MAX_RETRIES = 2;             // Total attempts = MAX_RETRIES + 1
const RETRY_BASE_DELAY_MS = 2000;  // Exponential backoff base

function isTransientError(err: any): boolean {
  if (TRANSIENT_ERRORS.has(err.name) || TRANSIENT_ERRORS.has(err.code)) return true;
  if (err?.$metadata?.httpStatusCode && err.$metadata.httpStatusCode >= 500) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class BedrockAgent {
  protected client: BedrockRuntimeClient;
  protected config: AgentConfig;
  private toolMap: Map<string, ToolDefinition>;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      maxAttempts: 3, // SDK-level retry for connection errors
    });
    this.toolMap = new Map(config.tools.map((t) => [t.name, t]));
  }

  // ── Build Bedrock tool config from our tool definitions ──────────────────
  private buildToolConfig(): ToolConfiguration {
    return {
      tools: this.config.tools.map((tool) => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: { json: tool.inputSchema },
        },
      })),
    };
  }

  // ── Execute a single tool call ───────────────────────────────────────────
  private async executeTool(
    toolName: string,
    toolInput: any,
    context: AgentContext
  ): Promise<{ result: any; success: boolean; error?: string }> {
    const tool = this.toolMap.get(toolName);
    if (!tool) {
      return { result: null, success: false, error: `Unknown tool: ${toolName}` };
    }
    try {
      const result = await tool.handler(toolInput, context);
      return { result, success: true };
    } catch (err: any) {
      console.error(`[${this.config.name}] Tool "${toolName}" failed:`, err.message);
      return { result: null, success: false, error: err.message };
    }
  }

  // ── Send command to Bedrock with timeout + retry ─────────────────────────
  private async sendWithRetry(command: ConverseCommand) {
    let lastError: any;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const abortController = new AbortController();
        const timer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

        try {
          const response = await this.client.send(command, {
            abortSignal: abortController.signal,
          });
          clearTimeout(timer);
          return response;
        } finally {
          clearTimeout(timer);
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < MAX_RETRIES && isTransientError(err)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
          console.warn(`  ⏳ [${this.config.name}] Transient error (${err.name || err.code}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  // ── Main agentic loop ───────────────────────────────────────────────────
  async run(userMessage: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolCalls: ToolCallRecord[] = [];
    const artifacts: Record<string, any> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const messages: Message[] = [
      {
        role: 'user',
        content: [{ text: userMessage }],
      },
    ];

    console.log(`\n🤖 [${this.config.name}] Starting agent run...`);

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      try {
        const command = new ConverseCommand({
          modelId: this.config.modelId,
          messages,
          system: [{ text: this.config.systemPrompt }],
          toolConfig: this.buildToolConfig(),
          inferenceConfig: {
            temperature: this.config.temperature ?? 0.1,
            maxTokens: this.config.maxTokens ?? 4096,
          },
        });

        const response = await this.sendWithRetry(command);

        // Track token usage
        if (response.usage) {
          totalInputTokens += response.usage.inputTokens ?? 0;
          totalOutputTokens += response.usage.outputTokens ?? 0;
        }

        const stopReason = response.stopReason;
        const outputContent = response.output?.message?.content ?? [];

        // Append assistant message to conversation
        messages.push({
          role: 'assistant',
          content: outputContent as ContentBlock[],
        });

        // ── If model wants to use tools ────────────────────────────────
        if (stopReason === 'tool_use') {
          const toolUseBlocks = outputContent.filter(
            (block: any) => 'toolUse' in block
          );

          const toolResultContents: ContentBlock[] = [];

          for (const block of toolUseBlocks) {
            const toolUse = (block as any).toolUse;
            const { toolUseId, name, input } = toolUse;

            console.log(`  🔧 [${this.config.name}] Calling tool: ${name}`);

            const toolStart = Date.now();
            const { result, success, error } = await this.executeTool(name, input, context);
            const toolDuration = Date.now() - toolStart;

            const record: ToolCallRecord = {
              toolName: name,
              toolUseId,
              input,
              output: result,
              durationMs: toolDuration,
              success,
              error,
            };
            toolCalls.push(record);

            // Merge tool artifacts into result
            if (success && result && typeof result === 'object') {
              if (result._artifacts) {
                Object.assign(artifacts, result._artifacts);
                delete result._artifacts;
              }
            }

            const toolResultBlock: ToolResultBlock = {
              toolUseId,
              content: [{ json: success ? result : { error: error ?? 'Tool execution failed' } }],
              status: success ? 'success' : 'error',
            };

            toolResultContents.push({ toolResult: toolResultBlock } as any);
          }

          // Append tool results
          messages.push({
            role: 'user',
            content: toolResultContents,
          });

          continue; // Loop back for next model response
        }

        // ── Model finished (end_turn) ──────────────────────────────────
        if (stopReason === 'end_turn' || stopReason === 'max_tokens') {
          const textBlocks = outputContent.filter((block: any) => 'text' in block);
          const finalText = textBlocks.map((b: any) => b.text).join('\n');

          console.log(`  ✅ [${this.config.name}] Completed in ${Date.now() - startTime}ms (${toolCalls.length} tool calls)`);

          return {
            agentName: this.config.name,
            success: true,
            output: finalText,
            toolCalls,
            artifacts,
            tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
            durationMs: Date.now() - startTime,
          };
        }

        // Unknown stop reason — break
        console.warn(`  ⚠️ [${this.config.name}] Unexpected stop reason: ${stopReason}`);
        break;

      } catch (err: any) {
        const safeMsg = isTransientError(err)
          ? `Bedrock service temporarily unavailable (${err.name || 'unknown'})`
          : 'Agent execution failed';
        console.error(`  ❌ [${this.config.name}] Error on iteration ${iteration}:`, err.message);

        return {
          agentName: this.config.name,
          success: false,
          output: '',
          toolCalls,
          artifacts,
          tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
          durationMs: Date.now() - startTime,
          error: safeMsg,
        };
      }
    }

    // Exceeded max iterations
    console.warn(`  ⚠️ [${this.config.name}] Exceeded max iterations (${this.config.maxIterations})`);
    return {
      agentName: this.config.name,
      success: false,
      output: 'Agent exceeded maximum iteration limit.',
      toolCalls,
      artifacts,
      tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
      durationMs: Date.now() - startTime,
      error: 'Max iterations exceeded',
    };
  }
}
