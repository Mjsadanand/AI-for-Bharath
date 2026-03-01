import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '4h' });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const user = await User.create({
      name: name || email.split('@')[0],
      email,
      password,
      role: role || 'patient',
      isProfileComplete: false, // Must complete role selection + profile
    });

    const token = generateToken(String(user._id));

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        authProvider: user.authProvider,
        token,
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Registration failed');
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
        authProvider: user.authProvider,
        isProfileComplete: user.isProfileComplete,
        token,
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Login failed');
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
        isProfileComplete: user.isProfileComplete,
        authProvider: user.authProvider,
        patientProfile,
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to fetch profile');
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
    handleControllerError(res, error, 'Profile update failed');
  }
};
