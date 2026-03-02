import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Card, Badge, StatCard, EmptyState, PageHeader, Skeleton } from '../../components/ui/Cards';
import { cn } from '../../lib/utils';
import {
  Users,
  Search,
  ChevronRight,
  Heart,
  Activity,
  Pill,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  Thermometer,
  Weight,
  Wind,
  UserCircle,
  Shield,
  Plus,
  Pencil,
  FileText,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Patient, User, ClinicalNote } from '../../types';
import WorkflowNav from '../../components/ui/WorkflowNav';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const avatarGradients = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];

function getAvatarGradient(name: string) {
  const idx = (name || '?').charCodeAt(0) % avatarGradients.length;
  return avatarGradients[idx];
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients', { params: { page, limit: 20 } });
      setPatients(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      console.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/patients/${id}`);
      setSelectedPatient(data.data);
    } catch {
      toast.error('Failed to load patient details');
    }
  };

  const filtered = patients.filter((p) => {
    const user = typeof p.userId === 'object' ? (p.userId as User) : null;
    const name = (user?.name || '').toLowerCase();
    return name.includes(search.toLowerCase()) || p.bloodGroup?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (selectedPatient) {
    return <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader
          icon={Users}
          title="Patients"
          description="View and manage patient records"
          badge={`${patients.length} registered`}
        />
      </motion.div>

      {/* Create Patient Button */}
      <motion.div variants={fadeUp}>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 shadow-sm hover:shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" /> Create New Patient
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
          placeholder="Search by name or patient code (PT-0001)..."
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients.length} icon={Users} color="blue" />
        <StatCard
          title="With Allergies"
          value={patients.filter((p) => p.allergies && p.allergies.length > 0).length}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Chronic Conditions"
          value={patients.filter((p) => p.chronicConditions && p.chronicConditions.length > 0).length}
          icon={Heart}
          color="orange"
        />
        <StatCard
          title="On Medication"
          value={patients.filter((p) => p.medications && p.medications.length > 0).length}
          icon={Pill}
          color="green"
        />
      </motion.div>

      {/* Patient List */}
      <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((patient, idx) => {
              const user = typeof patient.userId === 'object' ? (patient.userId as User) : null;
              const name = user?.name || 'Unknown';
              return (
                <motion.button
                  key={patient._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => fetchPatientDetail(patient._id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm shadow-sm',
                      getAvatarGradient(name)
                    )}>
                      {name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{name}</p>
                        {patient.patientCode && (
                          <span className="font-mono text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md font-bold select-all" title="Patient Code">
                            {patient.patientCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        {patient.dateOfBirth && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </span>
                        )}
                        {patient.gender && <span className="capitalize">{patient.gender}</span>}
                        {patient.bloodGroup && <Badge variant="info">{patient.bloodGroup}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.allergies && patient.allergies.length > 0 && (
                      <Badge variant="danger" dot>{patient.allergies.length} allergies</Badge>
                    )}
                    {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                      <Badge variant="warning" dot>{patient.chronicConditions.length} conditions</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Users} title="No patients found" description="Patients will appear here once registered." />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-200/80 bg-slate-50/50">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-500">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Create Patient Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePatientModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchPatients(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PatientDetail({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const user = typeof patient.userId === 'object' ? (patient.userId as User) : null;
  const name = user?.name || 'Unknown';
  const latestVitals = patient.vitalSigns?.[patient.vitalSigns.length - 1];
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [patientNotes, setPatientNotes] = useState<ClinicalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(patient);
  const [latestRisk, setLatestRisk] = useState<{ overallRisk?: string; confidence?: number; riskScores?: Array<{ category: string; score: number; level: string }>; predictions?: Array<{ condition: string; probability: number; timeframe: string }> } | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);

  useEffect(() => {
    fetchPatientNotes();
    fetchLatestRisk();
  }, []);

  const fetchPatientNotes = async () => {
    try {
      const { data } = await api.get(`/clinical-docs/patient/${patient._id}`);
      setPatientNotes(data.data || []);
    } catch { console.error('Failed to fetch patient notes'); }
    finally { setNotesLoading(false); }
  };

  const fetchLatestRisk = async () => {
    try {
      const { data } = await api.get(`/predictive/latest/${patient._id}`);
      setLatestRisk(data.data || null);
    } catch { /* patient may not have a risk assessment yet */ }
    finally { setRiskLoading(false); }
  };

  const refreshPatient = async () => {
    try {
      const { data } = await api.get(`/patients/${patient._id}`);
      setCurrentPatient(data.data);
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="group flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to patients
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl shadow-lg',
              getAvatarGradient(name)
            )}>
              {name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
                {currentPatient.patientCode && (
                  <span className="font-mono text-sm bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg font-bold select-all" title="Patient Code — use this for clinical notes">
                    {currentPatient.patientCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {currentPatient.dateOfBirth && <span>{new Date(currentPatient.dateOfBirth).toLocaleDateString()}</span>}
                {currentPatient.gender && <span className="capitalize">{currentPatient.gender}</span>}
                {currentPatient.bloodGroup && <Badge variant="info">{currentPatient.bloodGroup}</Badge>}
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowEditModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-all">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setShowVitalsModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-cyan-100 text-blue-700 transition-all">
              <Plus className="w-3.5 h-3.5" /> Vitals
            </button>
            <button onClick={() => setShowMedModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-green-100 text-emerald-700 transition-all">
              <Plus className="w-3.5 h-3.5" /> Medication
            </button>
          </div>
        </div>
      </div>

      {/* Contact & Emergency */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card title="Contact" icon={UserCircle}>
          <div className="space-y-3 text-sm">
            {user?.email && (
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                {user.email}
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                {user.phone}
              </div>
            )}
          </div>
        </Card>
        {currentPatient.emergencyContact && (
          <Card title="Emergency Contact" icon={Shield}>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{currentPatient.emergencyContact.name}</p>
              <Badge variant="default">{currentPatient.emergencyContact.relation}</Badge>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-rose-500" />
                </div>
                {currentPatient.emergencyContact.phone}
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Latest Vitals */}
      {currentPatient.vitalSigns?.[currentPatient.vitalSigns.length - 1] && (
        (() => { const latestVitals = currentPatient.vitalSigns[currentPatient.vitalSigns.length - 1]; return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card title="Latest Vitals" subtitle={latestVitals.date ? new Date(latestVitals.date).toLocaleDateString() : ''} icon={Activity}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {latestVitals.bloodPressure && (
                <VitalItem icon={Activity} label="Blood Pressure" value={`${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic}`} unit="mmHg" color="blue" />
              )}
              {latestVitals.heartRate && (
                <VitalItem icon={Heart} label="Heart Rate" value={latestVitals.heartRate} unit="bpm" color="rose" />
              )}
              {latestVitals.temperature && (
                <VitalItem icon={Thermometer} label="Temperature" value={latestVitals.temperature} unit="°F" color="amber" />
              )}
              {latestVitals.weight && (
                <VitalItem icon={Weight} label="Weight" value={latestVitals.weight} unit="kg" color="emerald" />
              )}
              {latestVitals.oxygenSaturation && (
                <VitalItem icon={Wind} label="SpO2" value={latestVitals.oxygenSaturation} unit="%" color="cyan" />
              )}
              {latestVitals.height && (
                <VitalItem icon={Activity} label="Height" value={latestVitals.height} unit="cm" color="violet" />
              )}
            </div>
          </Card>
        </motion.div>
        )})()
      )}

      {/* Allergies & Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card title="Allergies" icon={AlertCircle}>
          {currentPatient.allergies && currentPatient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentPatient.allergies.map((a, i) => (
                <Badge key={i} variant="danger" dot>{a}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No known allergies</p>
          )}
        </Card>
        <Card title="Chronic Conditions" icon={Heart}>
          {currentPatient.chronicConditions && currentPatient.chronicConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentPatient.chronicConditions.map((c, i) => (
                <Badge key={i} variant="warning" dot>{c}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No chronic conditions</p>
          )}
        </Card>
      </motion.div>

      {/* Medications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card title="Current Medications" icon={Pill}>
          {currentPatient.medications && currentPatient.medications.length > 0 ? (
            <div className="space-y-2">
              {currentPatient.medications.map((med, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <Pill className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage} — {med.frequency}</p>
                    </div>
                  </div>
                  <Badge variant={med.endDate ? 'default' : 'success'} dot>{med.endDate ? 'completed' : 'active'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No medications recorded</p>
          )}
        </Card>
      </motion.div>

      {/* Medical History */}
      {currentPatient.medicalHistory && currentPatient.medicalHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card title="Medical History" icon={Calendar}>
            <div className="space-y-2">
              {currentPatient.medicalHistory.map((entry, i) => (
                <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800">{entry.condition}</p>
                    <span className="text-xs text-slate-400 font-medium">
                      {entry.diagnosedDate ? new Date(entry.diagnosedDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {entry.notes && <p className="text-xs text-slate-500 mb-2">{entry.notes}</p>}
                  <Badge variant={entry.status === 'resolved' ? 'success' : entry.status === 'active' ? 'warning' : 'default'} dot>
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Patient Clinical Notes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card title="Clinical Notes" icon={FileText}>
          {notesLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : patientNotes.length > 0 ? (
            <div className="space-y-2">
              {patientNotes.map((note) => (
                <div key={note._id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{note.chiefComplaint || 'Untitled Note'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>{new Date(note.sessionDate).toLocaleDateString()}</span>
                      <span className="capitalize">{note.noteType}</span>
                    </div>
                  </div>
                  <Badge dot variant={note.verificationStatus === 'verified' ? 'success' : note.verificationStatus === 'rejected' ? 'danger' : 'warning'}>
                    {note.verificationStatus}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No clinical notes for this patient</p>
          )}
        </Card>
      </motion.div>

      {/* Latest Risk Assessment */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card title="Latest Risk Assessment" icon={Shield}>
          {riskLoading ? (
            <Skeleton className="h-20" />
          ) : latestRisk ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge dot variant={latestRisk.overallRisk === 'critical' || latestRisk.overallRisk === 'high' ? 'danger' : latestRisk.overallRisk === 'moderate' ? 'warning' : 'success'} size="md">
                  {latestRisk.overallRisk?.toUpperCase()} RISK
                </Badge>
                {latestRisk.confidence != null && <span className="text-xs text-slate-500">Confidence: {Math.round(latestRisk.confidence * 100)}%</span>}
              </div>
              {latestRisk.riskScores && latestRisk.riskScores.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {latestRisk.riskScores.map((rs, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 capitalize">{rs.category}</p>
                      <p className="text-sm font-bold text-slate-800">{rs.score}/100 <span className="font-normal text-xs text-slate-400">({rs.level})</span></p>
                    </div>
                  ))}
                </div>
              )}
              {latestRisk.predictions && latestRisk.predictions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">Predictions</p>
                  {latestRisk.predictions.slice(0, 3).map((pred, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">{pred.condition}</span>
                      <span className="font-semibold text-slate-800">{Math.round(pred.probability * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No risk assessment available for this patient</p>
          )}
        </Card>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showEditModal && <EditPatientModal patient={currentPatient} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); refreshPatient(); }} />}
        {showVitalsModal && <AddVitalsModal patientId={currentPatient._id} onClose={() => setShowVitalsModal(false)} onSaved={() => { setShowVitalsModal(false); refreshPatient(); }} />}
        {showMedModal && <AddMedicationModal patientId={currentPatient._id} onClose={() => setShowMedModal(false)} onSaved={() => { setShowMedModal(false); refreshPatient(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

const vitalColorMap: Record<string, string> = {
  blue: 'from-blue-100 to-blue-50 text-blue-600',
  rose: 'from-rose-100 to-rose-50 text-rose-600',
  amber: 'from-amber-100 to-amber-50 text-amber-600',
  emerald: 'from-emerald-100 to-emerald-50 text-emerald-600',
  cyan: 'from-cyan-100 to-cyan-50 text-cyan-600',
  violet: 'from-violet-100 to-violet-50 text-violet-600',
};

function VitalItem({ icon: Icon, label, value, unit, color = 'blue' }: { icon: React.ElementType; label: string; value: string | number; unit: string; color?: string }) {
  const colors = vitalColorMap[color] || vitalColorMap.blue;
  return (
    <div className="text-center p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br mx-auto mb-2 flex items-center justify-center', colors)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{unit}</p>
    </div>
  );
}

/* ── Edit Patient Modal ── */
const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

function EditPatientModal({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    bloodGroup: patient.bloodGroup || '',
    allergies: (patient.allergies || []).join(', '),
    chronicConditions: (patient.chronicConditions || []).join(', '),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/patients/${patient._id}`, {
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        chronicConditions: form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
      });
      toast.success('Patient updated');
      onSaved();
    } catch { toast.error('Failed to update patient'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Edit Patient</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
            <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className={inputClass}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allergies (comma-separated)</label>
            <input type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className={inputClass} placeholder="e.g., Penicillin, Peanuts" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chronic Conditions (comma-separated)</label>
            <input type="text" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} className={inputClass} placeholder="e.g., Diabetes, Hypertension" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Add Vitals Modal ── */
function AddVitalsModal({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ systolic: '', diastolic: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSaturation: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const vitals: Record<string, unknown> = {};
      if (form.systolic && form.diastolic) vitals.bloodPressure = { systolic: +form.systolic, diastolic: +form.diastolic };
      if (form.heartRate) vitals.heartRate = +form.heartRate;
      if (form.temperature) vitals.temperature = +form.temperature;
      if (form.weight) vitals.weight = +form.weight;
      if (form.height) vitals.height = +form.height;
      if (form.oxygenSaturation) vitals.oxygenSaturation = +form.oxygenSaturation;
      await api.post(`/patients/${patientId}/vitals`, vitals);
      toast.success('Vitals recorded');
      onSaved();
    } catch { toast.error('Failed to add vitals'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Add Vital Signs</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Systolic BP</label>
              <input type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value })} className={inputClass} placeholder="120" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Diastolic BP</label>
              <input type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} className={inputClass} placeholder="80" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Heart Rate (bpm)</label>
              <input type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} className={inputClass} placeholder="72" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temperature (°F)</label>
              <input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className={inputClass} placeholder="98.6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} placeholder="70" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Height (cm)</label>
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputClass} placeholder="170" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">SpO2 (%)</label>
              <input type="number" value={form.oxygenSaturation} onChange={(e) => setForm({ ...form, oxygenSaturation: e.target.value })} className={inputClass} placeholder="98" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all">{submitting ? 'Saving...' : 'Record Vitals'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Add Medication Modal ── */
function AddMedicationModal({ patientId, onClose, onSaved }: { patientId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', startDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dosage || !form.frequency) { toast.error('Fill all required fields'); return; }
    setSubmitting(true);
    try {
      await api.post(`/patients/${patientId}/medications`, form);
      toast.success('Medication added');
      onSaved();
    } catch { toast.error('Failed to add medication'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Add Medication</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Medication Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g., Metformin" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dosage *</label>
              <input type="text" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={inputClass} placeholder="e.g., 500mg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Frequency *</label>
              <input type="text" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={inputClass} placeholder="e.g., Twice daily" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all">{submitting ? 'Adding...' : 'Add Medication'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CREATE PATIENT MODAL — Full multi-section form for doctors
   ══════════════════════════════════════════════════════════════════════ */

interface CreatePatientForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: { name: string; phone: string; relation: string };
  allergies: string;
  chronicConditions: string;
  insurance: { provider: string; policyNumber: string; expiryDate: string };
  medicalHistory: Array<{ condition: string; diagnosedDate: string; status: string; notes: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string; startDate: string }>;
  vitalSigns: { systolic: string; diastolic: string; heartRate: string; temperature: string; weight: string; height: string; oxygenSaturation: string };
  riskFactors: Array<{ factor: string; severity: string }>;
}

const emptyForm: CreatePatientForm = {
  name: '', email: '', phone: '', dateOfBirth: '', gender: '', bloodGroup: '',
  emergencyContact: { name: '', phone: '', relation: '' },
  allergies: '', chronicConditions: '',
  insurance: { provider: '', policyNumber: '', expiryDate: '' },
  medicalHistory: [],
  medications: [],
  vitalSigns: { systolic: '', diastolic: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSaturation: '' },
  riskFactors: [],
};

const sectionLabels = ['Basic Information', 'Medical Profile', 'Medications & History', 'Vitals & Risk Factors'];

function CreatePatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreatePatientForm>({ ...emptyForm, medicalHistory: [], medications: [], riskFactors: [] });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ patientCode?: string; tempPassword?: string; message?: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const updateField = (field: keyof CreatePatientForm, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent: 'emergencyContact' | 'insurance' | 'vitalSigns', field: string, value: string) =>
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  // Validation per step
  const canProceed = () => {
    if (step === 0) {
      return form.name && form.email && form.dateOfBirth && form.gender &&
        form.emergencyContact.name && form.emergencyContact.phone && form.emergencyContact.relation;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        emergencyContact: form.emergencyContact,
      };
      if (form.phone) payload.phone = form.phone;
      if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
      if (form.allergies) payload.allergies = form.allergies.split(',').map(s => s.trim()).filter(Boolean);
      if (form.chronicConditions) payload.chronicConditions = form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean);
      if (form.insurance.provider || form.insurance.policyNumber) payload.insurance = form.insurance;
      if (form.medicalHistory.length > 0) payload.medicalHistory = form.medicalHistory;
      if (form.medications.length > 0) payload.medications = form.medications;

      // Vital signs
      const vs: Record<string, any> = {};
      if (form.vitalSigns.systolic && form.vitalSigns.diastolic) vs.bloodPressure = { systolic: +form.vitalSigns.systolic, diastolic: +form.vitalSigns.diastolic };
      if (form.vitalSigns.heartRate) vs.heartRate = +form.vitalSigns.heartRate;
      if (form.vitalSigns.temperature) vs.temperature = +form.vitalSigns.temperature;
      if (form.vitalSigns.weight) vs.weight = +form.vitalSigns.weight;
      if (form.vitalSigns.height) vs.height = +form.vitalSigns.height;
      if (form.vitalSigns.oxygenSaturation) vs.oxygenSaturation = +form.vitalSigns.oxygenSaturation;
      if (Object.keys(vs).length > 0) payload.vitalSigns = vs;

      if (form.riskFactors.length > 0) payload.riskFactors = form.riskFactors;

      const { data } = await api.post('/patients', payload);
      toast.success(data.message || 'Patient created!');
      setResult({
        patientCode: data.data?.patientCode,
        tempPassword: data.tempPassword,
        message: data.message,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  // ── Success screen ──
  if (result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Patient Created!</h2>
            {result.patientCode && (
              <div className="inline-block font-mono text-lg bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold">
                {result.patientCode}
              </div>
            )}
            <p className="text-sm text-slate-600">{result.message}</p>
            {result.tempPassword && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-amber-800">Temporary Login Password</p>
                <p className="text-xs text-amber-600">Share this password securely with the patient. They should change it on first login.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-slate-800 select-all">
                    {result.tempPassword}
                  </code>
                  <button onClick={copyPassword} className="p-2 rounded-lg hover:bg-amber-100 transition-colors text-amber-700" title="Copy password">
                    {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button onClick={onCreated} className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-600" /> Create New Patient
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Step {step + 1} of {sectionLabels.length}: {sectionLabels[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1.5">
            {sectionLabels.map((_, i) => (
              <div key={i} className={cn(
                'h-1.5 rounded-full flex-1 transition-all duration-300',
                i <= step ? 'bg-primary-500' : 'bg-slate-200'
              )} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Step 0: Basic Information */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                  <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} className={inputClass} placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={inputClass} placeholder="patient@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className={inputClass} placeholder="+1 555-0123" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth *</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender *</label>
                  <select value={form.gender} onChange={e => updateField('gender', e.target.value)} className={inputClass}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
                  <select value={form.bloodGroup} onChange={e => updateField('bloodGroup', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-rose-700 flex items-center gap-2"><Shield className="w-4 h-4" /> Emergency Contact *</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                    <input type="text" value={form.emergencyContact.name} onChange={e => updateNested('emergencyContact', 'name', e.target.value)} className={inputClass} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone *</label>
                    <input type="tel" value={form.emergencyContact.phone} onChange={e => updateNested('emergencyContact', 'phone', e.target.value)} className={inputClass} placeholder="555-0199" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Relation *</label>
                    <input type="text" value={form.emergencyContact.relation} onChange={e => updateNested('emergencyContact', 'relation', e.target.value)} className={inputClass} placeholder="Spouse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Medical Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allergies (comma-separated)</label>
                <input type="text" value={form.allergies} onChange={e => updateField('allergies', e.target.value)} className={inputClass} placeholder="Penicillin, Sulfa, Peanuts" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chronic Conditions (comma-separated)</label>
                <input type="text" value={form.chronicConditions} onChange={e => updateField('chronicConditions', e.target.value)} className={inputClass} placeholder="Type 2 Diabetes, Hypertension" />
              </div>

              {/* Insurance */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-blue-700 flex items-center gap-2"><Shield className="w-4 h-4" /> Insurance Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Provider</label>
                    <input type="text" value={form.insurance.provider} onChange={e => updateNested('insurance', 'provider', e.target.value)} className={inputClass} placeholder="BlueCross BlueShield" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Number</label>
                    <input type="text" value={form.insurance.policyNumber} onChange={e => updateNested('insurance', 'policyNumber', e.target.value)} className={inputClass} placeholder="BCB-12345" />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <button type="button" onClick={() => toggleSection('history')} className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  {expandedSections.history ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Medical History ({form.medicalHistory.length} entries)
                </button>
                {expandedSections.history && (
                  <div className="space-y-3">
                    {form.medicalHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Entry {idx + 1}</span>
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, medicalHistory: prev.medicalHistory.filter((_, i) => i !== idx) }))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={entry.condition} onChange={e => { const updated = [...form.medicalHistory]; updated[idx].condition = e.target.value; updateField('medicalHistory', updated); }} className={inputClass} placeholder="Condition" />
                          <select value={entry.status} onChange={e => { const updated = [...form.medicalHistory]; updated[idx].status = e.target.value; updateField('medicalHistory', updated); }} className={inputClass}>
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                            <option value="managed">Managed</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={entry.diagnosedDate} onChange={e => { const updated = [...form.medicalHistory]; updated[idx].diagnosedDate = e.target.value; updateField('medicalHistory', updated); }} className={inputClass} />
                          <input type="text" value={entry.notes} onChange={e => { const updated = [...form.medicalHistory]; updated[idx].notes = e.target.value; updateField('medicalHistory', updated); }} className={inputClass} placeholder="Notes" />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, medicalHistory: [...prev.medicalHistory, { condition: '', diagnosedDate: '', status: 'active', notes: '' }] }))} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Medical History Entry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Medications & History */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Add current medications that the patient is taking.</p>
              {form.medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Medication {idx + 1}</span>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== idx) }))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={med.name} onChange={e => { const updated = [...form.medications]; updated[idx].name = e.target.value; updateField('medications', updated); }} className={inputClass} placeholder="Medication name" />
                    <input type="text" value={med.dosage} onChange={e => { const updated = [...form.medications]; updated[idx].dosage = e.target.value; updateField('medications', updated); }} className={inputClass} placeholder="Dosage (e.g., 500mg)" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={med.frequency} onChange={e => { const updated = [...form.medications]; updated[idx].frequency = e.target.value; updateField('medications', updated); }} className={inputClass} placeholder="Frequency (e.g., Twice daily)" />
                    <input type="date" value={med.startDate} onChange={e => { const updated = [...form.medications]; updated[idx].startDate = e.target.value; updateField('medications', updated); }} className={inputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setForm(prev => ({ ...prev, medications: [...prev.medications, { name: '', dosage: '', frequency: '', startDate: '' }] }))} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Medication
              </button>
            </div>
          )}

          {/* Step 3: Vitals & Risk Factors */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Initial Vital Signs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Systolic BP</label>
                    <input type="number" value={form.vitalSigns.systolic} onChange={e => updateNested('vitalSigns', 'systolic', e.target.value)} className={inputClass} placeholder="120" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Diastolic BP</label>
                    <input type="number" value={form.vitalSigns.diastolic} onChange={e => updateNested('vitalSigns', 'diastolic', e.target.value)} className={inputClass} placeholder="80" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input type="number" value={form.vitalSigns.heartRate} onChange={e => updateNested('vitalSigns', 'heartRate', e.target.value)} className={inputClass} placeholder="72" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Temperature (°F)</label>
                    <input type="number" step="0.1" value={form.vitalSigns.temperature} onChange={e => updateNested('vitalSigns', 'temperature', e.target.value)} className={inputClass} placeholder="98.6" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Weight (kg)</label>
                    <input type="number" step="0.1" value={form.vitalSigns.weight} onChange={e => updateNested('vitalSigns', 'weight', e.target.value)} className={inputClass} placeholder="70" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input type="number" value={form.vitalSigns.height} onChange={e => updateNested('vitalSigns', 'height', e.target.value)} className={inputClass} placeholder="170" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                    <input type="number" value={form.vitalSigns.oxygenSaturation} onChange={e => updateNested('vitalSigns', 'oxygenSaturation', e.target.value)} className={inputClass} placeholder="98" />
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Risk Factors</p>
                {form.riskFactors.map((rf, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="text" value={rf.factor} onChange={e => { const updated = [...form.riskFactors]; updated[idx].factor = e.target.value; updateField('riskFactors', updated); }} className={cn(inputClass, 'flex-1')} placeholder="Risk factor" />
                    <select value={rf.severity} onChange={e => { const updated = [...form.riskFactors]; updated[idx].severity = e.target.value; updateField('riskFactors', updated); }} className={cn(inputClass, 'w-32')}>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, riskFactors: prev.riskFactors.filter((_, i) => i !== idx) }))} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm(prev => ({ ...prev, riskFactors: [...prev.riskFactors, { factor: '', severity: 'moderate' }] }))} className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Risk Factor
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </button>
          {step < sectionLabels.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Creating Patient...' : 'Create Patient'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
