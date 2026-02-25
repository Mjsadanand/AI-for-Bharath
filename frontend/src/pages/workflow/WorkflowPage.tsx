import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, Badge, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import {
  CalendarDays,
  Shield,
  FlaskConical,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  _id: string;
  patientId: { _id: string; userId: { firstName: string; lastName: string } } | string;
  doctorId: { _id: string; firstName: string; lastName: string } | string;
  dateTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string;
  notes?: string;
  location?: string;
}

interface InsuranceClaim {
  _id: string;
  patientId: { _id: string; userId: { firstName: string; lastName: string } } | string;
  claimNumber: string;
  insuranceProvider: string;
  claimType: string;
  amount: number;
  status: string;
  diagnosisCodes: string[];
  procedureCodes: string[];
  serviceDate: string;
  submissionDate: string;
  denialReason?: string;
}

interface LabResult {
  _id: string;
  patientId: { _id: string; userId: { firstName: string; lastName: string } } | string;
  testName: string;
  testCode: string;
  category: string;
  value: number;
  unit: string;
  referenceRange: { min: number; max: number };
  status: string;
  isAbnormal: boolean;
  collectionDate: string;
  resultDate: string;
  notes?: string;
}

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'claims' | 'labs'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchClaims();
    fetchLabs();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/workflow/appointments');
      setAppointments(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const { data } = await api.get('/workflow/insurance-claims');
      setClaims(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLabs = async () => {
    try {
      const { data } = await api.get('/workflow/lab-results');
      setLabs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await api.put(`/workflow/appointments/${id}`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update appointment');
    }
  };

  const reviewLabResult = async (id: string) => {
    try {
      await api.put(`/workflow/lab-results/${id}/review`);
      toast.success('Lab result reviewed');
      fetchLabs();
    } catch (err) {
      toast.error('Failed to review lab result');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'reviewed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
      completed: 'success', approved: 'success', reviewed: 'success',
      cancelled: 'danger', denied: 'danger',
      pending: 'warning', submitted: 'warning', 'in_review': 'info',
      scheduled: 'info', confirmed: 'info',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const tabs = [
    { key: 'appointments' as const, label: 'Appointments', icon: CalendarDays, count: appointments.length },
    { key: 'claims' as const, label: 'Insurance Claims', icon: Shield, count: claims.length },
    { key: 'labs' as const, label: 'Lab Results', icon: FlaskConical, count: labs.length },
  ];

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary-500" />
            Workflow Automator
          </h1>
          <p className="text-slate-500 mt-1">Manage appointments, insurance claims, and lab results</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="ml-1 text-xs bg-slate-100 rounded-full px-2 py-0.5">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewAppointment(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Appointment
                </button>
              </div>
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <div key={appt._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon(appt.status)}
                          <span className="text-sm font-semibold text-slate-800">{appt.reason}</span>
                          {statusBadge(appt.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(appt.dateTime).toLocaleDateString()} at {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appt.duration} min
                          </span>
                          <Badge variant="info">{appt.type}</Badge>
                          {appt.location && <span>{appt.location}</span>}
                        </div>
                      </div>
                      {appt.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateAppointmentStatus(appt._id, 'confirmed')}
                            className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appt._id, 'cancelled')}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={CalendarDays} title="No appointments" description="Schedule a new appointment to get started." />
              )}
            </div>
          )}

          {/* Insurance Claims Tab */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <div key={claim._id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-semibold text-slate-800">Claim #{claim.claimNumber}</span>
                            {statusBadge(claim.status)}
                          </div>
                          <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            <span>{claim.insuranceProvider}</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${claim.amount?.toLocaleString()}
                            </span>
                            <Badge variant="default">{claim.claimType?.replace('_', ' ')}</Badge>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(claim.serviceDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(expandedId === claim._id ? null : claim._id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {expandedId === claim._id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {expandedId === claim._id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Diagnosis Codes</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {claim.diagnosisCodes?.map((code, i) => (
                                  <Badge key={i} variant="info">{code}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Procedure Codes</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {claim.procedureCodes?.map((code, i) => (
                                  <Badge key={i} variant="purple">{code}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Submitted</p>
                              <p className="text-slate-700">{new Date(claim.submissionDate).toLocaleDateString()}</p>
                            </div>
                            {claim.denialReason && (
                              <div>
                                <p className="text-xs font-semibold text-red-500 uppercase">Denial Reason</p>
                                <p className="text-red-700">{claim.denialReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Shield} title="No insurance claims" description="Claims will appear here when submitted." />
              )}
            </div>
          )}

          {/* Lab Results Tab */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              {labs.length > 0 ? (
                labs.map((lab) => (
                  <div key={lab._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FlaskConical className={`w-4 h-4 ${lab.isAbnormal ? 'text-red-500' : 'text-green-500'}`} />
                          <span className="text-sm font-semibold text-slate-800">{lab.testName}</span>
                          {lab.isAbnormal && <Badge variant="danger">Abnormal</Badge>}
                          {statusBadge(lab.status)}
                        </div>
                        <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-slate-500">
                          <span>Code: {lab.testCode}</span>
                          <Badge variant="default">{lab.category}</Badge>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(lab.resultDate || lab.collectionDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <span className={`text-lg font-bold ${lab.isAbnormal ? 'text-red-600' : 'text-slate-800'}`}>
                            {lab.value} {lab.unit}
                          </span>
                          <span className="text-xs text-slate-400">
                            Ref: {lab.referenceRange?.min} – {lab.referenceRange?.max} {lab.unit}
                          </span>
                        </div>
                        {lab.notes && (
                          <p className="mt-2 text-xs text-slate-500 italic">{lab.notes}</p>
                        )}
                      </div>
                      {lab.status === 'completed' && (
                        <button
                          onClick={() => reviewLabResult(lab._id)}
                          className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          Mark Reviewed
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={FlaskConical} title="No lab results" description="Lab results will appear here when available." />
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <NewAppointmentModal onClose={() => setShowNewAppointment(false)} onCreated={() => { setShowNewAppointment(false); fetchAppointments(); }} />
      )}
    </div>
  );
}

function NewAppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    patientId: '',
    dateTime: '',
    duration: 30,
    type: 'consultation',
    reason: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.dateTime || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/workflow/appointments', form);
      toast.success('Appointment scheduled');
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Schedule Appointment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID *</label>
            <input
              type="text"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter patient ID"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow Up</option>
              <option value="procedure">Procedure</option>
              <option value="emergency">Emergency</option>
              <option value="telemedicine">Telemedicine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Reason for appointment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Room 201"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
