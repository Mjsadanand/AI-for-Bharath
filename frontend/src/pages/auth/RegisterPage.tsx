import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  Lock,
  Home,
} from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password });
      navigate('/select-role');
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
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:p-6 lg:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-5 sm:mb-6 justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">CARENET AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-800">Create Account</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your email and password to get started</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
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

            {/* OR divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">OR</span>
              </div>
            </div>

            {/* Google Sign-Up */}
            <GoogleSignInButton mode="register" onError={(msg) => setError(msg)} />

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
