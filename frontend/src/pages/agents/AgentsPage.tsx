import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Badge, EmptyState, Skeleton, PageHeader } from '../../components/ui/Cards';
import {
  Sparkles,
  Play,
  RotateCw,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  Activity,
  FileText,
  Brain,
  BookOpen,
  ClipboardList,
  Languages,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import WorkflowNav from '../../components/ui/WorkflowNav';
import { cn } from '../../lib/utils';

interface AgentInfo {
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
}

interface PipelineRun {
  pipelineId: string;
  patientId: string;
  status: string;
  stepsCompleted: number;
  totalSteps: number;
  errors: number;
  startedAt: string;
  completedAt?: string;
}

interface PipelineResult {
  pipelineId: string;
  status: string;
  steps: Array<{
    step: string;
    success: boolean;
    agentName: string;
    output?: string;
    toolCallCount: number;
    tokensUsed: number;
    durationMs: number;
    error?: string;
  }>;
  totalDurationMs: number | null;
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

const agentIcons: Record<string, React.ElementType> = {
  'clinical-documentation': FileText,
  'medical-translator': Languages,
  'predictive-analytics': Brain,
  'research-synthesis': BookOpen,
  'workflow-automation': ClipboardList,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [pipelineOrder, setPipelineOrder] = useState<string[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'pipelines' | 'run'>('agents');

  // Run pipeline form
  const [pipelineForm, setPipelineForm] = useState({ patientId: '', transcript: '' });
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  // Run single agent form
  const [singleAgentForm, setSingleAgentForm] = useState({ agentName: '', patientId: '', transcript: '' });
  const [runningSingle, setRunningSingle] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [singleResult, setSingleResult] = useState<any>(null);

  // Expanded pipeline
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pipelineDetail, setPipelineDetail] = useState<Record<string, any>>({});

  const fetchAgentInfo = useCallback(async () => {
    try {
      const { data } = await api.get('/agents/info');
      setAgents(data.data.agents || []);
      setPipelineOrder(data.data.pipeline?.order || []);
    } catch { console.error('Failed to fetch agent info'); }
  }, []);

  const fetchPipelines = useCallback(async () => {
    try {
      const { data } = await api.get('/agents/pipelines');
      setPipelines(data.data || []);
    } catch { console.error('Failed to fetch pipelines'); }
  }, []);

  useEffect(() => {
    Promise.all([fetchAgentInfo(), fetchPipelines()]).finally(() => setLoading(false));
  }, [fetchAgentInfo, fetchPipelines]);

  const runPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineForm.patientId || !pipelineForm.transcript) { toast.error('Patient ID and transcript are required'); return; }
    setRunningPipeline(true);
    setPipelineResult(null);
    try {
      const { data } = await api.post('/agents/pipeline/run', pipelineForm);
      setPipelineResult(data.data);
      toast.success(`Pipeline ${data.data.status === 'completed' ? 'completed' : 'finished with errors'}`);
      fetchPipelines();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Pipeline execution failed');
    } finally { setRunningPipeline(false); }
  };

  const runSingleAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleAgentForm.agentName || !singleAgentForm.patientId) { toast.error('Select an agent and provide a patient ID'); return; }
    setRunningSingle(true);
    setSingleResult(null);
    try {
      const { data } = await api.post(`/agents/run/${singleAgentForm.agentName}`, {
        patientId: singleAgentForm.patientId,
        transcript: singleAgentForm.transcript,
      });
      setSingleResult(data.data);
      toast.success(`Agent ${data.data.agentName} finished`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Agent execution failed');
    } finally { setRunningSingle(false); }
  };

  const viewPipelineStatus = async (pipelineId: string) => {
    if (expandedPipelineId === pipelineId) { setExpandedPipelineId(null); return; }
    setExpandedPipelineId(pipelineId);
    if (pipelineDetail[pipelineId]) return;
    try {
      const { data } = await api.get(`/agents/pipeline/status/${pipelineId}`);
      setPipelineDetail((prev) => ({ ...prev, [pipelineId]: data.data }));
    } catch { toast.error('Failed to fetch pipeline status'); }
  };

  if (loading) return (
    <div className="space-y-6">
      <WorkflowNav />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader icon={Sparkles} title="AI Agent Pipeline" description="Run the multi-agent pipeline or individual AI agents" badge="5 Agents" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {([
            { id: 'agents' as const, label: 'Agent Catalog', icon: Cpu },
            { id: 'run' as const, label: 'Run Pipeline', icon: Play },
            { id: 'pipelines' as const, label: 'Pipeline History', icon: Clock },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 py-3.5 text-sm font-medium transition-all', activeTab === tab.id ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              <tab.icon className="w-4 h-4 inline mr-1.5" />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">

            {/* ── Agent Catalog Tab ── */}
            {activeTab === 'agents' && (
              <motion.div key="agents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="mb-4">
                  <p className="text-xs text-slate-500">Pipeline order: <span className="font-semibold text-slate-700">{pipelineOrder.join(' → ')}</span></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent, idx) => {
                    const Icon = agentIcons[agent.name] || Sparkles;
                    return (
                      <motion.div key={agent.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }} className="p-5 rounded-xl border border-slate-200/80 hover:border-primary-200 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center group-hover:from-primary-200 group-hover:to-blue-200 transition-all">
                            <Icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{agent.displayName}</p>
                            <Badge variant="purple">{agent.name}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">{agent.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.capabilities.map((cap, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 rounded-lg border border-slate-100 font-medium">{cap}</span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Run Pipeline Tab ── */}
            {activeTab === 'run' && (
              <motion.div key="run" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                {/* Full Pipeline */}
                <div className="p-5 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Run Full Pipeline</p>
                      <p className="text-xs text-slate-500">Execute all 5 agents sequentially</p>
                    </div>
                  </div>
                  <form onSubmit={runPipeline} className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Patient ID *</label>
                      <input type="text" value={pipelineForm.patientId} onChange={(e) => setPipelineForm({ ...pipelineForm, patientId: e.target.value })} className={inputClass} placeholder="Enter patient ID" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Clinical Transcript *</label>
                      <textarea value={pipelineForm.transcript} onChange={(e) => setPipelineForm({ ...pipelineForm, transcript: e.target.value })} className={inputClass} rows={4} placeholder="Paste the patient visit transcript..." />
                    </div>
                    <button type="submit" disabled={runningPipeline} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-sm shadow-primary-500/20">
                      {runningPipeline ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running Pipeline...</> : <><Play className="w-4 h-4" />Run Pipeline</>}
                    </button>
                  </form>
                </div>

                {/* Pipeline Result */}
                {pipelineResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      {pipelineResult.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      <p className="text-sm font-bold text-slate-800">Pipeline {pipelineResult.status}</p>
                      <Badge variant={pipelineResult.status === 'completed' ? 'success' : 'danger'}>{pipelineResult.pipelineId}</Badge>
                      {pipelineResult.totalDurationMs && <span className="text-xs text-slate-400">{(pipelineResult.totalDurationMs / 1000).toFixed(1)}s</span>}
                    </div>
                    <div className="space-y-2">
                      {pipelineResult.steps?.map((step, i) => (
                        <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl', step.success ? 'bg-emerald-50/50' : 'bg-red-50/50')}>
                          {step.success ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm font-medium text-slate-700 flex-1">{step.agentName || step.step}</span>
                          <span className="text-xs text-slate-400">{step.toolCallCount} tools · {step.tokensUsed} tokens · {(step.durationMs / 1000).toFixed(1)}s</span>
                          {step.error && <span className="text-xs text-red-500 truncate max-w-[200px]">{step.error}</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Single Agent */}
                <div className="p-5 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Run Single Agent</p>
                      <p className="text-xs text-slate-500">Test an individual agent</p>
                    </div>
                  </div>
                  <form onSubmit={runSingleAgent} className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Agent *</label>
                      <select value={singleAgentForm.agentName} onChange={(e) => setSingleAgentForm({ ...singleAgentForm, agentName: e.target.value })} className={inputClass}>
                        <option value="">Select an agent...</option>
                        {agents.map((a) => <option key={a.name} value={a.name}>{a.displayName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Patient ID *</label>
                      <input type="text" value={singleAgentForm.patientId} onChange={(e) => setSingleAgentForm({ ...singleAgentForm, patientId: e.target.value })} className={inputClass} placeholder="Enter patient ID" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Transcript (optional for some agents)</label>
                      <textarea value={singleAgentForm.transcript} onChange={(e) => setSingleAgentForm({ ...singleAgentForm, transcript: e.target.value })} className={inputClass} rows={3} placeholder="Provide context..." />
                    </div>
                    <button type="submit" disabled={runningSingle} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all">
                      {runningSingle ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running...</> : <><Cpu className="w-4 h-4" />Run Agent</>}
                    </button>
                  </form>
                </div>

                {/* Single Agent Result */}
                {singleResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      {singleResult.error ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      <p className="text-sm font-bold text-slate-800">{singleResult.agentName}</p>
                      <span className="text-xs text-slate-400">{singleResult.tokensUsed} tokens · {(singleResult.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                    {singleResult.output && (
                      <div className="p-3 rounded-xl bg-slate-50 mb-3">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Output</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{typeof singleResult.output === 'string' ? singleResult.output : JSON.stringify(singleResult.output, null, 2)}</p>
                      </div>
                    )}
                    {singleResult.toolCalls?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tool Calls</p>
                        <div className="space-y-1">
                          {singleResult.toolCalls.map((tc: { tool: string; success: boolean; durationMs: number; error?: string }, i: number) => (
                            <div key={i} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs', tc.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                              {tc.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span className="font-medium">{tc.tool}</span>
                              <span className="text-slate-400 ml-auto">{(tc.durationMs / 1000).toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Pipeline History Tab ── */}
            {activeTab === 'pipelines' && (
              <motion.div key="pipelines" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">{pipelines.length} pipeline run{pipelines.length !== 1 ? 's' : ''}</p>
                  <button onClick={fetchPipelines} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><RotateCw className="w-3.5 h-3.5" />Refresh</button>
                </div>
                {pipelines.length > 0 ? (
                  <div className="space-y-3">
                    {pipelines.map((p, idx) => (
                      <motion.div key={p.pipelineId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => viewPipelineStatus(p.pipelineId)}>
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', p.status === 'completed' ? 'bg-gradient-to-br from-emerald-100 to-green-100' : p.status === 'failed' ? 'bg-gradient-to-br from-red-100 to-rose-100' : 'bg-gradient-to-br from-amber-100 to-yellow-100')}>
                            {p.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : p.status === 'failed' ? <XCircle className="w-5 h-5 text-red-500" /> : <Activity className="w-5 h-5 text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{p.pipelineId}</p>
                            <p className="text-xs text-slate-500">Patient: {p.patientId?.slice?.(-8) || p.patientId} · {p.stepsCompleted}/{p.totalSteps} steps</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>{p.status}</Badge>
                            {p.errors > 0 && <Badge dot variant="danger">{p.errors} error{p.errors > 1 ? 's' : ''}</Badge>}
                            <span className="text-xs text-slate-400">{p.startedAt ? new Date(p.startedAt).toLocaleString() : ''}</span>
                            {expandedPipelineId === p.pipelineId ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedPipelineId === p.pipelineId && pipelineDetail[p.pipelineId] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="border-t border-slate-100 p-5 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="p-3 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500">Status</p>
                                    <p className="text-sm font-bold text-slate-800 capitalize">{pipelineDetail[p.pipelineId].status}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500">Current Step</p>
                                    <p className="text-sm font-bold text-slate-800">{pipelineDetail[p.pipelineId].currentStep || 'Done'}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500">Steps Done</p>
                                    <p className="text-sm font-bold text-slate-800">{pipelineDetail[p.pipelineId].completedSteps?.join(', ') || 'None'}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500">Artifacts</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {pipelineDetail[p.pipelineId].artifacts?.clinicalNoteId && <Badge variant="info">Note</Badge>}
                                      {pipelineDetail[p.pipelineId].artifacts?.hasTranslation && <Badge variant="info">Translation</Badge>}
                                      {pipelineDetail[p.pipelineId].artifacts?.riskAssessmentId && <Badge variant="warning">Risk</Badge>}
                                      {pipelineDetail[p.pipelineId].artifacts?.hasResearch && <Badge variant="purple">Research</Badge>}
                                      {pipelineDetail[p.pipelineId].artifacts?.appointmentCount > 0 && <Badge variant="success">{pipelineDetail[p.pipelineId].artifacts.appointmentCount} Appt</Badge>}
                                    </div>
                                  </div>
                                </div>
                                {pipelineDetail[p.pipelineId].errors?.length > 0 && (
                                  <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                                    <p className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Errors</p>
                                    {pipelineDetail[p.pipelineId].errors.map((e: string, i: number) => (
                                      <p key={i} className="text-xs text-red-700">{e}</p>
                                    ))}
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
                  <EmptyState icon={Activity} title="No pipeline runs" description="Run the agent pipeline to see history here." />
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
