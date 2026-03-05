import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { usePatient } from '../../contexts/PatientContext';
import {
  UserCheck,
  FileText,
  Brain,
  ClipboardList,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  User,
  X,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const workflowSteps = [
  { path: '/patients', label: 'Patient Interaction', shortLabel: 'Patient', icon: UserCheck, step: 1, color: 'text-blue-600 bg-blue-50' },
  { path: '/clinical-docs', label: 'Clinical Docs AI', shortLabel: 'Docs', icon: FileText, step: 2, color: 'text-emerald-600 bg-emerald-50' },
  { path: '/predictive', label: 'Predictive Engine', shortLabel: 'Predict', icon: Brain, step: 3, color: 'text-orange-600 bg-orange-50' },
  { path: '/workflow', label: 'Workflow Automation', shortLabel: 'Workflow', icon: ClipboardList, step: 4, color: 'text-teal-600 bg-teal-50' },
  { path: '/research', label: 'Research Synthesizer', shortLabel: 'Research', icon: BookOpen, step: 5, color: 'text-indigo-600 bg-indigo-50' },
];

export default function WorkflowNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPatient, clearPatient } = usePatient();

  const currentIdx = workflowSteps.findIndex((s) => s.path === location.pathname);
  if (currentIdx === -1) return null;

  const prev = currentIdx > 0 ? workflowSteps[currentIdx - 1] : null;
  const next = currentIdx < workflowSteps.length - 1 ? workflowSteps[currentIdx + 1] : null;
  const current = workflowSteps[currentIdx];

  // Steps 2-5 are locked until a patient is chosen
  const hasPatient = !!selectedPatient;
  const isStepLocked = (stepIndex: number) => !hasPatient && stepIndex > 0;

  const navTo = (path: string, stepIndex?: number) => {
    if (stepIndex !== undefined && isStepLocked(stepIndex)) {
      toast.error('Select a patient first to unlock this step');
      return;
    }
    const params = selectedPatient ? `?patient=${selectedPatient._id}` : '';
    navigate(path + params);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm"
    >
      {/* Selected patient indicator */}
      {selectedPatient ? (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-xl flex-1">
            <User className="w-3.5 h-3.5 text-primary-600" />
            <span className="text-xs font-semibold text-primary-700 truncate">
              {selectedPatient.name}
              {selectedPatient.patientCode && <span className="text-primary-500 ml-1">({selectedPatient.patientCode})</span>}
            </span>
          </div>
          <button
            onClick={clearPatient}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear patient selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex-1">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              Select a patient to unlock workflow steps
            </span>
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3 px-1">
        {workflowSteps.map((step, i) => {
          const isActive = i === currentIdx;
          const isComplete = i < currentIdx;
          const locked = isStepLocked(i);
          const StepIcon = step.icon;

          return (
            <div key={step.path} className="flex items-center">
              <button
                onClick={() => navTo(step.path, i)}
                title={locked ? `🔒 ${step.label} — select a patient first` : step.label}
                className={cn(
                  'relative flex items-center justify-center rounded-xl transition-all duration-200',
                  locked
                    ? 'w-8 h-8 bg-slate-100 cursor-not-allowed opacity-50'
                    : isActive
                    ? 'w-auto px-3 py-1.5 bg-primary-50 border border-primary-200 shadow-sm'
                    : isComplete
                    ? 'w-8 h-8 bg-emerald-50 hover:bg-emerald-100'
                    : 'w-8 h-8 bg-slate-50 hover:bg-slate-100'
                )}
              >
                {locked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <StepIcon className={cn('w-4 h-4', isActive ? 'text-primary-600' : 'text-slate-400')} />
                )}
                {isActive && !locked && (
                  <span className="ml-1.5 text-xs font-semibold text-primary-700 hidden sm:inline">
                    {step.shortLabel}
                  </span>
                )}
              </button>
              {i < workflowSteps.length - 1 && (
                <div className={cn(
                  'w-4 sm:w-8 h-px mx-0.5',
                  i < currentIdx && !isStepLocked(i + 1) ? 'bg-emerald-300' : 'bg-slate-200'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex-1">
          {prev && (
            <button
              onClick={() => navTo(prev.path, currentIdx - 1)}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs transition-colors font-medium',
                isStepLocked(currentIdx - 1)
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-primary-600'
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{prev.label}</span>
            </button>
          )}
        </div>

        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Step {current.step} / 5
        </span>

        <div className="flex-1 flex justify-end">
          {next ? (
            <button
              onClick={() => navTo(next.path, currentIdx + 1)}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
                isStepLocked(currentIdx + 1)
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-primary-600 hover:text-primary-700'
              )}
            >
              {isStepLocked(currentIdx + 1) && <Lock className="w-3 h-3" />}
              <span className="hidden sm:inline">{next.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => navTo('/pipeline', 1)}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
                !hasPatient
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-emerald-600 hover:text-emerald-700'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
