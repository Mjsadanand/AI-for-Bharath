import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowRight,
  AlertCircle,
  Shield,
  CheckCircle,
  User,
  Phone,
  Stethoscope,
  Calendar,
} from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if profile is already complete
  if (user.isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const profileData: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone || undefined,
      };

      if (user.role === 'doctor') {
        profileData.specialization = formData.specialization || undefined;
        profileData.licenseNumber = formData.licenseNumber || undefined;
      }

      if (user.role === 'patient') {
        profileData.dateOfBirth = formData.dateOfBirth || undefined;
        profileData.gender = formData.gender || undefined;
        profileData.bloodGroup = formData.bloodGroup || undefined;
        if (formData.emergencyContactName && formData.emergencyContactPhone) {
          profileData.emergencyContact = {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relation: formData.emergencyContactRelation || 'N/A',
          };
        }
      }

      await completeProfile(profileData as any);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ field?: string; message: string }>; message?: string } } };
      const res = error.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        const msgs = res.errors.map((e: { field?: string; message: string }) =>
          e.field ? `${e.field}: ${e.message}` : e.message
        );
        setError(msgs.join(' · '));
      } else {
        setError(res?.message || 'Failed to complete profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-slate-400';

  const getRoleLabel = () => {
    switch (user.role) {
      case 'doctor':  return 'Doctor / Provider';
      case 'patient': return 'Patient';
      case 'researcher': return 'Researcher';
      default: return user.role;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" />
              Step 2 of 2
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Complete Your Profile</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Fill in your details to get started as a <strong className="text-slate-700">{getRoleLabel()}</strong>
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            <AnimatePresence mode="wait">
              {user.role === 'doctor' && (
                <motion.div
                  key="doctor-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden space-y-4"
                >
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Cardiology, Neurology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Medical license number"
                    />
                  </div>
                </motion.div>
              )}

              {/* Patient-specific fields */}
              {user.role === 'patient' && (
                <motion.div
                  key="patient-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Type</label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Emergency Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Contact name"
                      />
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Contact phone"
                      />
                      <input
                        type="text"
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Relation (e.g. Spouse)"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || !formData.name}
              whileHover={!loading ? { scale: 1.01 } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Profile & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
