import { Response } from 'express';
import Appointment from '../models/Appointment.js';
import InsuranceClaim from '../models/InsuranceClaim.js';
import LabResult from '../models/LabResult.js';
import Patient from '../models/Patient.js';
import ClinicalNote from '../models/ClinicalNote.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';
import { createWorkflowAgent } from '../agents/workflow/WorkflowAgent.js';

// ============ APPOINTMENTS ============

// @desc    Create appointment
// @route   POST /api/workflow/appointments
export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, scheduledDate, duration, type, priority, reason, notes } = req.body;

    // Check for conflicting appointments
    const conflictStart = new Date(scheduledDate);
    const conflictEnd = new Date(conflictStart.getTime() + (duration || 30) * 60000);

    const conflict = await Appointment.findOne({
      doctorId: doctorId || req.user?._id,
      status: { $in: ['scheduled', 'confirmed'] },
      scheduledDate: { $gte: conflictStart, $lt: conflictEnd },
    });

    if (conflict) {
      res.status(409).json({ success: false, message: 'Time slot conflict — please choose another time' });
      return;
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId: doctorId || req.user?._id,
      scheduledDate,
      duration: duration || 30,
      type,
      priority: priority || 'normal',
      reason,
      notes,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to create appointment');
  }
};

// @desc    Get appointments
// @route   GET /api/workflow/appointments
export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, date, page = '1', limit = '20', patientId: qPatientId } = req.query;
    const query: any = {};

    // Allow explicit patientId filter (for doctor/admin viewing a specific patient)
    if (qPatientId) {
      query.patientId = qPatientId;
    } else if (req.user?.role === 'doctor') {
      query.doctorId = req.user._id;
    } else if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) query.patientId = patient._id;
    }
    if (status) query.status = status;
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: dayStart, $lte: dayEnd };
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('doctorId', 'name specialization avatar')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ scheduledDate: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch appointments');
  }
};

// @desc    Update appointment status
// @route   PUT /api/workflow/appointments/:id
export const updateAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, scheduledDate, notes, cancelReason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, scheduledDate, notes, cancelReason },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    res.json({ success: true, data: appointment });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to update appointment');
  }
};

// ============ INSURANCE CLAIMS ============

// @desc    Create insurance claim
// @route   POST /api/workflow/claims
export const createClaim = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, clinicalNoteId, insuranceProvider, policyNumber,
            diagnosisCodes, procedureCodes, totalAmount, notes } = req.body;

    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const claim = await InsuranceClaim.create({
      patientId,
      providerId: req.user?._id,
      clinicalNoteId,
      claimNumber,
      insuranceProvider,
      policyNumber,
      diagnosisCodes: diagnosisCodes || [],
      procedureCodes: procedureCodes || [],
      totalAmount,
      notes,
      auditTrail: [{
        action: 'Created',
        performedBy: req.user?._id,
        performedAt: new Date(),
        details: 'Insurance claim draft created',
      }],
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to create claim');
  }
};

// @desc    Get insurance claims
// @route   GET /api/workflow/claims
export const getClaims = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '10', patientId: qPatientId } = req.query;
    const query: any = {};

    // Allow explicit patientId filter (for doctor/admin viewing a specific patient)
    if (qPatientId) {
      query.patientId = qPatientId;
    } else if (req.user?.role === 'doctor') {
      query.providerId = req.user._id;
    }
    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const claims = await InsuranceClaim.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('providerId', 'name')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await InsuranceClaim.countDocuments(query);

    res.json({
      success: true,
      data: claims,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch claims');
  }
};

// @desc    Update claim status
// @route   PUT /api/workflow/claims/:id
export const updateClaim = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, approvedAmount, denialReason } = req.body;

    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ success: false, message: 'Claim not found' });
      return;
    }

    claim.status = status || claim.status;
    if (status === 'submitted') claim.submittedDate = new Date();
    if (status === 'approved' || status === 'denied') claim.processedDate = new Date();
    if (approvedAmount) claim.approvedAmount = approvedAmount;
    if (denialReason) claim.denialReason = denialReason;

    claim.auditTrail.push({
      action: `Status updated to ${status}`,
      performedBy: req.user!._id,
      performedAt: new Date(),
      details: denialReason || `Claim ${status}`,
    });

    await claim.save();
    res.json({ success: true, data: claim });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to update claim');
  }
};

// ============ LAB RESULTS ============

// @desc    Create lab result
// @route   POST /api/workflow/labs
export const createLabResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, testName, category, results, notes } = req.body;

    const labResult = await LabResult.create({
      patientId,
      orderedBy: req.user?._id,
      testName,
      category,
      results: results || [],
      notes,
    });

    res.status(201).json({ success: true, data: labResult });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to create lab result');
  }
};

// @desc    Get lab results
// @route   GET /api/workflow/labs
export const getLabResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, status, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) query.patientId = patient._id;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const labs = await LabResult.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('orderedBy', 'name')
      .populate('reviewedBy', 'name')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await LabResult.countDocuments(query);

    res.json({
      success: true,
      data: labs,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch lab results');
  }
};

// @desc    Update lab result status
// @route   PUT /api/workflow/labs/:id
export const updateLabResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, results, notes } = req.body;

    const lab = await LabResult.findById(req.params.id);
    if (!lab) {
      res.status(404).json({ success: false, message: 'Lab result not found' });
      return;
    }

    if (status) lab.status = status;
    if (results) lab.results = results;
    if (notes) lab.notes = notes;
    if (status === 'completed') lab.completedDate = new Date();
    if (status === 'reviewed') {
      lab.reviewedBy = req.user!._id;
      lab.reviewedAt = new Date();
    }

    await lab.save();
    res.json({ success: true, data: lab });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to update lab result');
  }
};

// ============ WORKFLOW AI AGENT ============

// @desc    Auto-generate workflow actions from a clinical note using the AI agent
// @route   POST /api/workflow/auto-generate
// @access  Doctor, Admin
export const autoGenerateWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clinicalNoteId, patientId } = req.body;

    if (!clinicalNoteId) {
      res.status(400).json({ success: false, message: 'clinicalNoteId is required' });
      return;
    }

    // ── Fetch clinical note ──────────────────────────────────────────────
    const note = await ClinicalNote.findById(clinicalNoteId)
      .populate('patientId')
      .populate('providerId', 'name specialization _id')
      .lean();

    if (!note) {
      res.status(404).json({ success: false, message: 'Clinical note not found' });
      return;
    }

    const resolvedPatientId = patientId || String((note as any).patientId?._id || (note as any).patientId);

    // ── Fetch full patient profile ───────────────────────────────────────
    const patient = await Patient.findById(resolvedPatientId)
      .populate('userId', 'name email phone')
      .lean();

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const providerIdStr = String((note as any).providerId?._id || (note as any).providerId || req.user!._id);
    const patientName = (patient as any).userId?.name || 'Unknown patient';
    const latestVitals = (patient as any).vitalSigns?.at(-1);

    // ── Build rich context prompt ────────────────────────────────────────
    const contextMessage = `
You are the CARENET Workflow Automation Agent. A new clinical note has been created. Your job is to autonomously create the appropriate follow-up workflow actions.

## Patient Information
- **Patient ID**: ${resolvedPatientId}
- **Name**: ${patientName}
- **Date of Birth**: ${(patient as any).dateOfBirth ? new Date((patient as any).dateOfBirth).toLocaleDateString() : 'N/A'}
- **Blood Group**: ${(patient as any).bloodGroup || 'Unknown'}
- **Chronic Conditions**: ${(patient as any).chronicConditions?.join(', ') || 'None documented'}
- **Known Allergies**: ${(patient as any).allergies?.join(', ') || 'NKDA'}
- **Current Medications**: ${(patient as any).medications?.map((m: any) => `${m.name} ${m.dosage} ${m.frequency}`).join('; ') || 'None'}
- **Insurance Provider**: ${(patient as any).insurance?.provider || 'Not on file'}
- **Policy Number**: ${(patient as any).insurance?.policyNumber || 'N/A'}
${latestVitals ? `- **Latest Vitals** (recorded ${new Date(latestVitals.recordedAt || Date.now()).toLocaleDateString()}):
  - BP: ${latestVitals.bloodPressure?.systolic || '?'}/${latestVitals.bloodPressure?.diastolic || '?'} mmHg
  - HR: ${latestVitals.heartRate || '?'} bpm
  - Temp: ${latestVitals.temperature || '?'} °F
  - Weight: ${latestVitals.weight || '?'} kg
  - SpO2: ${latestVitals.oxygenSaturation || '?'}%` : ''}

## Clinical Note (ID: ${clinicalNoteId})
- **Note Type**: ${(note as any).noteType}
- **Date**: ${new Date((note as any).createdAt).toLocaleDateString()}
- **Chief Complaint**: ${(note as any).chiefComplaint || 'N/A'}
- **History of Present Illness**: ${(note as any).historyOfPresentIllness || 'N/A'}
- **Assessment / Diagnoses**:
${((note as any).assessment || []).map((a: any) => `  - ${a.diagnosis || a} (severity: ${a.severity || 'unspecified'})`).join('\n') || '  None recorded'}
- **Plan / Treatments**:
${((note as any).plan || []).map((p: any) => `  - ${p.treatment || p}`).join('\n') || '  None recorded'}
- **Prescriptions**: ${((note as any).prescriptions || []).map((p: any) => `${p.medication || p.name} ${p.dosage || ''}`).join(', ') || 'None'}
- **Transcript excerpt**: ${((note as any).transcript || '').substring(0, 400) || 'N/A'}

## Your Tasks
1. **APPOINTMENTS**: Use \`get_doctor_schedule\` for doctor ${providerIdStr} then schedule an appropriate follow-up appointment for patient ${resolvedPatientId}. Base urgency on the assessment severity. Today is ${new Date().toISOString()}.
2. **INSURANCE CLAIM**: If the patient has insurance, create a draft insurance claim using diagnosis and CPT codes derived from the note's assessment and plan. Associate it with clinical note ${clinicalNoteId}.
3. **LAB ORDERS**: Order any lab tests clinically indicated by the assessment, chronic conditions, and clinical plan. For each test, specify the appropriate parameters.

Proceed autonomously — execute all applicable workflow steps now.
`.trim();

    // ── Run the Workflow Agent ───────────────────────────────────────────
    const agent = createWorkflowAgent();
    const agentContext = {
      patientId: resolvedPatientId,
      providerId: providerIdStr,
      pipelineState: {
        pipelineId: `manual-${Date.now()}`,
        patientId: resolvedPatientId,
        providerId: providerIdStr,
        clinicalNoteId,
        clinicalNote: note,
        stepResults: {},
        errors: [],
        startedAt: new Date(),
        status: 'running' as const,
      },
    };

    const result = await agent.run(contextMessage, agentContext);

    res.json({
      success: true,
      data: {
        agentName: result.agentName,
        summary: result.output,
        toolCalls: result.toolCalls.map((tc) => ({
          tool: tc.toolName,
          success: tc.success,
          durationMs: tc.durationMs,
        })),
        artifacts: result.artifacts,
        tokensUsed: result.tokensUsed,
        durationMs: result.durationMs,
        patientId: resolvedPatientId,
        clinicalNoteId,
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Workflow agent failed');
  }
};
