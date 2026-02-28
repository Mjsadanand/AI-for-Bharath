import { Response } from 'express';
import ClinicalNote from '../models/ClinicalNote.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

// Medical entity extraction simulation (in production, use NLP models)
const extractMedicalEntities = (text: string) => {
  const entities: { type: string; value: string; confidence: number }[] = [];

  // Symptom patterns
  const symptomPatterns = [
    'headache', 'fever', 'cough', 'fatigue', 'nausea', 'pain', 'dizziness',
    'shortness of breath', 'chest pain', 'sore throat', 'vomiting', 'diarrhea',
    'rash', 'swelling', 'weight loss', 'insomnia', 'anxiety', 'depression',
    'numbness', 'tingling', 'blurred vision', 'abdominal pain', 'back pain',
  ];

  // Medication patterns
  const medicationPatterns = [
    'amoxicillin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
    'atorvastatin', 'omeprazole', 'amlodipine', 'metoprolol', 'aspirin',
    'levothyroxine', 'prednisone', 'albuterol', 'gabapentin', 'losartan',
  ];

  // Diagnosis patterns
  const diagnosisPatterns = [
    'hypertension', 'diabetes', 'asthma', 'pneumonia', 'bronchitis',
    'pharyngitis', 'sinusitis', 'urinary tract infection', 'anemia',
    'arthritis', 'migraine', 'gastritis', 'hypothyroidism', 'hyperlipidemia',
  ];

  const lowerText = text.toLowerCase();

  symptomPatterns.forEach((s) => {
    if (lowerText.includes(s)) {
      entities.push({ type: 'symptom', value: s, confidence: 0.85 + Math.random() * 0.15 });
    }
  });

  medicationPatterns.forEach((m) => {
    if (lowerText.includes(m)) {
      entities.push({ type: 'medication', value: m, confidence: 0.9 + Math.random() * 0.1 });
    }
  });

  diagnosisPatterns.forEach((d) => {
    if (lowerText.includes(d)) {
      entities.push({ type: 'diagnosis', value: d, confidence: 0.8 + Math.random() * 0.2 });
    }
  });

  return entities;
};

// @desc    Create clinical note from consultation
// @route   POST /api/clinical-docs
export const createClinicalNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      patientId, noteType, chiefComplaint, historyOfPresentIllness,
      physicalExam, assessment, plan, transcript, prescriptions,
    } = req.body;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    // Extract medical entities from transcript/complaint
    const textToAnalyze = `${chiefComplaint} ${historyOfPresentIllness || ''} ${transcript || ''}`;
    const extractedEntities = extractMedicalEntities(textToAnalyze);

    const clinicalNote = await ClinicalNote.create({
      patientId,
      providerId: req.user?._id,
      noteType,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExam,
      assessment,
      plan,
      transcript,
      extractedEntities,
      prescriptions,
      verificationStatus: 'pending',
    });

    res.status(201).json({ success: true, data: clinicalNote });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to create clinical note');
  }
};

// @desc    Get all clinical notes (with filters)
// @route   GET /api/clinical-docs
export const getClinicalNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const { patientId, status, noteType } = req.query;

    const query: any = {};
    if (req.user?.role === 'doctor') query.providerId = req.user._id;
    if (patientId && typeof patientId === 'string') query.patientId = patientId;
    if (status && typeof status === 'string') {
      const allowedStatuses = ['pending', 'verified', 'rejected', 'amended'];
      if (allowedStatuses.includes(status)) query.verificationStatus = status;
    }
    if (noteType && typeof noteType === 'string') {
      const allowedTypes = ['consultation', 'follow_up', 'procedure', 'discharge', 'progress'];
      if (allowedTypes.includes(noteType)) query.noteType = noteType;
    }

    const notes = await ClinicalNote.find(query)
      .populate('patientId', 'userId')
      .populate('providerId', 'name specialization')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ sessionDate: -1 });

    const total = await ClinicalNote.countDocuments(query);

    res.json({
      success: true,
      data: notes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch clinical notes');
  }
};

// @desc    Get single clinical note
// @route   GET /api/clinical-docs/:id
export const getClinicalNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await ClinicalNote.findById(req.params.id)
      .populate('patientId')
      .populate('providerId', 'name specialization')
      .populate('verifiedBy', 'name');

    if (!note) {
      res.status(404).json({ success: false, message: 'Clinical note not found' });
      return;
    }

    res.json({ success: true, data: note });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch clinical note');
  }
};

// @desc    Verify clinical note (doctor approval)
// @route   PUT /api/clinical-docs/:id/verify
export const verifyClinicalNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, amendments } = req.body; // action: 'verify' | 'reject' | 'amend'

    const note = await ClinicalNote.findById(req.params.id);
    if (!note) {
      res.status(404).json({ success: false, message: 'Clinical note not found' });
      return;
    }

    if (action === 'verify') {
      note.verificationStatus = 'verified';
    } else if (action === 'reject') {
      note.verificationStatus = 'rejected';
    } else if (action === 'amend') {
      note.verificationStatus = 'amended';
      if (amendments) {
        // Whitelist allowed amendment fields only
        const { assessment, plan, historyOfPresentIllness } = amendments;
        if (assessment !== undefined) note.assessment = assessment;
        if (plan !== undefined) note.plan = plan;
        if (historyOfPresentIllness !== undefined) note.historyOfPresentIllness = historyOfPresentIllness;
      }
    }

    note.verifiedBy = req.user?._id;
    note.verifiedAt = new Date();
    await note.save();

    res.json({ success: true, data: note });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to verify clinical note');
  }
};

// @desc    Process transcript (simulate speech-to-text → entity extraction → note generation)
// @route   POST /api/clinical-docs/process-transcript
export const processTranscript = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transcript, patientId } = req.body;

    if (!transcript) {
      res.status(400).json({ success: false, message: 'Transcript is required' });
      return;
    }

    const entities = extractMedicalEntities(transcript);

    const symptoms = entities.filter((e) => e.type === 'symptom').map((e) => e.value);
    const diagnoses = entities.filter((e) => e.type === 'diagnosis').map((e) => e.value);
    const medications = entities.filter((e) => e.type === 'medication').map((e) => e.value);

    // Generate structured note suggestion
    const suggestedNote = {
      chiefComplaint: symptoms.length > 0
        ? `Patient presents with ${symptoms.join(', ')}`
        : 'Chief complaint extracted from consultation',
      historyOfPresentIllness: `Patient reports: ${transcript.substring(0, 500)}`,
      assessment: diagnoses.map((d) => ({
        diagnosis: d,
        severity: 'moderate' as const,
        notes: `Identified from consultation`,
      })),
      plan: diagnoses.map((d) => ({
        treatment: `Treatment plan for ${d}`,
        medications: medications,
        followUp: '2 weeks',
      })),
      extractedEntities: entities,
      prescriptions: medications.map((m) => ({
        medication: m,
        dosage: 'As prescribed',
        frequency: 'As directed',
        duration: '7 days',
      })),
    };

    res.json({ success: true, data: suggestedNote });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to process transcript');
  }
};

// @desc    Get notes for a specific patient
// @route   GET /api/clinical-docs/patient/:patientId
export const getPatientNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await ClinicalNote.find({ patientId: req.params.patientId })
      .populate('providerId', 'name specialization')
      .sort({ sessionDate: -1 });

    res.json({ success: true, data: notes });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch patient notes');
  }
};
