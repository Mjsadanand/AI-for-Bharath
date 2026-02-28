import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  UserCheck,
  FileText,
  Languages,
  Brain,
  ClipboardList,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from 'lucide-react';

const workflowSteps = [
  { path: '/patients', label: 'Patient Interaction', shortLabel: 'Patient', icon: UserCheck, step: 1, color: 'text-blue-600 bg-blue-50' },
  { path: '/clinical-docs', label: 'Clinical Docs AI', shortLabel: 'Docs', icon: FileText, step: 2, color: 'text-emerald-600 bg-emerald-50' },
  { path: '/translator', label: 'Patient Translator', shortLabel: 'Translate', icon: Languages, step: 3, color: 'text-purple-600 bg-purple-50' },
  { path: '/predictive', label: 'Predictive Engine', shortLabel: 'Predict', icon: Brain, step: 4, color: 'text-orange-600 bg-orange-50' },
  { path: '/workflow', label: 'Workflow Automation', shortLabel: 'Workflow', icon: ClipboardList, step: 5, color: 'text-teal-600 bg-teal-50' },
  { path: '/research', label: 'Research Synthesizer', shortLabel: 'Research', icon: BookOpen, step: 6, color: 'text-indigo-600 bg-indigo-50' },
];

export default function WorkflowNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIdx = workflowSteps.findIndex((s) => s.path === location.pathname);
  if (currentIdx === -1) return null;

  const prev = currentIdx > 0 ? workflowSteps[currentIdx - 1] : null;
  const next = currentIdx < workflowSteps.length - 1 ? workflowSteps[currentIdx + 1] : null;
  const current = workflowSteps[currentIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm"
    >
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3 px-1">
        {workflowSteps.map((step, i) => {
          const isActive = i === currentIdx;
          const isComplete = i < currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.path} className="flex items-center">
              <button
                onClick={() => navigate(step.path)}
                title={step.label}
                className={cn(
                  'relative flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? 'w-auto px-3 py-1.5 bg-primary-50 border border-primary-200 shadow-sm'
                    : isComplete
                    ? 'w-8 h-8 bg-emerald-50 hover:bg-emerald-100'
                    : 'w-8 h-8 bg-slate-50 hover:bg-slate-100'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <StepIcon className={cn('w-4 h-4', isActive ? 'text-primary-600' : 'text-slate-400')} />
                )}
                {isActive && (
                  <span className="ml-1.5 text-xs font-semibold text-primary-700 hidden sm:inline">
                    {step.shortLabel}
                  </span>
                )}
              </button>
              {i < workflowSteps.length - 1 && (
                <div className={cn(
                  'w-4 sm:w-8 h-px mx-0.5',
                  i < currentIdx ? 'bg-emerald-300' : 'bg-slate-200'
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
              onClick={() => navigate(prev.path)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{prev.label}</span>
            </button>
          )}
        </div>

        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Step {current.step} / 6
        </span>

        <div className="flex-1 flex justify-end">
          {next ? (
            <button
              onClick={() => navigate(next.path)}
              className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              <span className="hidden sm:inline">{next.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/pipeline')}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
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
