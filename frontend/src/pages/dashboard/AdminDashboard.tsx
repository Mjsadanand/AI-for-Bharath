import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { StatCard, Card, PageHeader, Skeleton } from '../../components/ui/Cards';
import { Users, Calendar, FileText, AlertTriangle, Activity, TrendingUp, Shield, Settings, BarChart3, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../types';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Shield}
          title="Admin Dashboard"
          description="System-wide overview and management"
          badge="Administrator"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="blue" />
        <StatCard title="Total Patients" value={stats.totalPatients || 0} icon={Activity} color="green" />
        <StatCard title="Clinical Notes" value={stats.totalClinicalNotes || 0} icon={FileText} color="purple" />
        <StatCard title="Active Alerts" value={stats.activeAlerts || 0} icon={AlertTriangle} color="red" />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="System Activity" icon={Activity}>
          <div className="space-y-3">
            {[
              { label: 'Appointments Today', value: stats.todayAppointments || 0, icon: Calendar, gradient: 'from-blue-100 to-blue-50', iconColor: 'text-blue-600' },
              { label: 'Pending Claims', value: stats.pendingClaims || 0, icon: FileText, gradient: 'from-amber-100 to-amber-50', iconColor: 'text-amber-600' },
              { label: 'Lab Results Pending', value: stats.pendingLabResults || 0, icon: TrendingUp, gradient: 'from-purple-100 to-purple-50', iconColor: 'text-purple-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions" icon={Settings}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', desc: 'View & edit user accounts', icon: Users, to: '/patients', gradient: 'from-blue-500 to-blue-600' },
              { label: 'Audit Logs', desc: 'Audit trail & activity', icon: ClipboardList, to: '/workflow', gradient: 'from-violet-500 to-purple-600' },
              { label: 'System Health', desc: 'Monitor AI services', icon: Activity, to: '/pipeline', gradient: 'from-emerald-500 to-green-600' },
              { label: 'Reports', desc: 'Generate system reports', icon: BarChart3, to: '/dashboard', gradient: 'from-amber-500 to-orange-600' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="group p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className={`w-9 h-9 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-semibold text-sm text-slate-700 group-hover:text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
