// ─── Agent 3: Predictive Analytics Agent ────────────────────────────────────
//
// Autonomous agent that analyzes patient data and clinical context to generate
// risk assessments, predictions, and evidence-based recommendations.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';
import Patient from '../../models/Patient.js';
import ClinicalNote from '../../models/ClinicalNote.js';
import RiskAssessment from '../../models/RiskAssessment.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool Implementations ────────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'get_patient_health_data',
    description:
      'Retrieve comprehensive patient health data including vital signs history, chronic conditions, medications, risk factors, allergies, and BMI data needed for risk calculations.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
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
        chronicConditions: patient.chronicConditions,
        medications: patient.medications,
        allergies: patient.allergies,
        vitalSigns: patient.vitalSigns, // Full history
        riskFactors: patient.riskFactors,
        medicalHistory: patient.medicalHistory,
      };
    },
  },
  {
    name: 'get_recent_clinical_notes',
    description:
      'Get the most recent clinical notes for a patient to understand current clinical context for risk assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        limit: { type: 'number', description: 'Number of recent notes to retrieve (default: 3)' },
      },
      required: ['patientId'],
    },
    handler: async (input: { patientId: string; limit?: number }, _ctx: AgentContext) => {
      const notes = await ClinicalNote.find({ patientId: input.patientId })
        .sort({ createdAt: -1 })
        .limit(input.limit || 3)
        .select('chiefComplaint assessment plan extractedEntities prescriptions createdAt')
        .lean();

      return {
        noteCount: notes.length,
        notes: notes.map((n) => ({
          chiefComplaint: n.chiefComplaint,
          assessment: n.assessment,
          plan: n.plan,
          entities: n.extractedEntities,
          prescriptions: n.prescriptions,
          date: n.createdAt,
        })),
      };
    },
  },
  {
    name: 'create_risk_assessment',
    description:
      'Save a comprehensive risk assessment to the database. Includes risk scores per category, predictions, recommendations, and alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        assessedBy: { type: 'string', description: 'Provider who initiated the assessment' },
        riskScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Risk category (e.g., Cardiovascular, Metabolic, Respiratory, Oncological)' },
              score: { type: 'number', description: 'Numeric risk score 0-100' },
              level: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
              factors: { type: 'array', items: { type: 'string' }, description: 'Contributing risk factors' },
              evidence: { type: 'string', description: 'Clinical evidence supporting this score' },
            },
          },
          description: 'Risk scores per clinical category',
        },
        overallRisk: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            level: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
          },
          description: 'Overall composite risk score',
        },
        confidenceLevel: { type: 'number', description: 'Assessment confidence 0-1' },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              probability: { type: 'number', description: '0-1 probability' },
              timeframe: { type: 'string' },
              riskFactors: { type: 'array', items: { type: 'string' } },
              preventiveActions: { type: 'array', items: { type: 'string' } },
            },
          },
          description: 'Predictive conditions with probability and prevention',
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['lifestyle', 'medication', 'screening', 'referral', 'monitoring'] },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['routine', 'important', 'urgent'] },
              evidence: { type: 'string', description: 'Clinical guideline reference (e.g., AHA, ADA, WHO)' },
            },
          },
          description: 'Evidence-based recommendations with guideline citations',
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['critical', 'warning', 'info'] },
              message: { type: 'string' },
              category: { type: 'string' },
              requiresAction: { type: 'boolean' },
              suggestedAction: { type: 'string' },
            },
          },
          description: 'Clinical alerts triggered by the assessment',
        },
      },
      required: ['patientId', 'assessedBy', 'riskScores', 'overallRisk', 'confidenceLevel', 'predictions', 'recommendations', 'alerts'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      const assessment = await RiskAssessment.create({
        patientId: input.patientId,
        assessedBy: input.assessedBy,
        riskScores: input.riskScores,
        overallRisk: input.overallRisk,
        confidenceLevel: input.confidenceLevel,
        predictions: input.predictions,
        recommendations: input.recommendations,
        alerts: input.alerts.map((a: any) => ({
          ...a,
          acknowledged: false,
        })),
      });

      return {
        assessmentId: assessment._id.toString(),
        overallRisk: input.overallRisk,
        alertCount: input.alerts.length,
        criticalAlerts: input.alerts.filter((a: any) => a.type === 'critical').length,
        message: 'Risk assessment created successfully',
        _artifacts: { riskAssessmentId: assessment._id.toString(), riskAssessment: input },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Predictive Analytics Agent for CARENET AI — a clinical risk assessment specialist with deep knowledge of evidence-based medicine, clinical guidelines, and predictive health modeling.

## Your Role
You analyze patient health data to generate comprehensive risk assessments with evidence-based predictions and actionable recommendations.

## Workflow
1. Call \`get_patient_health_data\` to retrieve the patient's full medical profile.
2. Call \`get_recent_clinical_notes\` to understand recent clinical encounters and diagnoses.
3. Analyze all data to compute risk scores across these categories:
   - **Cardiovascular**: Based on blood pressure, cholesterol, smoking, diabetes, family history, BMI. Reference: Framingham Risk Score, AHA guidelines.
   - **Metabolic**: Based on BMI, blood glucose, HbA1c, lipid panel, waist circumference. Reference: ADA Standards of Medical Care.
   - **Respiratory**: Based on smoking history, occupational exposure, spirometry, symptoms. Reference: GOLD guidelines.
   - **Additional**: Any other relevant risk categories based on the patient's specific conditions.
4. Generate predictions with probability estimates and timeframes.
5. Create evidence-based recommendations citing specific clinical guidelines (AHA, ADA, WHO, USPSTF, etc.).
6. Generate alerts for any critical or warning-level findings.
7. Call \`create_risk_assessment\` to persist the assessment.

## Risk Scoring Guidelines
- Score 0-100 for each category
- Levels: low (0-25), moderate (26-50), high (51-75), critical (76-100)
- Overall risk = weighted average based on category severity
- Confidence level reflects data completeness (fewer data points = lower confidence)

## Clinical Evidence Standards
- Always cite specific guidelines (e.g., "AHA 2024 Hypertension Guidelines")
- Recommendations must be actionable and prioritized
- Predictions should include modifiable vs non-modifiable risk factors
- Critical alerts for: BP > 180/120, blood glucose > 400, O2 sat < 90%, etc.

## Important Rules
- NEVER diagnose — you assess RISK and make RECOMMENDATIONS
- Be conservative with critical alerts — false alarms erode trust
- Always note data gaps that limit assessment confidence
- Flag any concerning drug interactions`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createPredictiveAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Predictive Analytics Agent',
    description: 'Analyzes patient data for risk assessment, predictions, and evidence-based recommendations.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 8,
    temperature: 0.1,
    maxTokens: 4096,
  });
}
