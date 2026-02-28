import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { StatCard, Card, Badge, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import {
  Calendar,
  Activity,
  Pill,
  Heart,
  TestTube,
  Shield,
  Clock,
} from 'lucide-react';
import type { DashboardData } from '../../types';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/dashboard/patient');
        setData(res.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  const stats = data?.stats || {};
  const assessment = data?.latestAssessment;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Your health overview and upcoming schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Upcoming Appointments" value={stats.upcomingAppointments || 0} icon={Calendar} color="blue" />
        <StatCard
          title="Health Score"
          value={assessment ? `${100 - (assessment.riskScores?.[0]?.score || 0)}%` : 'N/A'}
          icon={Heart}
          color="green"
          subtitle="Based on risk assessment"
        />
        <StatCard title="Pending Lab Results" value={stats.pendingLabResults || 0} icon={TestTube} color="purple" />
        <StatCard title="Active Medications" value={stats.activeMedications || 0} icon={Pill} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments" className="lg:col-span-2">
          {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingAppointments.map((apt, idx) => (
                <div key={apt._id || idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">
                      {new Date(apt.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-primary-800 -mt-1">
                      {new Date(apt.scheduledDate).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{apt.reason || apt.type}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{apt.duration} minutes
                    </p>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>{apt.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Calendar} title="No upcoming appointments" description="You have no scheduled appointments." />
          )}
        </Card>

        {/* Health Risk */}
        <Card title="Health Assessment">
          {assessment ? (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-slate-50">
                <p className="text-sm text-slate-500 mb-1">Overall Risk Level</p>
                <Badge
                  variant={assessment.overallRisk === 'low' ? 'success' : assessment.overallRisk === 'moderate' ? 'warning' : 'danger'}
                  size="md"
                >
                  {assessment.overallRisk?.toUpperCase()}
                </Badge>
                <p className="text-xs text-slate-400 mt-2">Confidence: {assessment.confidence}%</p>
              </div>

              {assessment.riskScores?.map((score, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 capitalize">{score.category}</span>
                    <span className="font-medium text-slate-800">{score.score}/100</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score.score < 30 ? 'bg-emerald-500' :
                        score.score < 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </div>
              ))}

              {assessment.recommendations && assessment.recommendations.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Recommendations</p>
                  {assessment.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 mb-2">
                      <Shield className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No assessment yet" description="Your health assessment will appear here." />
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Results */}
        <Card title="Recent Lab Results">
          {data?.recentLabResults && data.recentLabResults.length > 0 ? (
            <div className="space-y-3">
              {data.recentLabResults.map((lab, idx) => (
                <div key={lab._id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{lab.testName}</p>
                    <p className="text-xs text-slate-500">{lab.category}</p>
                  </div>
                  <Badge variant={lab.status === 'completed' ? 'success' : lab.status === 'reviewed' ? 'info' : 'warning'}>
                    {lab.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TestTube} title="No lab results" description="Lab results will appear here when available." />
          )}
        </Card>

        {/* Current Medications */}
        <Card title="Current Medications">
          {data?.currentMedications && data.currentMedications.length > 0 ? (
            <div className="space-y-3">
              {data.currentMedications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{med.name}</p>
                    <p className="text-xs text-slate-500">{med.dosage} · {med.frequency}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Pill} title="No medications" description="Your medications will appear here." />
          )}
        </Card>
      </div>
    </div>
  );
}
