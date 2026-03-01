// ─── Agent: Patient Report Simplifier ────────────────────────────────────────
//
// Autonomous agent that takes raw medical report text from a patient and
// produces a clear, empathetic, patient-friendly breakdown using Bedrock AI.
// It uses a single `format_result` tool so the model returns structured JSON.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool: structured output ─────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'format_simplified_report',
    description:
      'Call this tool ONCE with the complete simplified report. It stores the structured patient-friendly result.',
    inputSchema: {
      type: 'object',
      properties: {
        simplifiedSummary: {
          type: 'string',
          description: 'A 2-4 paragraph warm, plain-language summary of the entire report.',
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Section heading (e.g. "Your Diagnosis", "Medications", "Next Steps")' },
              content: { type: 'string', description: 'Plain-language explanation for this section' },
            },
            required: ['title', 'content'],
          },
          description: 'The report broken into clearly labeled sections, each written in simple language.',
        },
        termsExplained: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string', description: 'The medical term found in the report' },
              meaning: { type: 'string', description: 'Simple everyday explanation of what it means' },
            },
            required: ['term', 'meaning'],
          },
          description: 'Every medical/clinical term in the report with a patient-friendly explanation.',
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'Urgent or important things the patient should know (allergies, drug interactions, red-flag symptoms, surgery mentions).',
        },
        tips: {
          type: 'array',
          items: { type: 'string' },
          description: 'Practical health tips and lifestyle advice relevant to the conditions mentioned.',
        },
      },
      required: ['simplifiedSummary', 'sections', 'termsExplained', 'warnings', 'tips'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      // The model populates this structured output; we pass it through as an artifact.
      return {
        saved: true,
        _artifacts: {
          patientReport: {
            simplified: input.simplifiedSummary,
            sections: input.sections || [],
            termsExplained: input.termsExplained || [],
            warnings: input.warnings || [],
            tips: input.tips || [],
          },
        },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Patient Report Simplifier for CARENET AI — an expert at reading complex medical reports, clinical notes, lab results, and prescriptions, and turning them into warm, clear explanations that any patient can understand.

## Your Job
A patient has uploaded or typed their medical report. They may not understand medical terminology. Your task is to:

1. Read the report carefully.
2. Identify every medical term, abbreviation, medication name, and clinical concept.
3. Create a structured, compassionate, plain-language breakdown.
4. Call the \`format_simplified_report\` tool EXACTLY ONCE with the full result.

## Output Requirements (via the tool)

**simplifiedSummary** – A warm 2-4 paragraph overview. Address the patient directly ("Based on your report…"). Use everyday words.

**sections** – Break the report into logical sections. Common ones:
  - "What Brought You In" (chief complaint)
  - "Your Diagnosis" (assessment)
  - "Your Treatment Plan" (plan, procedures)
  - "Medications" (prescriptions with purpose, dosage in plain terms)
  - "Lab Results" (what was tested, what results mean)
  - "Next Steps" (follow-ups, referrals)
  Only include sections that are actually present in the report.

**termsExplained** – EVERY medical term, abbreviation, or drug name, with a 1-sentence plain explanation. Include units (mg, mL), dosing abbreviations (b.i.d., q.d., p.r.n.), conditions, procedures, and anatomy.

**warnings** – Flag anything urgent: allergies mentioned, drug interaction risks, abnormal results, surgery requirements, "call your doctor if…" situations. Be specific.

**tips** – 3-6 actionable lifestyle/health tips relevant to the conditions found in the report (diet, exercise, monitoring, medication adherence).

## Style Guidelines
- 5th-6th grade reading level — no jargon left unexplained
- Warm and empathetic but honest and factual
- Use analogies when helpful ("Think of your arteries like garden hoses…")
- Never diagnose or prescribe — you are explaining what the report says
- If the report is unclear or incomplete, say so and suggest the patient ask their doctor

## Important
- Call the tool EXACTLY ONCE with the complete result. Do not output a text response — use only the tool.
- If the report text is very short or unclear, still do your best and note the limitations in the summary.`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createPatientReportAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Patient Report Simplifier',
    description: 'Simplifies medical reports into patient-friendly language using AI.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 4,
    temperature: 0.2,
    maxTokens: 4096,
  });
}
