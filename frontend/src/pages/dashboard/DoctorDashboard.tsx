import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { StatCard, Card, Badge, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import {
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
  ChevronRight,
  Activity,
  Stethoscope,
  TrendingUp,
  Bell,
  Brain,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../types';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/dashboard');
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
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good {getGreeting()}, Dr. {user?.name?.split(' ').pop()}
          </h1>
          <p className="text-slate-500 mt-1">
            Here's your overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/clinical-docs"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          New Clinical Note
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card
          title="Today's Schedule"
          subtitle={`${data?.todayAppointments?.length || 0} appointments`}
          className="lg:col-span-2"
          action={
            <Link to="/workflow" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {data?.todayAppointments && data.todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {data.todayAppointments.slice(0, 5).map((apt, idx) => (
                <div
                  key={apt._id || idx}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400">{apt.duration}min</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {typeof apt.patientId === 'object' ? (apt.patientId as any)?.userId?.name || 'Patient' : 'Patient'}
                    </p>
                    <p className="text-xs text-slate-500">{apt.reason || apt.type}</p>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'}>
                    {apt.status}
                  </Badge>
                  <Badge variant={apt.priority === 'urgent' ? 'danger' : apt.priority === 'high' ? 'warning' : 'default'}>
                    {apt.priority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No appointments today"
              description="Your schedule is clear for today."
            />
          )}
        </Card>

        {/* Active Alerts */}
        <Card
          title="Active Alerts"
          action={
            <Link to="/predictive" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {data?.activeAlerts && data.activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {data.activeAlerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border-l-3 border-l-danger-500"
                >
                  <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    alert.type === 'critical' ? 'text-danger-500' : 'text-warning-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={alert.overallRisk === 'critical' ? 'danger' : 'warning'} size="sm">
                        {alert.overallRisk} risk
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="No active alerts"
              description="All patients are within normal parameters."
            />
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card
          title="Recent Patients"
          action={
            <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {data?.recentPatients && data.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {data.recentPatients.slice(0, 5).map((patient, idx) => (
                <div key={patient._id || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {typeof patient.userId === 'object' ? (patient.userId as any)?.name : 'Patient'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {patient.chronicConditions?.slice(0, 2).join(', ') || 'No conditions recorded'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No patients yet"
              description="Patient records will appear here."
            />
          )}
        </Card>

        {/* Pending Clinical Notes */}
        <Card
          title="Pending Notes"
          action={
            <Link to="/clinical-docs" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {data?.pendingNotes && data.pendingNotes.length > 0 ? (
            <div className="space-y-3">
              {data.pendingNotes.slice(0, 5).map((note, idx) => (
                <div key={note._id || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{note.chiefComplaint || note.noteType}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(note.sessionDate).toLocaleDateString()} · {note.noteType}
                    </p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="All notes verified"
              description="No pending clinical notes."
            />
          )}
        </Card>
      </div>

      {/* AI System Status */}
      <Card title="AI System Status">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Clinical Docs AI', status: 'Active', icon: FileText, color: 'text-emerald-500' },
            { name: 'Predictive Engine', status: 'Active', icon: Brain, color: 'text-emerald-500' },
            { name: 'Patient Translator', status: 'Active', icon: Activity, color: 'text-emerald-500' },
            { name: 'Research Engine', status: 'Active', icon: TrendingUp, color: 'text-emerald-500' },
            { name: 'Workflow AI', status: 'Active', icon: Clock, color: 'text-emerald-500' },
          ].map((system) => (
            <div key={system.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <system.icon className={`w-5 h-5 ${system.color}`} />
              <div>
                <p className="text-xs font-medium text-slate-700">{system.name}</p>
                <p className={`text-xs ${system.color} font-medium flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
                  {system.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
