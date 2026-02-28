import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { StatCard, Card, Badge, EmptyState, PageHeader, Skeleton, ProgressBar } from '../../components/ui/Cards';
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

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

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
  const assessment = data?.latestAssessment;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Heart}
          title={`Welcome, ${user?.name || 'Patient'}`}
          description="Your health overview and upcoming schedule"
          badge="Patient Portal"
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments" icon={Calendar} className="lg:col-span-2">
          {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingAppointments.map((apt, idx) => (
                <motion.div
                  key={apt._id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-600 uppercase">
                      {new Date(apt.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-primary-800 -mt-0.5">
                      {new Date(apt.scheduledDate).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{apt.reason || apt.type}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{apt.duration} minutes
                    </p>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'} dot>{apt.status}</Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Calendar} title="No upcoming appointments" description="You have no scheduled appointments." />
          )}
        </Card>

        {/* Health Risk */}
        <Card title="Health Assessment" icon={Activity}>
          {assessment ? (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
                <p className="text-xs text-slate-500 mb-2 font-medium">Overall Risk Level</p>
                <Badge
                  variant={assessment.overallRisk === 'low' ? 'success' : assessment.overallRisk === 'moderate' ? 'warning' : 'danger'}
                  size="md"
                >
                  {assessment.overallRisk?.toUpperCase()}
                </Badge>
                <p className="text-[11px] text-slate-400 mt-2">Confidence: {assessment.confidence}%</p>
              </div>

              {assessment.riskScores?.map((score, idx) => (
                <ProgressBar
                  key={idx}
                  value={score.score}
                  max={100}
                  label={score.category}
                  showPercentage
                  color={score.score < 30 ? 'green' : score.score < 60 ? 'orange' : 'red'}
                />
              ))}

              {assessment.recommendations && assessment.recommendations.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommendations</p>
                  {assessment.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 mb-2">
                      <Shield className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No assessment yet" description="Your health assessment will appear here." />
          )}
        </Card>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Results */}
        <Card title="Recent Lab Results" icon={TestTube}>
          {data?.recentLabResults && data.recentLabResults.length > 0 ? (
            <div className="space-y-2">
              {data.recentLabResults.map((lab, idx) => (
                <div key={lab._id || idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <TestTube className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{lab.testName}</p>
                    <p className="text-xs text-slate-400">{lab.category}</p>
                  </div>
                  <Badge variant={lab.status === 'completed' ? 'success' : lab.status === 'reviewed' ? 'info' : 'warning'} dot>
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
        <Card title="Current Medications" icon={Pill}>
          {data?.currentMedications && data.currentMedications.length > 0 ? (
            <div className="space-y-2">
              {data.currentMedications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{med.name}</p>
                    <p className="text-xs text-slate-400">{med.dosage} · {med.frequency}</p>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Pill} title="No medications" description="Your medications will appear here." />
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
