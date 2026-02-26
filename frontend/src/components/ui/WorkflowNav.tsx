import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCheck,
  FileText,
  Languages,
  Brain,
  ClipboardList,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const workflowSteps = [
  { path: '/patients', label: 'Patient Interaction', icon: UserCheck, step: 1 },
  { path: '/clinical-docs', label: 'Clinical Docs AI', icon: FileText, step: 2 },
  { path: '/translator', label: 'Patient Translator', icon: Languages, step: 3 },
  { path: '/predictive', label: 'Predictive Engine', icon: Brain, step: 4 },
  { path: '/workflow', label: 'Workflow Automation', icon: ClipboardList, step: 5 },
  { path: '/research', label: 'Research Synthesizer', icon: BookOpen, step: 6 },
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
    <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg px-4 py-2.5">
      {/* Previous step */}
      <div className="flex-1">
        {prev && (
          <button
            onClick={() => navigate(prev.path)}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <prev.icon className="w-3.5 h-3.5" />
            <span className="font-medium">{prev.label}</span>
          </button>
        )}
      </div>

      {/* Current step indicator */}
      <div className="flex items-center gap-1.5">
        {workflowSteps.map((step, i) => (
          <button
            key={step.path}
            onClick={() => navigate(step.path)}
            title={step.label}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIdx
                ? 'w-6 bg-primary-500'
                : i < currentIdx
                ? 'bg-emerald-400'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
        <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Step {current.step}/6
        </span>
      </div>

      {/* Next step */}
      <div className="flex-1 flex justify-end">
        {next && (
          <button
            onClick={() => navigate(next.path)}
            className="inline-flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            <span>Next: {next.label}</span>
            <next.icon className="w-3.5 h-3.5" />
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {!next && (
          <button
            onClick={() => navigate('/pipeline')}
            className="inline-flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            <span>Run Full Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
