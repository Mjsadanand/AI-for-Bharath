import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  Lock,
  Stethoscope,
  User,
  FlaskConical,
  UserCog,
  Home,
} from 'lucide-react';

const roleOptions = [
  { value: 'doctor', label: 'Doctor / Provider', icon: Stethoscope, desc: 'Clinical tools & AI agents' },
  { value: 'patient', label: 'Patient', icon: User, desc: 'My health & reports' },
  { value: 'researcher', label: 'Researcher', icon: FlaskConical, desc: 'Analytics & research tools' },
  { value: 'admin', label: 'Administrator', icon: UserCog, desc: 'System management' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'doctor',
    specialization: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _unused, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ field?: string; message: string }>; message?: string } } };
      const res = error.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        const msgs = res.errors.map((e: { field?: string; message: string }) => e.field ? `${e.field}: ${e.message}` : e.message);
        setError(msgs.join(' · '));
      } else {
        setError(res?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Home button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 lg:bg-white/10 backdrop-blur-md border border-slate-200 lg:border-white/10 shadow-sm hover:shadow-md lg:hover:bg-white/20 transition-all group"
        aria-label="Go home"
      >
        <Home className="w-4 h-4 text-slate-600 lg:text-white/80 group-hover:text-primary-500 lg:group-hover:text-white transition-colors" />
        <span className="text-xs font-medium text-slate-600 lg:text-white/80 group-hover:text-primary-500 lg:group-hover:text-white transition-colors">Home</span>
      </Link>

      {/* ── Left branding ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-[#0c1222] via-[#0f172a] to-[#1a2640] relative overflow-hidden">
        {/* Ambient light */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col justify-center px-12 xl:px-16"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-10"
          >
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">CARENET AI</h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em]">Healthcare Platform</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-3xl xl:text-4xl font-bold text-white leading-[1.15] mb-4"
          >
            Join the Future
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-emerald-300 bg-clip-text text-transparent">
              of Healthcare
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-base leading-relaxed max-w-sm mb-10"
          >
            Create your account and experience AI-powered healthcare management across five intelligent agents.
          </motion.p>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400/90 text-xs font-medium">HIPAA Compliant · End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500 text-xs font-medium">Your data stays yours — zero third-party sharing</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:p-6 lg:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-[520px] py-2 sm:py-6"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-5 sm:mb-6 justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">CARENET AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-800">Create Account</h2>
              <p className="text-slate-500 text-sm mt-1">Fill in your details to get started</p>
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
                  <div className="flex items-center gap-2 px-4 py-3 bg-danger-50 text-danger-700 rounded-xl text-sm border border-danger-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Dr. Jane Smith"
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="jane@hospital.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Role selector — card style */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Role</label>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  {roleOptions.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.value })}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200',
                        formData.role === r.value
                          ? 'border-primary-400 bg-primary-50/50 ring-1 ring-primary-400/30'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      )}
                    >
                      <div className={cn(
                        'p-1.5 rounded-lg',
                        formData.role === r.value ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                      )}>
                        <r.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={cn(
                          'text-xs font-semibold',
                          formData.role === r.value ? 'text-primary-700' : 'text-slate-700'
                        )}>{r.label}</p>
                        <p className="text-[10px] text-slate-400">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor: Specialization */}
              <AnimatePresence mode="wait">
                {formData.role === 'doctor' && (
                  <motion.div
                    key="doctor-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Cardiology, Neurology, etc."
                      />
                    </div>
                  </motion.div>
                )}

                {/* Patient: DOB, Gender, BloodType */}
                {formData.role === 'patient' && (
                  <motion.div
                    key="patient-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={cn(inputClass, 'pr-10')}
                      placeholder="Min. 8 chars (A-z, 0-9, !@#)"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-400">
              <Lock className="w-3 h-3" />
              <span>256-bit encrypted · HIPAA compliant</span>
            </div>

            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
