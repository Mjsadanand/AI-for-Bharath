import { Response } from 'express';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

// @desc    Get all patients (doctor/admin)
// @route   GET /api/patients
export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let query: any = {};
    if (search) {
      const userIds = await User.find({
        role: 'patient',
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      query.userId = { $in: userIds.map((u) => u._id) };
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};
