import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { cn, getInitials } from '../../lib/utils';
import {
  LayoutDashboard,
  FileText,
  Languages,
  Brain,
  BookOpen,
  LogOut,
  Menu,
  X,
  Heart,
  ChevronDown,
  Bell,
  ClipboardList,
  Users,
  Activity,
  GitBranch,
  Search,
  Settings,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

/* ── Role-based navigation ── */
const roleNavItems: Record<string, Array<{ to: string; icon: React.ElementType; label: string; badge?: string }>> = {
  doctor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/clinical-docs', icon: FileText, label: 'Clinical Docs', badge: 'AI' },
    { to: '/translator', icon: Languages, label: 'Patient Translator', badge: 'AI' },
    { to: '/predictive', icon: Brain, label: 'Predictive Engine', badge: 'AI' },
    { to: '/research', icon: BookOpen, label: 'Research', badge: 'AI' },
    { to: '/workflow', icon: ClipboardList, label: 'Workflow', badge: 'AI' },
    { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  ],
  patient: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-reports', icon: FileText, label: 'My Reports', badge: 'AI' },
  ],
  researcher: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/research', icon: BookOpen, label: 'Research', badge: 'AI' },
    { to: '/predictive', icon: Brain, label: 'Analytics', badge: 'AI' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Users' },
    { to: '/workflow', icon: ClipboardList, label: 'Workflow' },
    { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = roleNavItems[user?.role || 'doctor'] || roleNavItems.doctor;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          SIDEBAR
         ══════════════════════════════════════════════ */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-[#0c1222] to-[#0f172a]',
          'text-white transform transition-transform duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-[15px] font-bold tracking-tight">CARENET AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Healthcare Platform</p>
          </div>
          <button
            className="lg:hidden text-slate-500 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 shadow-sm shadow-primary-500/10'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive ? 'bg-primary-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide',
                      isActive
                        ? 'bg-primary-500/25 text-primary-300'
                        : 'bg-white/[0.06] text-slate-500'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-[11px] text-slate-500 font-medium">AI Systems</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-emerald-400 font-medium">HIPAA Compliant</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-white/[0.04]">
              <LogOut className="w-4 h-4" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT AREA
         ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>CARENET</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Search button */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100/80 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/50">
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>

          {/* AI status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Activity className="w-3.5 h-3.5 animate-pulse-dot" />
            <span className="font-medium">AI Online</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {getInitials(user?.name || 'U')}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-400 transition-transform duration-200',
                profileOpen && 'rotate-180'
              )} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                      <span className="inline-flex items-center mt-1.5 text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
