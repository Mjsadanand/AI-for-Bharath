import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
  Stethoscope,
  User,
  FlaskConical,
  ArrowRight,
  AlertCircle,
  Shield,
} from 'lucide-react';

const roleOptions = [
  {
    value: 'doctor',
    label: 'Doctor / Provider',
    icon: Stethoscope,
    desc: 'Access clinical tools, AI agents, and patient management',
    color: 'primary',
  },
  {
    value: 'patient',
    label: 'Patient',
    icon: User,
    desc: 'View health records, reports, and communicate with doctors',
    color: 'emerald',
  },
  {
    value: 'researcher',
    label: 'Researcher',
    icon: FlaskConical,
    desc: 'Access analytics, research synthesis, and evidence tools',
    color: 'amber',
  },
];

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a complete profile, redirect to dashboard
  if (user.isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await selectRole(selectedRole);
      navigate('/complete-profile');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to set role. Please try again.');
    } finally {
      setLoading(false);
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
              Step 1 of 2
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome, {user.name}!</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Select your role to personalize your CARENET AI experience
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

          {/* Role cards */}
          <div className="space-y-3 mb-6">
            {roleOptions.map((role) => (
              <motion.button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                  selectedRole === role.value
                    ? 'border-primary-400 bg-primary-50/60 ring-2 ring-primary-400/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    selectedRole === role.value
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      selectedRole === role.value ? 'text-primary-700' : 'text-slate-700'
                    )}
                  >
                    {role.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{role.desc}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    selectedRole === role.value
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-slate-300'
                  )}
                >
                  {selectedRole === role.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={loading || !selectedRole}
            whileHover={!loading && selectedRole ? { scale: 1.01 } : undefined}
            whileTap={!loading && selectedRole ? { scale: 0.98 } : undefined}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Your role determines your dashboard and available features
          </p>
        </div>
      </motion.div>
    </div>
  );
}
