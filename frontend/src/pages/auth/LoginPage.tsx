import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  FileText,
  Brain,
  Languages,
  BookOpen,
  Lock,
  Home,
} from 'lucide-react';

const features = [
  { icon: FileText, label: 'Clinical Documentation', desc: 'AI-powered notes & summaries' },
  { icon: Brain, label: 'Predictive Analytics', desc: 'Real-time risk scoring' },
  { icon: Languages, label: 'Patient Translation', desc: 'Multi-language reports' },
  { icon: BookOpen, label: 'Research Synthesis', desc: 'Evidence-based insights' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-[#0c1222] via-[#0f172a] to-[#1a2640] relative overflow-hidden">
        {/* Ambient light blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px]" />
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
          className="relative z-10 flex flex-col justify-center px-14 xl:px-20"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-10"
          >
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">CARENET AI</h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em]">Healthcare Platform</p>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-4xl xl:text-[44px] font-bold text-white leading-[1.15] mb-4"
          >
            Intelligent Healthcare,
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-emerald-300 bg-clip-text text-transparent">
              Simplified.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-slate-400 text-base leading-relaxed max-w-md mb-10"
          >
            Five AI agents working together — clinical documentation, predictive analytics, 
            and patient communication in one unified platform.
          </motion.p>

          {/* Feature cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {features.map((f) => (
              <motion.div
                key={f.label}
                variants={itemVariants}
                className="group bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm rounded-xl px-4 py-3.5 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 bg-primary-500/15 rounded-lg">
                    <f.icon className="w-3.5 h-3.5 text-primary-400" />
                  </div>
                  <p className="text-white text-[13px] font-semibold">{f.label}</p>
                </div>
                <p className="text-slate-500 text-xs pl-8">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* HIPAA badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex items-center gap-3 mt-10 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400/90 text-xs font-medium">HIPAA Compliant · SOC 2 · End-to-End Encrypted</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8 justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">CARENET AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-[22px] font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your secure account</p>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-slate-400"
                  placeholder="doctor@carenet.ai"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all pr-10 placeholder:text-slate-400"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
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
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-slate-400">
              <Lock className="w-3 h-3" />
              <span>256-bit encrypted connection</span>
            </div>

            {/* OR divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">OR</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <GoogleSignInButton mode="login" onError={(msg) => setError(msg)} />

            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
