import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '4h' });
};

// ─── Helper: Verify Google ID token ────────────────────────────────────────

async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token payload');
  return payload;
}

// @desc    Authenticate with Google (login or register)
// @route   POST /api/auth/google
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ success: false, message: 'Google ID token is required' });
      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(503).json({ success: false, message: 'Google OAuth is not configured on this server' });
      return;
    }

    // Verify the Google ID token
    const payload = await verifyGoogleToken(idToken);
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.status(400).json({ success: false, message: 'Google account must have an email address' });
      return;
    }

    // Check if user already exists by googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // Existing Google user — log them in
      const token = generateToken(String(user._id));
      res.json({
        success: true,
        isNewUser: false,
        isProfileComplete: user.isProfileComplete,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isProfileComplete: user.isProfileComplete,
          authProvider: user.authProvider,
          token,
        },
      });
      return;
    }

    // Check if a local-auth user exists with the same email
    const existingLocalUser = await User.findOne({ email, authProvider: 'local' });
    if (existingLocalUser) {
      // Link Google account to existing local user
      existingLocalUser.googleId = googleId;
      existingLocalUser.authProvider = 'google'; // Upgrade to google auth
      if (picture && !existingLocalUser.avatar) {
        existingLocalUser.avatar = picture;
      }
      await existingLocalUser.save();

      const token = generateToken(String(existingLocalUser._id));
      res.json({
        success: true,
        isNewUser: false,
        isProfileComplete: existingLocalUser.isProfileComplete,
        data: {
          _id: existingLocalUser._id,
          name: existingLocalUser.name,
          email: existingLocalUser.email,
          role: existingLocalUser.role,
          avatar: existingLocalUser.avatar,
          isProfileComplete: existingLocalUser.isProfileComplete,
          authProvider: existingLocalUser.authProvider,
          token,
        },
      });
      return;
    }

    // New user — create account (profile incomplete, needs role selection)
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      authProvider: 'google',
      avatar: picture || undefined,
      isProfileComplete: false, // Must complete profile (role + details)
      isActive: true,
    });

    const token = generateToken(String(user._id));

    res.status(201).json({
      success: true,
      isNewUser: true,
      isProfileComplete: false,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileComplete: false,
        authProvider: 'google',
        token,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
      return;
    }
    handleControllerError(res, error, 'Google authentication failed');
  }
};

// @desc    Select role for Google OAuth user (post-registration)
// @route   POST /api/auth/google/select-role
export const selectRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isProfileComplete) {
      res.status(400).json({ success: false, message: 'Profile is already complete. Use profile update instead.' });
      return;
    }

    // Admin role cannot be self-assigned
    if (role === 'admin') {
      res.status(403).json({ success: false, message: 'Admin role cannot be self-assigned' });
      return;
    }

    user.role = role;
    await user.save();

    // If patient, create a skeleton patient profile
    if (role === 'patient') {
      const existingPatient = await Patient.findOne({ userId: user._id });
      if (!existingPatient) {
        await Patient.create({
          userId: user._id,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'other',
          emergencyContact: { name: 'N/A', phone: 'N/A', relation: 'N/A' },
          allergies: [],
          chronicConditions: [],
          medicalHistory: [],
          medications: [],
          vitalSigns: [],
          riskFactors: [],
        });
      }
    }

    res.json({
      success: true,
      message: `Role set to ${role}. Please complete your profile.`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: false, // Still needs profile completion
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Role selection failed');
  }
};

// @desc    Complete profile for Google OAuth user
// @route   POST /api/auth/google/complete-profile
export const completeProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { name, phone, specialization, licenseNumber, dateOfBirth, gender, bloodGroup, emergencyContact } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isProfileComplete) {
      res.status(400).json({ success: false, message: 'Profile is already complete. Use profile update instead.' });
      return;
    }

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (specialization) user.specialization = specialization;
    if (licenseNumber) user.licenseNumber = licenseNumber;

    // Mark profile as complete
    user.isProfileComplete = true;
    await user.save();

    // If patient, update patient profile with additional details
    if (user.role === 'patient') {
      const patientProfile = await Patient.findOne({ userId: user._id });
      if (patientProfile) {
        if (dateOfBirth) patientProfile.dateOfBirth = new Date(dateOfBirth);
        if (gender) patientProfile.gender = gender;
        if (bloodGroup) patientProfile.bloodGroup = bloodGroup;
        if (emergencyContact) patientProfile.emergencyContact = emergencyContact;
        await patientProfile.save();
      }
    }

    // Fetch updated patient profile if applicable
    let patientProfile = null;
    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ userId: user._id });
    }

    const token = generateToken(String(user._id));

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        specialization: user.specialization,
        isProfileComplete: true,
        authProvider: user.authProvider,
        patientProfile,
        token, // Fresh token after profile completion
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Profile completion failed');
  }
};
