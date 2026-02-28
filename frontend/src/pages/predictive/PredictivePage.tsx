import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Badge, StatCard, EmptyState, Skeleton, PageHeader, ProgressBar } from '../../components/ui/Cards';
import {
  Brain,
  AlertTriangle,
  Shield,
  Activity,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { RiskAssessment } from '../../types';
import WorkflowNav from '../../components/ui/WorkflowNav';
import { cn } from '../../lib/utils';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const inputClass = 'flex-1 px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

export default function PredictivePage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; acknowledged: boolean; assessmentId?: string; alertIndex?: number; overallRisk?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assessments' | 'alerts'>('assessments');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [assessing, setAssessing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assessRes, alertRes] = await Promise.all([
        api.get('/predictive/assessments'),
        api.get('/predictive/alerts'),
      ]);
      setAssessments(assessRes.data.data || []);
      setAlerts(alertRes.data.data || []);
    } catch { console.error('Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleNewAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdInput) return;
    setAssessing(true);
    try {
      await api.post(`/predictive/assess/${patientIdInput}`);
      toast.success('Risk assessment completed');
      setPatientIdInput('');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Assessment failed');
    } finally { setAssessing(false); }
  };

  const acknowledgeAlert = async (assessmentId: string, alertIndex: number) => {
    try {
      await api.put(`/predictive/${assessmentId}/alerts/${alertIndex}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchData();
    } catch { toast.error('Failed to acknowledge alert'); }
  };

  const riskIcon = (risk: string) => {
    const map: Record<string, string> = { critical: 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600', high: 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600', moderate: 'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600', low: 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600' };
    return map[risk] || map.low;
  };

  if (loading) return (
    <div className="space-y-6">
      <WorkflowNav />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader icon={Brain} title="Predictive Engine" description="AI-powered risk assessment and health predictions" badge="AI Agent" />
      </motion.div>

      {/* New Assessment Form */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-1">Run Risk Assessment</p>
        <p className="text-xs text-slate-500 mb-3">Enter a patient ID to generate an AI risk assessment</p>
        <form onSubmit={handleNewAssessment} className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={patientIdInput} onChange={(e) => setPatientIdInput(e.target.value)} className={inputClass} placeholder="Enter patient ID" required />
          <button type="submit" disabled={assessing} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-sm shadow-primary-500/20">
            {assessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><BarChart3 className="w-4 h-4" />Assess Risk</>}
          </button>
        </form>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Assessments" value={assessments.length} icon={Activity} color="blue" />
        <StatCard title="Active Alerts" value={alerts.length} icon={AlertTriangle} color="red" />
        <StatCard title="High Risk Patients" value={assessments.filter((a) => a.overallRisk === 'high' || a.overallRisk === 'critical').length} icon={Heart} color="orange" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {(['assessments', 'alerts'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 py-3.5 text-sm font-medium transition-all', activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              {tab === 'assessments' ? <><Activity className="w-4 h-4 inline mr-1.5" />Risk Assessments ({assessments.length})</> : <><Bell className="w-4 h-4 inline mr-1.5" />Active Alerts ({alerts.length})</>}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'assessments' ? (
              <motion.div key="assessments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {assessments.length > 0 ? (
                  <div className="space-y-3">
                    {assessments.map((assessment, idx) => (
                      <motion.div key={assessment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => setExpandedId(expandedId === assessment._id ? null : assessment._id)}>
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', riskIcon(assessment.overallRisk))}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700">Patient: {typeof assessment.patientId === 'string' ? assessment.patientId.slice(-8) : 'N/A'}</p>
                            <p className="text-xs text-slate-500">{new Date(assessment.createdAt).toLocaleDateString()} · Confidence: {assessment.confidence ? (assessment.confidence * 100).toFixed(0) : 'N/A'}%</p>
                          </div>
                          <Badge dot variant={assessment.overallRisk === 'critical' ? 'danger' : assessment.overallRisk === 'high' ? 'warning' : assessment.overallRisk === 'moderate' ? 'info' : 'success'} size="md">
                            {assessment.overallRisk?.toUpperCase()} RISK
                          </Badge>
                          {expandedId === assessment._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>

                        <AnimatePresence>
                          {expandedId === assessment._id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="border-t border-slate-100 p-5 space-y-5">
                                {/* Risk Scores */}
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Risk Categories</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {assessment.riskScores?.map((score, sidx) => (
                                      <div key={sidx} className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
                                        <div className="flex justify-between text-sm mb-2">
                                          <span className="text-slate-600 capitalize font-medium">{score.category}</span>
                                          <span className="font-bold text-slate-800">{score.score}/100</span>
                                        </div>
                                        <ProgressBar value={score.score} max={100} color={score.score < 30 ? 'green' : score.score < 60 ? 'orange' : 'red'} />
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {score.factors?.map((f, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-lg text-slate-500 border border-slate-100">{f}</span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Predictions */}
                                {assessment.predictions?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Predictions</p>
                                    <div className="space-y-2">
                                      {assessment.predictions.map((pred, pidx) => (
                                        <div key={pidx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
                                          <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-700">{pred.condition}</p>
                                            <p className="text-xs text-slate-500">Timeframe: {pred.timeframe}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-800">{Math.round(pred.probability * 100)}%</span>
                                            {pred.preventable && <Badge variant="success" dot>Preventable</Badge>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recommendations */}
                                {assessment.recommendations?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Recommendations</p>
                                    <div className="space-y-2">
                                      {assessment.recommendations.map((rec, ridx) => (
                                        <div key={ridx} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
                                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Shield className="w-3.5 h-3.5 text-primary-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'default'}>{rec.priority}</Badge>
                                              <Badge variant="purple">{rec.type}</Badge>
                                            </div>
                                            <p className="text-sm text-slate-700">{rec.description}</p>
                                            <p className="text-xs text-slate-400 mt-1">Evidence: {rec.evidenceBasis}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Activity} title="No assessments yet" description="Run a risk assessment to see results here." />
                )}
              </motion.div>
            ) : (
              <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className={cn('flex items-start gap-4 p-4 rounded-xl border-l-4', alert.type === 'critical' ? 'bg-gradient-to-r from-red-50 to-rose-50/50 border-l-red-500' : 'bg-gradient-to-r from-amber-50 to-orange-50/50 border-l-amber-500')}>
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', alert.type === 'critical' ? 'bg-red-100' : 'bg-amber-100')}>
                          <AlertTriangle className={cn('w-4 h-4', alert.type === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge dot variant={alert.overallRisk === 'critical' ? 'danger' : 'warning'}>{alert.overallRisk} risk</Badge>
                            <Badge variant={alert.type === 'critical' ? 'danger' : 'warning'}>{alert.type}</Badge>
                          </div>
                        </div>
                        <button onClick={() => acknowledgeAlert(alert.assessmentId ?? '', idx)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />Acknowledge
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Bell} title="No active alerts" description="All alerts have been acknowledged." />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
