import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { getGreeting } from '../../lib/utils';
import { StatCard, Card, Badge, EmptyState, PageHeader, Skeleton } from '../../components/ui/Cards';
import {
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  ChevronRight,
  Activity,
  Stethoscope,
  Bell,
  Brain,
  Sparkles,
  Languages,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData, Patient, User } from '../../types';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/dashboard/doctor');
        setData(res.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Stethoscope}
          title={`Good ${getGreeting()}, Dr. ${user?.name?.split(' ').pop() || ''}`}
          description={`Here's your overview for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
          actions={
            <Link
              to="/clinical-docs"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm shadow-primary-500/20"
            >
              <FileText className="w-4 h-4" />
              New Clinical Note
            </Link>
          }
        />
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments || 0}
          icon={Calendar}
          color="blue"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients || 0}
          icon={Users}
          color="green"
          change="+3 this week"
          changeType="positive"
        />
        <StatCard
          title="Pending Notes"
          value={stats.pendingNotes || 0}
          icon={FileText}
          color="orange"
          subtitle="Awaiting verification"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Require attention"
        />
      </motion.div>

      {/* Main content grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card
          title="Today's Schedule"
          icon={Calendar}
          subtitle={`${data?.todayAppointments?.length || 0} appointments`}
          className="lg:col-span-2"
          action={
            <Link to="/workflow" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data?.todayAppointments && data.todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {data.todayAppointments.slice(0, 5).map((apt, idx) => (
                <motion.div
                  key={apt._id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group border border-transparent hover:border-slate-100"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{apt.duration}min</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200/80" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {typeof apt.patientId === 'object' ? (apt.patientId as Patient)?.userId && typeof (apt.patientId as Patient).userId === 'object' ? ((apt.patientId as Patient).userId as User)?.name || 'Patient' : 'Patient' : 'Patient'}
                    </p>
                    <p className="text-xs text-slate-500">{apt.reason || apt.type}</p>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'} dot>
                    {apt.status}
                  </Badge>
                  {apt.priority === 'urgent' && <Badge variant="danger" size="sm">Urgent</Badge>}
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Calendar} title="No appointments today" description="Your schedule is clear for today." />
          )}
        </Card>

        {/* Active Alerts */}
        <Card
          title="Active Alerts"
          icon={Bell}
          action={
            <Link to="/predictive" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data?.activeAlerts && data.activeAlerts.length > 0 ? (
            <div className="space-y-2">
              {data.activeAlerts.slice(0, 5).map((alert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 ${alert.type === 'critical' ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'}`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 leading-snug">{alert.message}</p>
                    <Badge variant={alert.overallRisk === 'critical' ? 'danger' : 'warning'} size="sm" className="mt-1.5">
                      {alert.overallRisk} risk
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Bell} title="No active alerts" description="All patients are within normal parameters." />
          )}
        </Card>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card
          title="Recent Patients"
          icon={Users}
          action={
            <Link to="/patients" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data?.recentPatients && data.recentPatients.length > 0 ? (
            <div className="space-y-1">
              {data.recentPatients.slice(0, 5).map((patient, idx) => (
                <div key={patient._id || idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        {typeof patient.userId === 'object' ? (patient.userId as User)?.name : 'Patient'}
                      </p>
                      {(patient as Patient).patientCode && (
                        <span className="font-mono text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md font-bold">
                          {(patient as Patient).patientCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {patient.chronicConditions?.slice(0, 2).join(', ') || 'No conditions recorded'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No patients yet" description="Patient records will appear here." />
          )}
        </Card>

        {/* Pending Clinical Notes */}
        <Card
          title="Pending Notes"
          icon={FileText}
          action={
            <Link to="/clinical-docs" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data?.pendingNotes && data.pendingNotes.length > 0 ? (
            <div className="space-y-1">
              {data.pendingNotes.slice(0, 5).map((note, idx) => (
                <div key={note._id || idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{note.chiefComplaint || note.noteType}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(note.sessionDate).toLocaleDateString()} · {note.noteType}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm" dot>Pending</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="All notes verified" description="No pending clinical notes." />
          )}
        </Card>
      </motion.div>

      {/* AI System Status */}
      <motion.div variants={fadeUp}>
        <Card title="AI System Status" icon={Sparkles}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: 'Clinical Docs', icon: FileText, gradient: 'from-blue-500 to-blue-600' },
              { name: 'Predictive Engine', icon: Brain, gradient: 'from-violet-500 to-purple-600' },
              { name: 'Patient Translator', icon: Languages, gradient: 'from-emerald-500 to-green-600' },
              { name: 'Research Engine', icon: BookOpen, gradient: 'from-amber-500 to-orange-600' },
              { name: 'Workflow AI', icon: Activity, gradient: 'from-rose-500 to-pink-600' },
            ].map((system) => (
              <div key={system.name} className="relative p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors group">
                <div className={`w-8 h-8 bg-gradient-to-br ${system.gradient} rounded-lg flex items-center justify-center mb-2.5 shadow-sm`}>
                  <system.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-700">{system.name}</p>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
                  Active
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
