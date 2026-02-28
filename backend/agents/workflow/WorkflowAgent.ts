// ─── Agent 5: Workflow Automation Agent ──────────────────────────────────────
//
// Autonomous agent that manages healthcare workflows: scheduling appointments,
// creating insurance claims, ordering lab tests — with intelligent decision-making
// based on clinical context and risk assessment results.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';
import Appointment from '../../models/Appointment.js';
import InsuranceClaim from '../../models/InsuranceClaim.js';
import LabResult from '../../models/LabResult.js';
import Patient from '../../models/Patient.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool Implementations ────────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'get_doctor_schedule',
    description:
      'Retrieve the doctor\'s upcoming appointments to check for scheduling conflicts before creating new ones.',
    inputSchema: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Doctor/Provider MongoDB ObjectId' },
        fromDate: { type: 'string', description: 'ISO date string — start of range to check' },
        toDate: { type: 'string', description: 'ISO date string — end of range to check' },
      },
      required: ['doctorId', 'fromDate'],
    },
    handler: async (input: { doctorId: string; fromDate: string; toDate?: string }, _ctx: AgentContext) => {
      const from = new Date(input.fromDate);
      const to = input.toDate ? new Date(input.toDate) : new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks default

      const appointments = await Appointment.find({
        doctorId: input.doctorId,
        scheduledDate: { $gte: from, $lte: to },
        status: { $in: ['scheduled', 'confirmed'] },
      })
        .sort({ scheduledDate: 1 })
        .select('scheduledDate duration type status patientId')
        .lean();

      return {
        doctorId: input.doctorId,
        range: { from: from.toISOString(), to: to.toISOString() },
        appointmentCount: appointments.length,
        appointments: appointments.map((a: any) => ({
          date: a.scheduledDate,
          duration: a.duration,
          type: a.type,
          status: a.status,
        })),
      };
    },
  },
  {
    name: 'create_appointment',
    description:
      'Schedule a new appointment for a patient. Automatically checks for conflicts. Set priority based on risk assessment results.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        doctorId: { type: 'string', description: 'Doctor MongoDB ObjectId' },
        scheduledDate: { type: 'string', description: 'ISO datetime for the appointment' },
        duration: { type: 'number', description: 'Appointment duration in minutes (15, 30, 45, 60)' },
        type: {
          type: 'string',
          enum: ['checkup', 'follow_up', 'consultation', 'procedure', 'emergency', 'lab_review'],
          description: 'Appointment type',
        },
        priority: {
          type: 'string',
          enum: ['routine', 'urgent', 'emergency'],
          description: 'Priority based on clinical assessment',
        },
        reason: { type: 'string', description: 'Reason for the appointment' },
        notes: { type: 'string', description: 'Additional notes for the appointment' },
      },
      required: ['patientId', 'doctorId', 'scheduledDate', 'duration', 'type', 'priority', 'reason'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      // Conflict detection
      const scheduledDate = new Date(input.scheduledDate);
      const endTime = new Date(scheduledDate.getTime() + input.duration * 60000);

      const conflict = await Appointment.findOne({
        doctorId: input.doctorId,
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledDate: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ['$scheduledDate', { $multiply: ['$duration', 60000] }] },
            scheduledDate,
          ],
        },
      });

      if (conflict) {
        return {
          success: false,
          message: `Scheduling conflict detected at ${(conflict as any).scheduledDate}. Please choose a different time.`,
          conflictWith: (conflict as any).scheduledDate,
        };
      }

      // Map agent enum values to Mongoose enum values
      const typeMap: Record<string, string> = { follow_up: 'follow-up', lab_review: 'consultation' };
      const priorityMap: Record<string, string> = { routine: 'normal', emergency: 'urgent' };

      const appointment = await Appointment.create({
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledDate,
        duration: input.duration,
        type: typeMap[input.type] || input.type,
        status: 'scheduled',
        priority: priorityMap[input.priority] || input.priority,
        reason: input.reason,
        notes: input.notes || '',
      });

      return {
        success: true,
        appointmentId: appointment._id.toString(),
        scheduledDate: scheduledDate.toISOString(),
        message: `Appointment scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`,
        _artifacts: { appointments: [{ id: appointment._id.toString(), date: scheduledDate.toISOString(), type: input.type }] },
      };
    },
  },
  {
    name: 'create_insurance_claim',
    description:
      'Create a new insurance claim based on the clinical encounter. Uses diagnosis and procedure codes from the clinical note.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        providerId: { type: 'string', description: 'Provider MongoDB ObjectId' },
        clinicalNoteId: { type: 'string', description: 'Associated clinical note ID' },
        diagnosisCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'ICD-10 code' },
              description: { type: 'string' },
            },
          },
          description: 'Diagnosis codes from the clinical note',
        },
        procedureCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'CPT code' },
              description: { type: 'string' },
              charge: { type: 'number' },
            },
          },
          description: 'Procedure/CPT codes and charges',
        },
        totalAmount: { type: 'number', description: 'Total claim amount in USD' },
      },
      required: ['patientId', 'providerId', 'diagnosisCodes', 'procedureCodes', 'totalAmount'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      const patient = await Patient.findById(input.patientId).lean();
      const insuranceProvider = (patient as any)?.insurance?.provider || 'Unknown';

      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const claim = await InsuranceClaim.create({
        patientId: input.patientId,
        providerId: input.providerId,
        clinicalNoteId: input.clinicalNoteId,
        claimNumber,
        insuranceProvider,
        policyNumber: (patient as any)?.insurance?.policyNumber || 'N/A',
        diagnosisCodes: input.diagnosisCodes,
        procedureCodes: input.procedureCodes,
        totalAmount: input.totalAmount,
        status: 'draft',
        auditTrail: [{
          action: 'created',
          performedBy: input.providerId,
          performedAt: new Date(),
          details: 'Auto-generated by CARENET Workflow Agent',
        }],
      });

      return {
        success: true,
        claimId: (claim as any)._id.toString(),
        claimNumber,
        status: 'draft',
        message: `Insurance claim ${claimNumber} created (draft) for $${input.totalAmount}`,
        _artifacts: { insuranceClaims: [{ id: (claim as any)._id.toString(), claimNumber, amount: input.totalAmount }] },
      };
    },
  },
  {
    name: 'create_lab_order',
    description:
      'Order lab tests for a patient. Creates a lab result record in "ordered" status. Determine which labs are needed based on the clinical context and risk assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        orderedBy: { type: 'string', description: 'Ordering provider ID' },
        testName: { type: 'string', description: 'Name of the lab test (e.g., "Complete Blood Count", "Lipid Panel", "HbA1c")' },
        category: {
          type: 'string',
          enum: ['hematology', 'chemistry', 'immunology', 'microbiology', 'pathology', 'urinalysis'],
          description: 'Lab test category',
        },
        priority: {
          type: 'string',
          enum: ['routine', 'urgent', 'stat'],
          description: 'Lab order priority',
        },
        reason: { type: 'string', description: 'Clinical reason for ordering the test' },
        expectedParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              unit: { type: 'string' },
              referenceRange: { type: 'string' },
            },
          },
          description: 'Expected parameters to be measured',
        },
      },
      required: ['patientId', 'orderedBy', 'testName', 'category', 'priority', 'reason'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      const labOrder = await LabResult.create({
        patientId: input.patientId,
        orderedBy: input.orderedBy,
        testName: input.testName,
        category: input.category,
        status: 'ordered',
        results: (input.expectedParameters || []).map((p: any) => ({
          parameter: p.parameter,
          value: '',
          unit: p.unit || '',
          referenceRange: p.referenceRange || '',
          status: 'normal',
        })),
        notes: `Priority: ${input.priority}. Reason: ${input.reason}`,
      });

      return {
        success: true,
        labOrderId: labOrder._id.toString(),
        testName: input.testName,
        status: 'ordered',
        message: `Lab order created: ${input.testName} (${input.priority})`,
        _artifacts: { labOrders: [{ id: labOrder._id.toString(), test: input.testName, priority: input.priority }] },
      };
    },
  },
  {
    name: 'get_patient_insurance',
    description:
      'Get the patient\'s insurance information for claim creation.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
      },
      required: ['patientId'],
    },
    handler: async (input: { patientId: string }, _ctx: AgentContext) => {
      const patient = await Patient.findById(input.patientId).select('insurance').lean();
      if (!patient) throw new Error(`Patient not found: ${input.patientId}`);

      return {
        insurance: (patient as any).insurance || { provider: 'Not on file', policyNumber: 'N/A' },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Workflow Automation Agent for CARENET AI — an expert healthcare operations manager that automates clinical workflows.

## Your Role
Based on the clinical encounter results (clinical note, risk assessment, research findings), you autonomously create the appropriate follow-up actions: appointments, insurance claims, and lab orders.

## Workflow
You receive pipeline context including the clinical note, risk assessment, and research synthesis. Based on this:

### 1. Schedule Follow-Up Appointments
- Check the doctor's schedule with \`get_doctor_schedule\`
- Schedule appropriate follow-up based on risk level:
  - **Critical risk**: Urgent follow-up within 3 days
  - **High risk**: Follow-up within 7 days
  - **Moderate risk**: Follow-up within 14 days
  - **Low risk**: Routine follow-up within 30 days
- If there's a scheduling conflict, try the next available slot
- Set appointment type based on clinical context (follow_up, lab_review, consultation)

### 2. Create Insurance Claims (if applicable)
- Check if the patient has insurance via \`get_patient_insurance\`
- Extract diagnosis codes (ICD-10) and procedure codes (CPT) from the clinical note
- Calculate appropriate charges based on visit type and procedures
- Create a draft claim via \`create_insurance_claim\`

### 3. Order Lab Tests
- Based on the clinical note, risk assessment, and recommendations:
  - If cardiovascular risk is elevated → order Lipid Panel, BMP
  - If metabolic risk is elevated → order HbA1c, Fasting Glucose, Lipid Panel
  - If respiratory concerns → order Pulmonary Function Tests, CBC
  - Any recommended screenings from the predictive agent → order them
- Use \`create_lab_order\` for each test

## Decision-Making Rules
- ALWAYS schedule a follow-up appointment — at minimum a routine follow-up
- Only create insurance claims if the patient has insurance information
- Only order labs that are clinically justified and not recently done (check context)
- Set priorities appropriately — don't over-escalate routine findings
- Include clear clinical justification for every action

## Important Rules
- Check for scheduling conflicts before booking
- Insurance claims must have valid diagnosis and procedure codes
- Lab orders should include expected parameters with reference ranges
- Document the clinical reasoning for each workflow action`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createWorkflowAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Workflow Automation Agent',
    description: 'Autonomously manages follow-up scheduling, insurance claims, and lab orders based on clinical context.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 12,
    temperature: 0.1,
    maxTokens: 4096,
  });
}
