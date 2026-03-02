import { Response } from 'express';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';
import { escapeRegex } from '../middleware/security.js';
import crypto from 'crypto';

// @desc    Create a new patient (doctor/admin)
// @route   POST /api/patients
export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, email, phone,
      dateOfBirth, gender, bloodGroup,
      allergies, chronicConditions,
      emergencyContact, insurance,
      medicalHistory, medications, vitalSigns, riskFactors,
    } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    // Generate a secure random password (patient can reset later)
    const tempPassword = crypto.randomBytes(12).toString('base64url') + 'A1!';

    // Create User account with role=patient
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: 'patient',
      phone: phone || undefined,
      isProfileComplete: true,
    });

    // Build patient data
    const patientData: Record<string, any> = {
      userId: user._id,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      emergencyContact,
    };

    if (bloodGroup) patientData.bloodGroup = bloodGroup;
    if (allergies?.length) patientData.allergies = allergies;
    if (chronicConditions?.length) patientData.chronicConditions = chronicConditions;
    if (insurance) patientData.insurance = insurance;
    if (medicalHistory?.length) {
      patientData.medicalHistory = medicalHistory.map((h: any) => ({
        ...h,
        diagnosedDate: h.diagnosedDate ? new Date(h.diagnosedDate) : new Date(),
      }));
    }
    if (medications?.length) {
      patientData.medications = medications.map((m: any) => ({
        ...m,
        prescribedBy: req.user?._id,
        startDate: m.startDate ? new Date(m.startDate) : new Date(),
      }));
    }
    if (vitalSigns) {
      patientData.vitalSigns = [{ date: new Date(), ...vitalSigns }];
    }
    if (riskFactors?.length) {
      patientData.riskFactors = riskFactors.map((r: any) => ({
        ...r,
        identifiedDate: r.identifiedDate ? new Date(r.identifiedDate) : new Date(),
      }));
    }

    const patient = await Patient.create(patientData);

    // Populate for response
    const populated = await Patient.findById(patient._id)
      .populate('userId', 'name email phone avatar');

    res.status(201).json({
      success: true,
      data: populated,
      tempPassword, // Return so doctor can share with patient (shown once)
      message: `Patient ${name} created with code ${patient.patientCode}. Temporary password generated — share securely.`,
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to create patient');
  }
};

// @desc    Get all patients (doctor/admin)
// @route   GET /api/patients
export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string;

    let query: any = {};
    if (search && typeof search === 'string') {
      const escapedSearch = escapeRegex(search.substring(0, 200));
      // Search by patientCode (PT-xxxx) OR by name
      if (/^PT-/i.test(search)) {
        query.patientCode = { $regex: escapedSearch, $options: 'i' };
      } else {
        const userIds = await User.find({
          role: 'patient',
          name: { $regex: escapedSearch, $options: 'i' },
        }).select('_id');
        query.userId = { $in: userIds.map((u) => u._id) };
      }
    }

    const patients = await Patient.find(query)
      .populate('userId', 'name email phone avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch patients');
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
export const getPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('medications.prescribedBy', 'name');

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch patient');
  }
};

// @desc    Get my patient profile (patient role)
// @route   GET /api/patients/me/profile
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user?._id })
      .populate('userId', 'name email phone avatar')
      .populate('medications.prescribedBy', 'name');

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient profile not found' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch profile');
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id
export const updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { allergies, chronicConditions, emergencyContact, insurance, bloodGroup } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { allergies, chronicConditions, emergencyContact, insurance, bloodGroup },
      { new: true, runValidators: true }
    );

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to update patient');
  }
};

// @desc    Add vital signs
// @route   POST /api/patients/:id/vitals
export const addVitalSigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    patient.vitalSigns.push({ date: new Date(), ...req.body });
    await patient.save();

    res.status(201).json({ success: true, data: patient.vitalSigns });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to add vital signs');
  }
};

// @desc    Add medication
// @route   POST /api/patients/:id/medications
export const addMedication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    patient.medications.push({ ...req.body, prescribedBy: req.user?._id, startDate: new Date() });
    await patient.save();

    res.json({ success: true, data: patient.medications });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to add medication');
  }
};
