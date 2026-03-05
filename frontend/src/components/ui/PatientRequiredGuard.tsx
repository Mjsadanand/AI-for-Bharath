import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePatient } from '../../contexts/PatientContext';
import { Lock, UserCheck, ArrowRight } from 'lucide-react';
import WorkflowNav from './WorkflowNav';

/**
 * Wrap a workflow page with this guard.
 * If no patient is selected, shows a prompt to go pick one.
 * If a patient IS selected, renders children normally.
 */
export default function PatientRequiredGuard({ children }: { children: React.ReactNode }) {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

  if (selectedPatient) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <WorkflowNav />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 shadow-sm">
          <Lock className="w-9 h-9 text-amber-600" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
          Patient Selection Required
        </h2>
        <p className="text-sm text-slate-500 text-center max-w-md mb-8 leading-relaxed">
          You need to select a patient before accessing this workflow step.
          All AI processes and data will be linked to the selected patient.
        </p>

        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-blue-700 shadow-lg shadow-primary-500/25 transition-all"
        >
          <UserCheck className="w-4.5 h-4.5" />
          Go to Patient Selection
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
