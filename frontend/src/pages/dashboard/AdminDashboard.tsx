import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { StatCard, Card, LoadingSpinner } from '../../components/ui/Cards';
import { Users, Calendar, FileText, AlertTriangle, Activity, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">System-wide overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="blue" />
        <StatCard title="Total Patients" value={stats.totalPatients || 0} icon={Activity} color="green" />
        <StatCard title="Clinical Notes" value={stats.totalClinicalNotes || 0} icon={FileText} color="purple" />
        <StatCard title="Active Alerts" value={stats.activeAlerts || 0} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="System Activity">
          <div className="space-y-4">
            {[
              { label: 'Appointments Today', value: stats.todayAppointments || 0, icon: Calendar },
              { label: 'Pending Claims', value: stats.pendingClaims || 0, icon: FileText },
              { label: 'Lab Results Pending', value: stats.pendingLabResults || 0, icon: TrendingUp },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', desc: 'View & edit user accounts', color: 'bg-blue-50 text-blue-700' },
              { label: 'View Logs', desc: 'Audit trail & activity', color: 'bg-purple-50 text-purple-700' },
              { label: 'System Health', desc: 'Monitor AI services', color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Reports', desc: 'Generate system reports', color: 'bg-orange-50 text-orange-700' },
            ].map((action) => (
              <button
                key={action.label}
                className={`p-4 rounded-xl text-left ${action.color} hover:opacity-80 transition-opacity`}
              >
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs opacity-70 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
