import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, Badge, StatCard, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
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

export default function PredictivePage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assessments' | 'alerts'>('assessments');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assessRes, alertRes] = await Promise.all([
        api.get('/predictive'),
        api.get('/predictive/alerts'),
      ]);
      setAssessments(assessRes.data.data || []);
      setAlerts(alertRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assessment failed');
    } finally {
      setAssessing(false);
    }
  };

  const acknowledgeAlert = async (assessmentId: string, alertIndex: number) => {
    try {
      await api.put(`/predictive/${assessmentId}/alerts/${alertIndex}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchData();
    } catch (err) {
      toast.error('Failed to acknowledge alert');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary-500" />
            Predictive Engine
          </h1>
          <p className="text-slate-500 mt-1">AI-powered risk assessment and health predictions</p>
        </div>
      </div>

      {/* New Assessment Form */}
      <Card title="Run Risk Assessment" subtitle="Enter a patient ID to generate an AI risk assessment">
        <form onSubmit={handleNewAssessment} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={patientIdInput}
            onChange={(e) => setPatientIdInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter patient ID"
            required
          />
          <button
            type="submit"
            disabled={assessing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {assessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Assess Risk
              </>
            )}
          </button>
        </form>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Assessments" value={assessments.length} icon={Activity} color="blue" />
        <StatCard title="Active Alerts" value={alerts.length} icon={AlertTriangle} color="red" />
        <StatCard
          title="High Risk Patients"
          value={assessments.filter((a) => a.overallRisk === 'high' || a.overallRisk === 'critical').length}
          icon={Heart}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'assessments'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1.5" />
            Risk Assessments ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5" />
            Active Alerts ({alerts.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'assessments' ? (
            assessments.length > 0 ? (
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <div key={assessment._id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === assessment._id ? null : assessment._id)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        assessment.overallRisk === 'critical' ? 'bg-red-100' :
                        assessment.overallRisk === 'high' ? 'bg-orange-100' :
                        assessment.overallRisk === 'moderate' ? 'bg-amber-100' : 'bg-emerald-100'
                      }`}>
                        <Shield className={`w-5 h-5 ${
                          assessment.overallRisk === 'critical' ? 'text-red-600' :
                          assessment.overallRisk === 'high' ? 'text-orange-600' :
                          assessment.overallRisk === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">
                          Patient: {typeof assessment.patientId === 'string' ? assessment.patientId.slice(-8) : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(assessment.assessmentDate).toLocaleDateString()} · Confidence: {assessment.confidence}%
                        </p>
                      </div>
                      <Badge variant={
                        assessment.overallRisk === 'critical' ? 'danger' :
                        assessment.overallRisk === 'high' ? 'warning' :
                        assessment.overallRisk === 'moderate' ? 'info' : 'success'
                      } size="md">
                        {assessment.overallRisk?.toUpperCase()} RISK
                      </Badge>
                      {expandedId === assessment._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    {expandedId === assessment._id && (
                      <div className="border-t border-slate-100 p-5 space-y-5 animate-fade-in">
                        {/* Risk Scores */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Risk Categories</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {assessment.riskScores?.map((score, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-slate-50">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-600 capitalize">{score.category}</span>
                                  <span className="font-bold text-slate-800">{score.score}/100</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      score.score < 30 ? 'bg-emerald-500' :
                                      score.score < 60 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${score.score}%` }}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {score.factors?.map((f, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-white rounded text-slate-500">{f}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Predictions */}
                        {assessment.predictions?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Predictions</p>
                            <div className="space-y-2">
                              {assessment.predictions.map((pred, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700">{pred.condition}</p>
                                    <p className="text-xs text-slate-500">Timeframe: {pred.timeframe}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-800">{Math.round(pred.probability * 100)}%</span>
                                    {pred.preventable && <Badge variant="success">Preventable</Badge>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {assessment.recommendations?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Recommendations</p>
                            <div className="space-y-2">
                              {assessment.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                  <Shield className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'default'}>
                                        {rec.priority}
                                      </Badge>
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
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Activity} title="No assessments yet" description="Run a risk assessment to see results here." />
            )
          ) : (
            alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${
                    alert.type === 'critical' ? 'bg-red-50 border-l-red-500' : 'bg-amber-50 border-l-amber-500'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      alert.type === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={alert.overallRisk === 'critical' ? 'danger' : 'warning'}>
                          {alert.overallRisk} risk
                        </Badge>
                        <Badge variant={alert.type === 'critical' ? 'danger' : 'warning'}>
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.assessmentId, idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Bell} title="No active alerts" description="All alerts have been acknowledged." />
            )
          )}
        </div>
      </div>
    </div>
  );
}
