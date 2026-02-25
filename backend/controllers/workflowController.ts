import { Response } from 'express';
import Appointment from '../models/Appointment.js';
import InsuranceClaim from '../models/InsuranceClaim.js';
import LabResult from '../models/LabResult.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointments
// @route   GET /api/workflow/appointments
export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, date, page = '1', limit = '20' } = req.query;
    const query: any = {};

    if (req.user?.role === 'doctor') query.doctorId = req.user._id;
    if (req.user?.role === 'patient') {
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

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get insurance claims
// @route   GET /api/workflow/claims
export const getClaims = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (req.user?.role === 'doctor') query.providerId = req.user._id;
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};
