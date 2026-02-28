import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Badge, PageHeader } from '../../components/ui/Cards';
import WorkflowNav from '../../components/ui/WorkflowNav';
import {
  Languages,
  Send,
  MessageSquare,
  FileText,
  Pill,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import type { TranslationResult, QAResult, MedicationInstruction } from '../../types';

type TabType = 'translate' | 'ask' | 'medications';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';
const btnClass = 'w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-sm shadow-primary-500/20';

export default function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('translate');
  const [loading, setLoading] = useState(false);

  // Translate state
  const [clinicalNoteId, setClinicalNoteId] = useState('');
  const [language, setLanguage] = useState('simple_english');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [medicalContext, setMedicalContext] = useState('');
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  // Medication state
  const [medicationName, setMedicationName] = useState('');
  const [medResult, setMedResult] = useState<MedicationInstruction | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/translator/translate', {
        clinicalNoteId,
        targetLanguage: language,
      });
      setTranslationResult(data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/translator/ask', {
        question,
        medicalContext,
      });
      setQaResult(data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to process question');
    } finally {
      setLoading(false);
    }
  };

  const handleMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/translator/medication-instructions', {
        medicationName,
      });
      setMedResult(data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to get medication info');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'translate' as TabType, label: 'Report Translation', icon: Languages },
    { id: 'ask' as TabType, label: 'Ask a Question', icon: HelpCircle },
    { id: 'medications' as TabType, label: 'Medication Guide', icon: Pill },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Languages}
          title="Patient Translator"
          description="Translate medical reports and terminology into patient-friendly language"
          badge="AI Agent"
        />
      </motion.div>

      {/* Tabs + Content */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Translate Tab */}
            {activeTab === 'translate' && (
              <motion.div key="translate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <form onSubmit={handleTranslate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Clinical Note ID</label>
                      <input type="text" value={clinicalNoteId} onChange={(e) => setClinicalNoteId(e.target.value)} className={inputClass} placeholder="Enter clinical note ID" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Language / Level</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                        <option value="simple_english">Simple English</option>
                        <option value="detailed">Detailed Explanation</option>
                      </select>
                    </div>
                    <button type="submit" disabled={loading} className={btnClass}>
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                        <><Sparkles className="w-4 h-4" />Translate Report</>
                      )}
                    </button>
                  </form>
                </div>
                <div>
                  {translationResult ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />Patient-Friendly Report
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{translationResult.simplifiedText}</p>
                      </div>
                      {translationResult.riskWarnings?.length > 0 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />Important Warnings
                          </p>
                          <ul className="space-y-1.5">
                            {translationResult.riskWarnings.map((w: string, i: number) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-amber-500 mt-1">•</span>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {translationResult.lifestyleRecommendations?.length > 0 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-primary-50 border border-primary-200">
                          <p className="text-xs font-bold text-primary-700 uppercase mb-2">Lifestyle Recommendations</p>
                          <ul className="space-y-1.5">
                            {translationResult.lifestyleRecommendations.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-primary-500 mt-1">•</span>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">Translated report will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'ask' && (
              <motion.div key="ask" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleAskQuestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Question</label>
                    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} placeholder="e.g., What does hypertension mean?" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Medical Context (optional)</label>
                    <textarea value={medicalContext} onChange={(e) => setMedicalContext(e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Additional context from your report..." />
                  </div>
                  <button type="submit" disabled={loading} className={btnClass}>
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <><Send className="w-4 h-4" />Ask Question</>
                    )}
                  </button>
                </form>
                <div>
                  {qaResult ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                        <p className="text-xs font-bold text-blue-700 uppercase mb-2">Answer</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{qaResult.answer}</p>
                      </div>
                      {qaResult.relatedTopics?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Related Topics</p>
                          <div className="flex flex-wrap gap-2">
                            {qaResult.relatedTopics.map((t: string, i: number) => (
                              <Badge key={i} variant="info">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">Answers will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Medication Tab */}
            {activeTab === 'medications' && (
              <motion.div key="medications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleMedication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Medication Name</label>
                    <input type="text" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} className={inputClass} placeholder="e.g., Metformin, Lisinopril..." required />
                  </div>
                  <button type="submit" disabled={loading} className={btnClass}>
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <><Pill className="w-4 h-4" />Get Medication Info</>
                    )}
                  </button>
                  <p className="text-xs text-slate-400">Get easy-to-understand information about your medications</p>
                </form>
                <div>
                  {medResult ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                        <p className="text-lg font-bold text-slate-800 mb-1">{medResult.medication}</p>
                        <p className="text-sm text-slate-600">{medResult.simpleName}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                        <p className="text-xs font-bold text-blue-700 uppercase mb-2">How to Take</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{medResult.instructions}</p>
                      </div>
                      {medResult.sideEffects?.length > 0 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-2">Possible Side Effects</p>
                          <ul className="space-y-1.5">
                            {medResult.sideEffects.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-amber-500 mt-1">•</span>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {medResult.warnings?.length > 0 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                          <p className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />Warnings
                          </p>
                          <ul className="space-y-1.5">
                            {medResult.warnings.map((w: string, i: number) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-red-500 mt-1">•</span>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <Pill className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">Medication information will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
