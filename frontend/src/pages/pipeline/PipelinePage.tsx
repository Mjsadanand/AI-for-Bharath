import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  FileText,
  Languages,
  Brain,
  ClipboardList,
  BookOpen,
  Play,
  CheckCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { PageHeader, Badge, Skeleton } from '../../components/ui/Cards';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-slate-400';

interface PipelineStep {
  step: number;
  name: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  data?: Record<string, unknown>;
}

interface PatientOption {
  _id: string;
  name: string;
  userId?: { name: string };
  chronicConditions?: string[];
}

interface PipelineResult {
  steps: PipelineStep[];
  completedAt: string | null;
  patientId: string;
  patientName: string;
  clinicalNoteId: string;
  riskAssessmentId: string;
}

const stepIcons = [UserCheck, FileText, Languages, Brain, ClipboardList, BookOpen];
const stepGradients = [
  { from: 'from-blue-500', to: 'to-cyan-400', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-400/20' },
  { from: 'from-indigo-500', to: 'to-violet-400', bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-200', text: 'text-indigo-700', ring: 'ring-indigo-400/20' },
  { from: 'from-teal-500', to: 'to-emerald-400', bg: 'from-teal-50 to-emerald-50', border: 'border-teal-200', text: 'text-teal-700', ring: 'ring-teal-400/20' },
  { from: 'from-amber-500', to: 'to-orange-400', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-400/20' },
  { from: 'from-purple-500', to: 'to-fuchsia-400', bg: 'from-purple-50 to-fuchsia-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'ring-purple-400/20' },
  { from: 'from-emerald-500', to: 'to-green-400', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-400/20' },
];

const stepNames = [
  'Doctor ↔ Patient',
  'Clinical Docs AI',
  'Patient Translator',
  'Predictive Engine',
  'Workflow Auto',
  'Research Synth',
];
const stepDescriptions = [
  'Retrieve patient data, medical history, and current vitals',
  'Generate structured clinical documentation with AI-powered entity extraction',
  'Translate medical terminology into patient-friendly language',
  'Analyze health risks, generate predictions, and create alerts',
  'Automate scheduling, follow-ups, and clinical workflow tasks',
  'Find relevant medical research based on patient conditions',
];

export default function PipelinePage() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpiText, setHpiText] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data.data || res.data);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadPipelineStatus = async (patientId: string) => {
    setLoadingStatus(true);
    try {
      const res = await api.get(`/pipeline/status/${patientId}`);
      setStatusData(res.data.data);
    } catch {
      setStatusData(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setResult(null);
    setStatusData(null);
    if (patientId) loadPipelineStatus(patientId);
  };

  const runPipeline = async () => {
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    if (!chiefComplaint.trim()) { toast.error('Please enter a chief complaint'); return; }

    setRunning(true);
    setResult(null);
    setExpandedStep(null);

    for (let i = 1; i <= 6; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const res = await api.post(`/pipeline/run/${selectedPatient}`, {
        chiefComplaint,
        historyOfPresentIllness: hpiText,
        assessment: assessment
          ? assessment.split(',').map((a) => ({ diagnosis: a.trim(), severity: 'moderate' }))
          : undefined,
        plan: plan
          ? plan.split(',').map((p) => ({ treatment: p.trim() }))
          : undefined,
      });

      setResult(res.data.data);
      setCurrentStep(7);
      toast.success('Pipeline completed successfully!');
      loadPipelineStatus(selectedPatient);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Pipeline failed');
      setCurrentStep(0);
    } finally {
      setRunning(false);
    }
  };

  const getStepStatus = (stepNum: number): 'completed' | 'running' | 'pending' => {
    if (result) return 'completed';
    if (running) {
      if (stepNum < currentStep) return 'completed';
      if (stepNum === currentStep) return 'running';
    }
    return 'pending';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Zap}
          title="CARENET Pipeline"
          description="Run the complete 6-step healthcare AI pipeline — from patient interaction to research synthesis"
          badge={<Badge variant="info" dot>AI Pipeline</Badge>}
        />
      </motion.div>

      {/* Pipeline Visual Flow */}
      <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-600" />
            </div>
            Pipeline Flow
          </h2>
          {result && (
            <Badge variant="success" dot>
              Completed at {new Date(result.completedAt!).toLocaleTimeString()}
            </Badge>
          )}
        </div>

        {/* 6-Step Visual Pipeline */}
        <div className="grid grid-cols-6 gap-2 mb-5">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const Icon = stepIcons[stepNum - 1];
            const g = stepGradients[stepNum - 1];
            const status = getStepStatus(stepNum);

            return (
              <div key={stepNum} className="flex items-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setExpandedStep(expandedStep === stepNum ? null : stepNum)}
                  className={cn(
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer',
                    status === 'completed' && `bg-gradient-to-br ${g.bg} ${g.border} shadow-sm ring-2 ${g.ring}`,
                    status === 'running' && `bg-gradient-to-br ${g.bg} ${g.border} shadow-md`,
                    status === 'pending' && 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all',
                      status === 'completed' && `bg-gradient-to-br ${g.from} ${g.to} shadow-sm`,
                      status === 'running' && `bg-gradient-to-br ${g.from} ${g.to} animate-pulse shadow-md`,
                      status === 'pending' && 'bg-slate-300',
                    )}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'running' ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold text-center leading-tight',
                    status !== 'pending' ? g.text : 'text-slate-400',
                  )}>
                    Step {stepNum}
                  </span>
                  <span className={cn(
                    'text-[9px] text-center mt-0.5',
                    status === 'completed' ? 'text-slate-600' : 'text-slate-400',
                  )}>
                    {stepNames[stepNum - 1]}
                  </span>
                </motion.button>
                {stepNum < 6 && (
                  <ArrowRight
                    className={cn(
                      'w-4 h-4 mx-1 flex-shrink-0 transition-colors',
                      getStepStatus(stepNum) === 'completed' ? 'text-emerald-500' : 'text-slate-300',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step description labels */}
        <div className="grid grid-cols-6 gap-2">
          {stepDescriptions.map((desc, i) => (
            <p key={i} className="text-[9px] text-slate-400 text-center px-1 leading-relaxed">{desc}</p>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <motion.div variants={fadeUp} className="lg:col-span-1 space-y-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              Pipeline Input
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {(p.userId as { name?: string })?.name || p.name || p._id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Chief Complaint *</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Persistent headache for 3 days"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">History of Present Illness</label>
                <textarea
                  value={hpiText}
                  onChange={(e) => setHpiText(e.target.value)}
                  rows={3}
                  placeholder="Describe symptoms, onset, duration..."
                  className={cn(inputClass, 'resize-none')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Assessment (comma-separated)</label>
                <input
                  type="text"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g., Hypertension, Diabetes"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Plan (comma-separated)</label>
                <input
                  type="text"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="e.g., Start medication, Follow-up in 2 weeks"
                  className={inputClass}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={runPipeline}
                disabled={running || !selectedPatient}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Full Pipeline
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Previous pipeline status widget */}
          <AnimatePresence>
            {statusData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">Previous Status</h3>
                  <button
                    onClick={() => loadPipelineStatus(selectedPatient)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <RefreshCw className={cn('w-4 h-4', loadingStatus && 'animate-spin')} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {[statusData.step2, statusData.step3, statusData.step4, statusData.step5, statusData.step6].map(
                    (step: unknown, i: number) => {
                      const s = step as { name: string; completed: boolean };
                      return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{s.name}</span>
                        {s.completed ? (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                      );
                    },
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Result details */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-3"
              >
                {result.steps.map((step, idx) => {
                  const g = stepGradients[step.step - 1];
                  const Icon = stepIcons[step.step - 1];
                  const isExpanded = expandedStep === step.step;

                  return (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className={cn(
                        'bg-white/80 backdrop-blur rounded-2xl border overflow-hidden transition-all shadow-sm',
                        g.border,
                      )}
                    >
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                        className={cn(
                          'w-full flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r hover:opacity-90 transition-all',
                          g.bg,
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', g.from, g.to)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className={cn('text-sm font-semibold', g.text)}>
                            Step {step.step}: {step.name}
                          </span>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 py-4 border-t border-slate-100">
                              <StepDetail step={step.step} data={step.data} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-14 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600">No pipeline results yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                  Select a patient and run the full pipeline to see AI-powered results here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Step Detail Sub-Component (enhanced) ─── */
function StepDetail({ step, data }: { step: number; data: Record<string, unknown> }) {
  if (!data) return <p className="text-sm text-slate-400 italic">No data available</p>;

  const labelClass = 'font-medium text-slate-500 text-xs w-28 flex-shrink-0';
  const valueClass = 'text-slate-800 text-sm';

  switch (step) {
    case 1:
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className={labelClass}>Patient</span>
            <span className={cn(valueClass, 'font-semibold')}>{data.patientName || 'N/A'}</span>
          </div>
          {data.conditions?.length > 0 && (
            <div className="flex gap-3 items-start">
              <span className={labelClass}>Conditions</span>
              <div className="flex flex-wrap gap-1.5">
                {data.conditions.map((c: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200/60 rounded-lg text-xs font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.medications?.length > 0 && (
            <div className="flex gap-3 items-start">
              <span className={labelClass}>Medications</span>
              <span className={valueClass}>{data.medications.join(', ')}</span>
            </div>
          )}
          {data.latestVitals && (
            <div className="flex gap-3 items-start">
              <span className={labelClass}>Latest Vitals</span>
              <div className="flex flex-wrap gap-2">
                {data.latestVitals.bloodPressure && (
                  <span className="px-2.5 py-1 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/60 rounded-lg text-xs">
                    BP: {data.latestVitals.bloodPressure.systolic}/{data.latestVitals.bloodPressure.diastolic}
                  </span>
                )}
                {data.latestVitals.heartRate && (
                  <span className="px-2.5 py-1 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200/60 rounded-lg text-xs">
                    HR: {data.latestVitals.heartRate}
                  </span>
                )}
                {data.latestVitals.temperature && (
                  <span className="px-2.5 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs">
                    Temp: {data.latestVitals.temperature}°
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );

    case 2:
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Note ID</span>
            <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">{data.noteId}</code>
          </div>
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Type</span>
            <Badge variant="info">{data.noteType}</Badge>
          </div>
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Entities Found</span>
            <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-semibold">
              {data.extractedEntities} extracted
            </span>
          </div>
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Assessments</span>
            <span className={valueClass}>{data.assessments} diagnosis entries</span>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Original Report</span>
            <pre className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl text-xs text-slate-700 whitespace-pre-wrap border border-slate-200/60">
              {data.originalText}
            </pre>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Simplified Report</span>
            <pre className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl text-xs text-teal-800 whitespace-pre-wrap border border-teal-200/60">
              {data.simplifiedText}
            </pre>
          </div>
          {data.translatedTerms?.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Translated Terms</span>
              <div className="flex flex-wrap gap-2">
                {data.translatedTerms.map((t: unknown, i: number) => {
                  const term = t as { original: string; simplified: string };
                  return (
                  <span key={i} className="px-2.5 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200/60 rounded-xl text-xs">
                    <strong>{term.original}</strong> → {term.simplified}
                  </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Overall Risk</span>
            <Badge
              variant={
                data.overallRisk === 'critical' || data.overallRisk === 'high'
                  ? 'danger'
                  : data.overallRisk === 'moderate'
                  ? 'warning'
                  : 'success'
              }
              dot
            >
              {data.overallRisk?.toUpperCase()}
            </Badge>
          </div>
          {data.riskScores?.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-500 mb-2 block">Risk Scores</span>
              <div className="space-y-2.5">
                {data.riskScores.map((r: unknown, i: number) => {
                  const risk = r as { category: string; score: number; level: string };
                  return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-24 flex-shrink-0">{risk.category}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${risk.score}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className={cn(
                          'h-2.5 rounded-full',
                          risk.level === 'high' ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                          risk.level === 'moderate' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                          'bg-gradient-to-r from-emerald-500 to-green-400',
                        )}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-8 text-right">{risk.score}</span>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-4 pt-1">
            {[
              { label: 'Predictions', value: data.predictions },
              { label: 'Alerts', value: data.alerts },
              { label: 'Recommendations', value: data.recommendations },
            ].map((item) => (
              <div key={item.label} className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100/80 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block">{item.label}</span>
                <span className="text-sm font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Actions Created</span>
            <span className="text-sm font-semibold text-slate-800">{data.actionsCreated}</span>
          </div>
          {(data.actions as Array<{ type: string; date: string }>)?.map((action, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3.5 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl flex items-center gap-3 border border-purple-200/60"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-sm">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-800 capitalize">
                  {action.type.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-purple-600">
                  Scheduled: {new Date(action.date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      );

    case 6:
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className={labelClass}>Search Terms</span>
            <div className="flex flex-wrap gap-1.5">
              {data.searchTerms?.map((t: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <span className={labelClass}>Papers Found</span>
            <span className="text-sm font-semibold text-slate-800">{data.papersFound}</span>
          </div>
          {data.papers?.length > 0 && (
            <div className="space-y-2 mt-1">
              {(data.papers as Array<{ title: string; citations: number; category: string }>).map((p, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60"
                >
                  <p className="text-xs font-semibold text-emerald-800">{p.title}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-emerald-600">Citations: {p.citations}</span>
                    <span className="text-[10px] text-emerald-600">Category: {p.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {data.papersFound === 0 && (
            <p className="text-xs text-slate-400 italic pl-[7.5rem]">
              No matching research papers found. Papers can be added via the Research module.
            </p>
          )}
        </div>
      );

    default:
      return <pre className="text-xs bg-slate-50 p-3 rounded-xl">{JSON.stringify(data, null, 2)}</pre>;
  }
}
