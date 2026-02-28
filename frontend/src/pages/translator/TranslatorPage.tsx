import { useState } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Cards';
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

type TabType = 'translate' | 'ask' | 'medications';

export default function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('translate');
  const [loading, setLoading] = useState(false);

  // Translate state
  const [clinicalNoteId, setClinicalNoteId] = useState('');
  const [language, setLanguage] = useState('simple_english');
  const [translationResult, setTranslationResult] = useState<any>(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [medicalContext, setMedicalContext] = useState('');
  const [qaResult, setQaResult] = useState<any>(null);

  // Medication state
  const [medicationName, setMedicationName] = useState('');
  const [medResult, setMedResult] = useState<any>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/translator/translate', {
        clinicalNoteId,
        targetLanguage: language,
      });
      setTranslationResult(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Translation failed');
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process question');
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to get medication info');
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
    <div className="space-y-6 animate-fade-in">
      <WorkflowNav />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Languages className="w-7 h-7 text-primary-500" />
          Patient Translator
        </h1>
        <p className="text-slate-500 mt-1">
          Translate medical reports and terminology into patient-friendly language
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Translate Tab */}
          {activeTab === 'translate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <form onSubmit={handleTranslate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Note ID</label>
                    <input
                      type="text"
                      value={clinicalNoteId}
                      onChange={(e) => setClinicalNoteId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter clinical note ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Language / Level</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="simple_english">Simple English</option>
                      <option value="detailed">Detailed Explanation</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Translate Report
                      </>
                    )}
                  </button>
                </form>
              </div>
              <div>
                {translationResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-accent-50 border border-accent-200">
                      <p className="text-xs font-semibold text-accent-700 uppercase mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Patient-Friendly Report
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{translationResult.translatedReport}</p>
                    </div>
                    {translationResult.riskWarnings?.length > 0 && (
                      <div className="p-4 rounded-xl bg-warning-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Important Warnings
                        </p>
                        <ul className="space-y-1">
                          {translationResult.riskWarnings.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {translationResult.lifestyleRecommendations?.length > 0 && (
                      <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                        <p className="text-xs font-semibold text-primary-700 uppercase mb-2">Lifestyle Recommendations</p>
                        <ul className="space-y-1">
                          {translationResult.lifestyleRecommendations.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-primary-500 mt-1">•</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div>
                      <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Translated report will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Q&A Tab */}
          {activeTab === 'ask' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="e.g., What does hypertension mean?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical Context (optional)</label>
                  <textarea
                    value={medicalContext}
                    onChange={(e) => setMedicalContext(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Additional context from your report..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                    <>
                      <Send className="w-4 h-4" />
                      Ask Question
                    </>
                  )}
                </button>
              </form>
              <div>
                {qaResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Answer</p>
                      <p className="text-sm text-slate-700">{qaResult.answer}</p>
                    </div>
                    {qaResult.relatedTerms?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Related Terms</p>
                        <div className="flex flex-wrap gap-2">
                          {qaResult.relatedTerms.map((t: string, i: number) => (
                            <Badge key={i} variant="info">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div>
                      <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Answers will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medication Tab */}
          {activeTab === 'medications' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleMedication} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Medication Name</label>
                  <input
                    type="text"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Metformin, Lisinopril..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                    <>
                      <Pill className="w-4 h-4" />
                      Get Medication Info
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400">
                  Get easy-to-understand information about your medications
                </p>
              </form>
              <div>
                {medResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-lg font-semibold text-slate-800 mb-1">{medResult.medication}</p>
                      <p className="text-sm text-slate-600">{medResult.purpose}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-2">How to Take</p>
                      <p className="text-sm text-slate-700">{medResult.instructions}</p>
                    </div>
                    {medResult.sideEffects?.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Possible Side Effects</p>
                        <ul className="space-y-1">
                          {medResult.sideEffects.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {medResult.warnings?.length > 0 && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Warnings
                        </p>
                        <ul className="space-y-1">
                          {medResult.warnings.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div>
                      <Pill className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Medication information will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
