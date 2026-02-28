import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Badge, EmptyState, Skeleton, PageHeader } from '../../components/ui/Cards';
import {
  CalendarDays,
  Shield,
  FlaskConical,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import WorkflowNav from '../../components/ui/WorkflowNav';
import { cn } from '../../lib/utils';

interface Appointment {
  _id: string;
  patientId: { _id: string; userId: { name: string } } | string;
  doctorId: { _id: string; name: string; specialization?: string } | string;
  scheduledDate: string;
  duration: number;
  type: string;
  status: string;
  reason: string;
  notes?: string;
  location?: string;
}

interface InsuranceClaim {
  _id: string;
  patientId: { _id: string; userId: { name: string } } | string;
  claimNumber: string;
  insuranceProvider: string;
  policyNumber: string;
  totalAmount: number;
  status: string;
  diagnosisCodes: Array<{ code: string; description: string }> | string[];
  procedureCodes: Array<{ code: string; description: string }> | string[];
  submittedDate?: string;
  denialReason?: string;
}

interface LabResult {
  _id: string;
  patientId: { _id: string; userId: { name: string } } | string;
  orderedBy: string;
  testName: string;
  category: string;
  results: Array<{ parameter: string; value: number | string; unit: string; referenceRange: string; status: 'normal' | 'abnormal' | 'critical' }>;
  status: string;
  collectedDate?: string;
  completedDate?: string;
  reviewedBy?: string;
  notes?: string;
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'claims' | 'labs'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchAppointments(); fetchClaims(); fetchLabs(); }, []);

  const fetchAppointments = async () => {
    try { const { data } = await api.get('/workflow/appointments'); setAppointments(data.data || []); } catch { console.error('Failed to fetch appointments'); } finally { setLoading(false); }
  };
  const fetchClaims = async () => {
    try { const { data } = await api.get('/workflow/claims'); setClaims(data.data || []); } catch { console.error('Failed to fetch claims'); }
  };
  const fetchLabs = async () => {
    try { const { data } = await api.get('/workflow/labs'); setLabs(data.data || []); } catch { console.error('Failed to fetch labs'); }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try { await api.put(`/workflow/appointments/${id}`, { status }); toast.success(`Appointment ${status}`); fetchAppointments(); } catch { toast.error('Failed to update appointment'); }
  };

  const reviewLabResult = async (id: string) => {
    try { await api.put(`/workflow/labs/${id}`); toast.success('Lab result reviewed'); fetchLabs(); } catch { toast.error('Failed to review lab result'); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': case 'reviewed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': case 'denied': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': case 'submitted': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
      completed: 'success', approved: 'success', reviewed: 'success',
      cancelled: 'danger', denied: 'danger',
      pending: 'warning', submitted: 'warning', 'in_review': 'info',
      scheduled: 'info', confirmed: 'info',
    };
    return <Badge dot variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const tabs = [
    { key: 'appointments' as const, label: 'Appointments', icon: CalendarDays, count: appointments.length },
    { key: 'claims' as const, label: 'Insurance Claims', icon: Shield, count: claims.length },
    { key: 'labs' as const, label: 'Lab Results', icon: FlaskConical, count: labs.length },
  ];

  if (loading) return (
    <div className="space-y-6">
      <WorkflowNav />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader icon={CalendarDays} title="Workflow Automator" description="Manage appointments, insurance claims, and lab results" badge="AI Agent" />
      </motion.div>

      {/* Tabs + Content */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('flex-1 py-3.5 text-sm font-medium transition-all flex items-center justify-center gap-2', activeTab === tab.key ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="ml-1 text-xs bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* Appointments */}
            {activeTab === 'appointments' && (
              <motion.div key="appointments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowNewAppointment(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm shadow-primary-500/20">
                    <Plus className="w-4 h-4" />New Appointment
                  </button>
                </div>
                {appointments.length > 0 ? (
                  appointments.map((appt, idx) => (
                    <motion.div key={appt._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statusIcon(appt.status)}
                            <span className="text-sm font-semibold text-slate-800">{appt.reason}</span>
                            {statusBadge(appt.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(appt.scheduledDate).toLocaleDateString()} at {new Date(appt.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.duration} min</span>
                            <Badge variant="info">{appt.type}</Badge>
                            {appt.location && <span>{appt.location}</span>}
                          </div>
                        </div>
                        {appt.status === 'scheduled' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateAppointmentStatus(appt._id, 'confirmed')} className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 border border-green-200 transition-all">Confirm</button>
                            <button onClick={() => updateAppointmentStatus(appt._id, 'cancelled')} className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 rounded-xl hover:from-red-100 hover:to-rose-100 border border-red-200 transition-all">Cancel</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState icon={CalendarDays} title="No appointments" description="Schedule a new appointment to get started." />
                )}
              </motion.div>
            )}

            {/* Insurance Claims */}
            {activeTab === 'claims' && (
              <motion.div key="claims" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                {claims.length > 0 ? (
                  claims.map((claim, idx) => (
                    <motion.div key={claim._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-primary-600" /></div>
                              <span className="text-sm font-semibold text-slate-800">Claim #{claim.claimNumber}</span>
                              {statusBadge(claim.status)}
                            </div>
                            <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-slate-500">
                              <span>{claim.insuranceProvider}</span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700"><DollarSign className="w-3 h-3" />${claim.totalAmount?.toLocaleString()}</span>
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : 'Not submitted'}</span>
                            </div>
                          </div>
                          <button onClick={() => setExpandedId(expandedId === claim._id ? null : claim._id)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            {expandedId === claim._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedId === claim._id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Diagnosis Codes</p>
                                  <div className="flex flex-wrap gap-1">{claim.diagnosisCodes?.map((dc, i) => <Badge key={i} variant="info">{typeof dc === 'string' ? dc : dc.code}</Badge>)}</div>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Procedure Codes</p>
                                  <div className="flex flex-wrap gap-1">{claim.procedureCodes?.map((pc, i) => <Badge key={i} variant="purple">{typeof pc === 'string' ? pc : pc.code}</Badge>)}</div>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Submitted</p>
                                  <p className="text-slate-700">{claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                {claim.denialReason && (
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Denial Reason</p>
                                    <p className="text-sm text-red-700">{claim.denialReason}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState icon={Shield} title="No insurance claims" description="Claims will appear here when submitted." />
                )}
              </motion.div>
            )}

            {/* Lab Results */}
            {activeTab === 'labs' && (
              <motion.div key="labs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                {labs.length > 0 ? (
                  labs.map((lab, idx) => {
                    const hasAbnormal = lab.results?.some((r) => r.status === 'abnormal' || r.status === 'critical');
                    return (
                      <motion.div key={lab._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', hasAbnormal ? 'bg-gradient-to-br from-red-100 to-rose-100' : 'bg-gradient-to-br from-emerald-100 to-green-100')}>
                                <FlaskConical className={cn('w-3.5 h-3.5', hasAbnormal ? 'text-red-600' : 'text-emerald-600')} />
                              </div>
                              <span className="text-sm font-semibold text-slate-800">{lab.testName}</span>
                              {hasAbnormal && <Badge variant="danger" dot>Abnormal</Badge>}
                              {statusBadge(lab.status)}
                            </div>
                            <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-slate-500">
                              <Badge variant="default">{lab.category}</Badge>
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(lab.completedDate || lab.collectedDate || '').toLocaleDateString()}</span>
                            </div>
                            {lab.results && lab.results.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {lab.results.map((r, ridx) => (
                                  <div key={ridx} className="flex items-center gap-3 text-sm">
                                    <span className="text-slate-600 font-medium">{r.parameter}:</span>
                                    <span className={cn('font-bold', r.status === 'abnormal' || r.status === 'critical' ? 'text-red-600' : 'text-slate-800')}>{r.value} {r.unit}</span>
                                    <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">Ref: {r.referenceRange}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {lab.notes && <p className="mt-2 text-xs text-slate-500 italic">{lab.notes}</p>}
                          </div>
                          {lab.status === 'completed' && (
                            <button onClick={() => reviewLabResult(lab._id)} className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 rounded-xl hover:from-primary-100 hover:to-blue-100 border border-primary-200 transition-all">Mark Reviewed</button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <EmptyState icon={FlaskConical} title="No lab results" description="Lab results will appear here when available." />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppointment && (
          <NewAppointmentModal onClose={() => setShowNewAppointment(false)} onCreated={() => { setShowNewAppointment(false); fetchAppointments(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewAppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ patientId: '', scheduledDate: '', duration: 30, type: 'consultation', reason: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.scheduledDate || !form.reason) { toast.error('Please fill all required fields'); return; }
    setSubmitting(true);
    try { await api.post('/workflow/appointments', form); toast.success('Appointment scheduled'); onCreated(); } catch (err: unknown) { const error = err as { response?: { data?: { message?: string } } }; toast.error(error.response?.data?.message || 'Failed to create appointment'); } finally { setSubmitting(false); }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Schedule Appointment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient ID *</label>
            <input type="text" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className={inputClass} placeholder="Enter patient ID" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time *</label>
              <input type="datetime-local" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (min)</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} className={inputClass}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow Up</option>
              <option value="procedure">Procedure</option>
              <option value="emergency">Emergency</option>
              <option value="telemedicine">Telemedicine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason *</label>
            <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} placeholder="Reason for appointment" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="e.g., Room 201" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 shadow-sm shadow-primary-500/20">{submitting ? 'Scheduling...' : 'Schedule'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
