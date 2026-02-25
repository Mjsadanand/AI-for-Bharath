import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, specialization, licenseNumber, phone,
            dateOfBirth, gender, bloodGroup, emergencyContact } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const user = await User.create({ name, email, password, role, specialization, licenseNumber, phone });

    // If patient role, create patient profile
    if (role === 'patient') {
      await Patient.create({
        userId: user._id,
        dateOfBirth: dateOfBirth || new Date('1990-01-01'),
        gender: gender || 'other',
        bloodGroup,
        emergencyContact: emergencyContact || { name: 'N/A', phone: 'N/A', relation: 'N/A' },
        allergies: [],
        chronicConditions: [],
        medicalHistory: [],
        medications: [],
        vitalSigns: [],
        riskFactors: [],
      });
    }

    const token = generateToken(String(user._id));

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(String(user._id));

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let patientProfile = null;
    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        patientProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, specialization } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, phone, specialization },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
