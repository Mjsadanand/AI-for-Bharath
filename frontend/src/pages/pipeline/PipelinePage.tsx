import { useState, useEffect } from 'react';
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
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface PipelineStep {
  step: number;
  name: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  data?: any;
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
const stepColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', ring: 'ring-blue-500/20' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-500', ring: 'ring-indigo-500/20' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-500', ring: 'ring-teal-500/20' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500', ring: 'ring-orange-500/20' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', ring: 'ring-purple-500/20' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
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
  const [statusData, setStatusData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data.data || res.data);
    } catch {
      toast.error('Failed to load patients');
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
    if (patientId) {
      loadPipelineStatus(patientId);
    }
  };

  const runPipeline = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (!chiefComplaint.trim()) {
      toast.error('Please enter a chief complaint');
      return;
    }

    setRunning(true);
    setResult(null);
    setExpandedStep(null);

    // Simulate step-by-step progression
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Pipeline failed');
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

  const getStepData = (stepNum: number) => {
    if (!result) return null;
    return result.steps.find((s) => s.step === stepNum)?.data;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CARENET Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Run the complete 6-step healthcare AI pipeline — from patient interaction to research synthesis
        </p>
      </div>

      {/* Pipeline Visual Flow */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Pipeline Flow
          </h2>
          {result && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
              Completed at {new Date(result.completedAt!).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* 6-Step Visual Pipeline */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const Icon = stepIcons[stepNum - 1];
            const colors = stepColors[stepNum - 1];
            const status = getStepStatus(stepNum);
            const stepNames = [
              'Doctor ↔ Patient',
              'Clinical Docs AI',
              'Patient Translator',
              'Predictive Engine',
              'Workflow Auto',
              'Research Synth',
            ];

            return (
              <div key={stepNum} className="flex items-center">
                <button
                  onClick={() => setExpandedStep(expandedStep === stepNum ? null : stepNum)}
                  className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    status === 'completed'
                      ? `${colors.bg} ${colors.border} shadow-sm ring-2 ${colors.ring}`
                      : status === 'running'
                      ? `${colors.bg} ${colors.border} animate-pulse shadow-md`
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      status === 'completed'
                        ? colors.accent
                        : status === 'running'
                        ? `${colors.accent} animate-spin-slow`
                        : 'bg-gray-300'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'running' ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight ${
                      status === 'completed' ? colors.text : status === 'running' ? colors.text : 'text-gray-400'
                    }`}
                  >
                    Step {stepNum}
                  </span>
                  <span
                    className={`text-[9px] text-center mt-0.5 ${
                      status === 'completed' ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {stepNames[stepNum - 1]}
                  </span>
                </button>
                {stepNum < 6 && (
                  <ArrowRight
                    className={`w-4 h-4 mx-1 flex-shrink-0 ${
                      getStepStatus(stepNum) === 'completed' ? 'text-green-500' : 'text-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step description labels */}
        <div className="grid grid-cols-6 gap-2">
          {stepDescriptions.map((desc, i) => (
            <p key={i} className="text-[9px] text-gray-400 text-center px-1">
              {desc}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Pipeline Input</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {(p.userId as any)?.name || p.name || p._id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Persistent headache for 3 days"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">History of Present Illness</label>
                <textarea
                  value={hpiText}
                  onChange={(e) => setHpiText(e.target.value)}
                  rows={3}
                  placeholder="Describe symptoms, onset, duration..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assessment (comma-separated)</label>
                <input
                  type="text"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g., Hypertension, Diabetes"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan (comma-separated)</label>
                <input
                  type="text"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="e.g., Start medication, Follow-up in 2 weeks"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={runPipeline}
                disabled={running || !selectedPatient}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              </button>
            </div>
          </div>

          {/* Previous pipeline status widget */}
          {statusData && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Previous Status</h3>
                <button
                  onClick={() => loadPipelineStatus(selectedPatient)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-2">
                {[statusData.step2, statusData.step3, statusData.step4, statusData.step5, statusData.step6].map(
                  (step: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{step.name}</span>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Result details */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            result.steps.map((step) => {
              const colors = stepColors[step.step - 1];
              const Icon = stepIcons[step.step - 1];
              const isExpanded = expandedStep === step.step;

              return (
                <div
                  key={step.step}
                  className={`bg-white rounded-xl border ${colors.border} overflow-hidden transition-all`}
                >
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 ${colors.bg} hover:opacity-90 transition-colors`}
                  >
                    <div className={`w-8 h-8 ${colors.accent} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        Step {step.step}: {step.name}
                      </span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <StepDetail step={step.step} data={step.data} />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-500">No pipeline results yet</h3>
              <p className="text-xs text-gray-400 mt-1">
                Select a patient and run the full pipeline to see results here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDetail({ step, data }: { step: number; data: any }) {
  if (!data) return <p className="text-sm text-gray-500">No data available</p>;

  switch (step) {
    case 1:
      return (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Patient:</span>
            <span className="text-gray-800">{data.patientName || 'N/A'}</span>
          </div>
          {data.conditions?.length > 0 && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">Conditions:</span>
              <div className="flex flex-wrap gap-1">
                {data.conditions.map((c: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.medications?.length > 0 && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">Medications:</span>
              <span className="text-gray-800">{data.medications.join(', ')}</span>
            </div>
          )}
          {data.latestVitals && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">Latest Vitals:</span>
              <span className="text-gray-800">
                {data.latestVitals.bloodPressure
                  ? `BP: ${data.latestVitals.bloodPressure.systolic}/${data.latestVitals.bloodPressure.diastolic}`
                  : ''}
                {data.latestVitals.heartRate ? ` | HR: ${data.latestVitals.heartRate}` : ''}
                {data.latestVitals.temperature ? ` | Temp: ${data.latestVitals.temperature}°` : ''}
              </span>
            </div>
          )}
        </div>
      );

    case 2:
      return (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Note ID:</span>
            <span className="text-gray-800 font-mono text-xs">{data.noteId}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Type:</span>
            <span className="text-gray-800 capitalize">{data.noteType}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Entities Found:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
              {data.extractedEntities} extracted
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Assessments:</span>
            <span className="text-gray-800">{data.assessments} diagnosis entries</span>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-600">Original Report:</span>
            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 whitespace-pre-wrap">
              {data.originalText}
            </pre>
          </div>
          <div>
            <span className="font-medium text-gray-600">Simplified Report:</span>
            <pre className="mt-1 p-3 bg-teal-50 rounded-lg text-xs text-teal-800 whitespace-pre-wrap">
              {data.simplifiedText}
            </pre>
          </div>
          {data.translatedTerms?.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Translated Terms:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {data.translatedTerms.map((t: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                    <strong>{t.original}</strong> → {t.simplified}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 4:
      return (
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Overall Risk:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                data.overallRisk === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : data.overallRisk === 'high'
                  ? 'bg-orange-100 text-orange-700'
                  : data.overallRisk === 'moderate'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {data.overallRisk?.toUpperCase()}
            </span>
          </div>
          {data.riskScores?.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Risk Scores:</span>
              <div className="mt-2 space-y-2">
                {data.riskScores.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-24">{r.category}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          r.level === 'high' ? 'bg-red-500' : r.level === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8">{r.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Predictions: {data.predictions}</span>
            <span>Alerts: {data.alerts}</span>
            <span>Recommendations: {data.recommendations}</span>
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Actions Created:</span>
            <span className="text-gray-800">{data.actionsCreated}</span>
          </div>
          {data.actions?.map((action: any, i: number) => (
            <div key={i} className="p-3 bg-purple-50 rounded-lg flex items-center gap-3">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-purple-800 capitalize">
                  {action.type.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-purple-600">
                  Scheduled: {new Date(action.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 6:
      return (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Search Terms:</span>
            <div className="flex flex-wrap gap-1">
              {data.searchTerms?.map((t: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-600 w-28">Papers Found:</span>
            <span className="text-gray-800">{data.papersFound}</span>
          </div>
          {data.papers?.length > 0 && (
            <div className="space-y-2 mt-2">
              {data.papers.map((p: any, i: number) => (
                <div key={i} className="p-2 bg-emerald-50 rounded-lg">
                  <p className="text-xs font-medium text-emerald-800">{p.title}</p>
                  <p className="text-[10px] text-emerald-600">
                    Citations: {p.citations} | Category: {p.category}
                  </p>
                </div>
              ))}
            </div>
          )}
          {data.papersFound === 0 && (
            <p className="text-xs text-gray-500 italic">
              No matching research papers found in the database. Papers can be added via the Research module.
            </p>
          )}
        </div>
      );

    default:
      return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }
}
