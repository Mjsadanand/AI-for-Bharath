// ─── Agent 1: Clinical Documentation Agent ──────────────────────────────────
//
// Autonomous agent that processes patient transcripts, extracts medical entities
// via LLM reasoning, and generates structured clinical notes.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';
import Patient from '../../models/Patient.js';
import ClinicalNote from '../../models/ClinicalNote.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool Implementations ────────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'get_patient_record',
    description:
      'Retrieve the full patient medical record including demographics, chronic conditions, current medications, allergies, vital signs, and medical history. Use this first to understand the patient context before processing a transcript.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'The MongoDB ObjectId of the patient' },
      },
      required: ['patientId'],
    },
    handler: async (input: { patientId: string }, _ctx: AgentContext) => {
      const patient = await Patient.findById(input.patientId)
        .populate('userId', 'name email')
        .lean();

      if (!patient) throw new Error(`Patient not found: ${input.patientId}`);

      return {
        id: patient._id,
        name: (patient.userId as any)?.name ?? 'Unknown',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        medications: patient.medications,
        vitalSigns: patient.vitalSigns?.slice(-3), // Last 3 readings
        medicalHistory: patient.medicalHistory?.slice(-5),
        riskFactors: patient.riskFactors,
        insurance: patient.insurance,
      };
    },
  },
  {
    name: 'create_clinical_note',
    description:
      'Save a structured clinical note to the database. Call this after you have analyzed the transcript and extracted all medical entities. The note should follow SOAP format with assessment and plan arrays.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        providerId: { type: 'string', description: 'Provider/Doctor MongoDB ObjectId' },
        noteType: {
          type: 'string',
          enum: ['progress_note', 'initial_consultation', 'follow_up', 'discharge_summary', 'procedure_note'],
          description: 'Type of clinical note',
        },
        chiefComplaint: { type: 'string', description: 'Primary reason for the visit' },
        historyOfPresentIllness: { type: 'string', description: 'Detailed narrative of the present illness' },
        physicalExam: { type: 'string', description: 'Physical examination findings' },
        assessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diagnosis: { type: 'string' },
              icdCode: { type: 'string' },
              severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
              notes: { type: 'string' },
            },
          },
          description: 'Array of diagnostic assessments',
        },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              treatment: { type: 'string' },
              priority: { type: 'string', enum: ['routine', 'urgent', 'emergent'] },
              details: { type: 'string' },
            },
          },
          description: 'Treatment plan items',
        },
        extractedEntities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['symptom', 'diagnosis', 'medication', 'procedure', 'lab_test', 'vital_sign'] },
              value: { type: 'string' },
              confidence: { type: 'number', description: 'Confidence score 0-1' },
              context: { type: 'string', description: 'Surrounding text context' },
            },
          },
          description: 'Medical entities extracted from the transcript by AI',
        },
        prescriptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              medication: { type: 'string' },
              dosage: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              instructions: { type: 'string' },
            },
          },
          description: 'Medications prescribed during this encounter',
        },
        transcript: { type: 'string', description: 'Original transcript text' },
      },
      required: ['patientId', 'providerId', 'noteType', 'chiefComplaint', 'assessment', 'plan', 'extractedEntities'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      const note = await ClinicalNote.create({
        patientId: input.patientId,
        providerId: input.providerId,
        noteType: input.noteType,
        chiefComplaint: input.chiefComplaint,
        historyOfPresentIllness: input.historyOfPresentIllness || '',
        physicalExam: input.physicalExam || '',
        assessment: input.assessment,
        plan: input.plan,
        extractedEntities: input.extractedEntities,
        prescriptions: input.prescriptions || [],
        transcript: input.transcript || '',
        verificationStatus: 'pending',
      });

      return {
        noteId: note._id.toString(),
        message: 'Clinical note created successfully',
        verificationStatus: 'pending',
        _artifacts: { clinicalNoteId: note._id.toString() },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Clinical Documentation Agent for CARENET AI — an expert medical scribe and NLP specialist.

## Your Role
You process patient encounter transcripts and generate structured, accurate clinical documentation following medical standards.

## Workflow
1. **ALWAYS** start by calling \`get_patient_record\` to understand the patient's existing medical context (conditions, medications, allergies, history).
2. Carefully analyze the provided transcript, cross-referencing with the patient's known conditions.
3. Extract ALL medical entities (symptoms, diagnoses, medications, procedures, lab tests, vital signs) with confidence scores.
4. Generate a structured clinical note in SOAP format with:
   - Accurate chief complaint
   - Detailed history of present illness narrative
   - Physical exam findings (if mentioned)
   - Assessment with ICD-10 codes and severity levels
   - Treatment plan with priorities
   - Prescriptions (if any medications are discussed)
5. Call \`create_clinical_note\` to save the note.
6. Return a summary of what was documented.

## Entity Extraction Guidelines
- Assign confidence scores: 0.95+ for explicitly stated, 0.8-0.94 for strongly implied, 0.6-0.79 for possibly mentioned
- Always capture the surrounding text context for each entity
- Map diagnoses to ICD-10 codes where possible (use your medical knowledge)

## Important Rules
- NEVER fabricate medical information not present in the transcript
- If the transcript is unclear, note it as "unclear" with lower confidence
- Always preserve the patient's own words for chief complaint when possible
- Flag any potential drug interactions with existing medications
- Note any discrepancies between stated conditions and medical history`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createClinicalDocAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Clinical Documentation Agent',
    description: 'Processes patient transcripts, extracts medical entities, and generates structured SOAP clinical notes.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 8,
    temperature: 0.1,
    maxTokens: 4096,
  });
}
