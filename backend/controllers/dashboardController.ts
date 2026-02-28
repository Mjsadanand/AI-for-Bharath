import { Response } from 'express';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import ClinicalNote from '../models/ClinicalNote.js';
import Appointment from '../models/Appointment.js';
import RiskAssessment from '../models/RiskAssessment.js';
import InsuranceClaim from '../models/InsuranceClaim.js';
import LabResult from '../models/LabResult.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

// @desc    Get doctor dashboard stats
// @route   GET /api/dashboard/doctor
export const getDoctorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      totalPatients,
      pendingNotes,
      activeAlerts,
      recentNotes,
      upcomingAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctorId,
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'confirmed'] },
      }),
      Appointment.distinct('patientId', { doctorId }),
      ClinicalNote.countDocuments({ providerId: doctorId, verificationStatus: 'pending' }),
      RiskAssessment.countDocuments({ assessedBy: doctorId, 'alerts.acknowledged': false }),
      ClinicalNote.find({ providerId: doctorId })
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' }, select: 'patientCode userId' })
        .sort({ createdAt: -1 })
        .limit(5),
      Appointment.find({
        doctorId,
        scheduledDate: { $gte: today },
        status: { $in: ['scheduled', 'confirmed'] },
      })
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name avatar' }, select: 'patientCode userId' })
        .sort({ scheduledDate: 1 })
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          todayAppointments,
          totalPatients: totalPatients.length,
          pendingNotes,
          activeAlerts,
        },
        recentNotes,
        upcomingAppointments,
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Dashboard operation failed');
  }
};

// @desc    Get patient dashboard stats
// @route   GET /api/dashboard/patient
export const getPatientDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user?._id });
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient profile not found' });
      return;
    }

    const today = new Date();

    const [
      upcomingAppointments,
      latestAssessment,
      recentLabResults,
      recentNotes,
    ] = await Promise.all([
      Appointment.find({
        patientId: patient._id,
        scheduledDate: { $gte: today },
        status: { $in: ['scheduled', 'confirmed'] },
      })
        .populate('doctorId', 'name specialization avatar')
        .sort({ scheduledDate: 1 })
        .limit(3),
      RiskAssessment.findOne({ patientId: patient._id }).sort({ assessmentDate: -1 }),
      LabResult.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(5),
      ClinicalNote.find({ patientId: patient._id, verificationStatus: 'verified' })
        .populate('providerId', 'name specialization')
        .sort({ sessionDate: -1 })
        .limit(3),
    ]);

    res.json({
      success: true,
      data: {
        patient,
        upcomingAppointments,
        latestAssessment,
        recentLabResults,
        recentNotes,
        medications: patient.medications.filter((m) => !m.endDate || new Date(m.endDate) > today),
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Dashboard operation failed');
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingClaims,
      activeClaims,
      pendingLabResults,
    ] = await Promise.all([
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Appointment.countDocuments({ status: { $in: ['scheduled', 'confirmed'] } }),
      InsuranceClaim.countDocuments({ status: 'draft' }),
      InsuranceClaim.countDocuments({ status: { $in: ['submitted', 'processing'] } }),
      LabResult.countDocuments({ status: { $in: ['ordered', 'collected', 'processing'] } }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalDoctors,
          totalPatients,
          totalAppointments,
          pendingClaims,
          activeClaims,
          pendingLabResults,
        },
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Dashboard operation failed');
  }
};

// @desc    Get researcher dashboard
// @route   GET /api/dashboard/researcher
export const getResearcherDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        recentSearches: [],
        savedPapers: [],
        trendingTopics: [
          'AI in Healthcare',
          'Federated Learning',
          'Precision Medicine',
          'Digital Therapeutics',
          'Predictive Analytics',
        ],
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Dashboard operation failed');
  }
};
