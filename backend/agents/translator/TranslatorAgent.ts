// ─── Agent 2: Medical Translator Agent ──────────────────────────────────────
//
// Autonomous agent that translates clinical documentation into patient-friendly
// language, generates medication guides, and handles patient Q&A.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';
import ClinicalNote from '../../models/ClinicalNote.js';
import Patient from '../../models/Patient.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool Implementations ────────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'get_clinical_note',
    description:
      'Retrieve a clinical note by its ID. Use this to get the full clinical documentation that needs to be translated into patient-friendly language.',
    inputSchema: {
      type: 'object',
      properties: {
        noteId: { type: 'string', description: 'The MongoDB ObjectId of the clinical note' },
      },
      required: ['noteId'],
    },
    handler: async (input: { noteId: string }, _ctx: AgentContext) => {
      const note = await ClinicalNote.findById(input.noteId).lean();
      if (!note) throw new Error(`Clinical note not found: ${input.noteId}`);

      return {
        noteId: note._id,
        noteType: note.noteType,
        chiefComplaint: note.chiefComplaint,
        historyOfPresentIllness: note.historyOfPresentIllness,
        physicalExam: note.physicalExam,
        assessment: note.assessment,
        plan: note.plan,
        extractedEntities: note.extractedEntities,
        prescriptions: note.prescriptions,
        transcript: note.transcript,
      };
    },
  },
  {
    name: 'get_patient_context',
    description:
      'Get patient demographics, current medications, and allergies for personalized translation context.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'The patient MongoDB ObjectId' },
      },
      required: ['patientId'],
    },
    handler: async (input: { patientId: string }, _ctx: AgentContext) => {
      const patient = await Patient.findById(input.patientId)
        .populate('userId', 'name')
        .lean();
      if (!patient) throw new Error(`Patient not found: ${input.patientId}`);

      return {
        name: (patient.userId as any)?.name ?? 'Patient',
        dateOfBirth: patient.dateOfBirth,
        allergies: patient.allergies,
        medications: patient.medications,
        chronicConditions: patient.chronicConditions,
      };
    },
  },
  {
    name: 'save_translation',
    description:
      'Save the final translated document. Call this once you have generated the complete patient-friendly translation with all sections.',
    inputSchema: {
      type: 'object',
      properties: {
        noteId: { type: 'string', description: 'Original clinical note ID' },
        simplifiedSummary: { type: 'string', description: 'Plain-language summary of the visit' },
        diagnosisExplanations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalTerm: { type: 'string' },
              simplifiedExplanation: { type: 'string' },
              whatItMeans: { type: 'string' },
              whatToDo: { type: 'string' },
            },
          },
          description: 'Each diagnosis explained in patient-friendly terms',
        },
        medicationGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              medicationName: { type: 'string' },
              purpose: { type: 'string' },
              howToTake: { type: 'string' },
              commonSideEffects: { type: 'array', items: { type: 'string' } },
              warnings: { type: 'array', items: { type: 'string' } },
              whenToCallDoctor: { type: 'string' },
            },
          },
          description: 'Patient-friendly medication instruction guides',
        },
        riskWarnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warning: { type: 'string' },
              severity: { type: 'string', enum: ['info', 'caution', 'urgent'] },
              action: { type: 'string' },
            },
          },
          description: 'Health risk warnings for the patient',
        },
        lifestyleRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['diet', 'exercise', 'sleep', 'stress', 'general'] },
              recommendation: { type: 'string' },
              details: { type: 'string' },
            },
          },
          description: 'Lifestyle recommendations based on the clinical findings',
        },
        followUpInstructions: { type: 'string', description: 'Clear follow-up visit instructions' },
      },
      required: ['noteId', 'simplifiedSummary', 'diagnosisExplanations', 'medicationGuides'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      // Store translation as an artifact (could be saved to a Translation collection in production)
      return {
        translationId: `trans_${Date.now()}`,
        message: 'Translation saved successfully',
        _artifacts: {
          translation: {
            noteId: input.noteId,
            simplifiedSummary: input.simplifiedSummary,
            diagnosisExplanations: input.diagnosisExplanations,
            medicationGuides: input.medicationGuides,
            riskWarnings: input.riskWarnings || [],
            lifestyleRecommendations: input.lifestyleRecommendations || [],
            followUpInstructions: input.followUpInstructions || '',
          },
        },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Medical Translator Agent for CARENET AI — an expert at converting complex clinical documentation into clear, empathetic, patient-friendly language.

## Your Role
You take clinical notes written in medical jargon and transform them into documents that a patient with no medical background can fully understand.

## Workflow
1. Call \`get_clinical_note\` to retrieve the clinical documentation.
2. Call \`get_patient_context\` to understand the patient's background (name, allergies, existing conditions).
3. Analyze every medical term, diagnosis, procedure, and medication in the note.
4. Generate a complete translation with:
   - **Simplified Summary**: A warm, clear 2-3 paragraph summary of the visit in everyday language
   - **Diagnosis Explanations**: Each diagnosis explained with what it is, what it means for them, and what to do
   - **Medication Guides**: For each prescription — purpose, how to take it, side effects to watch for, when to call the doctor
   - **Risk Warnings**: Any health risks needing attention, with severity and recommended action
   - **Lifestyle Recommendations**: Practical diet, exercise, sleep, and stress management advice
   - **Follow-up Instructions**: Clear next-steps in plain language
5. Call \`save_translation\` with the complete translation.

## Translation Guidelines
- Use 6th-grade reading level — no medical jargon without explanation
- Be warm and empathetic, but factual
- Address the patient by name when possible
- Use analogies to explain complex conditions (e.g., "Your arteries are like pipes that can get clogged")
- Highlight what matters most: red flags, medication interactions, and lifestyle changes
- ALWAYS mention allergies in the context of any new medications
- If a medication could interact with existing medications, flag it prominently`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createTranslatorAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Medical Translator Agent',
    description: 'Translates clinical documentation into patient-friendly language with medication guides and lifestyle recommendations.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 8,
    temperature: 0.3,
    maxTokens: 4096,
  });
}
