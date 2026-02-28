import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Patient, User } from '../../types';
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
    </motion.div>
  );
}

function PatientDetail({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const user = typeof patient.userId === 'object' ? (patient.userId as User) : null;
  const name = user?.name || 'Unknown';
  const latestVitals = patient.vitalSigns?.[patient.vitalSigns.length - 1];

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
              {patient.patientCode && (
                <span className="font-mono text-sm bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg font-bold select-all" title="Patient Code — use this for clinical notes">
                  {patient.patientCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              {patient.dateOfBirth && <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
              {patient.gender && <span className="capitalize">{patient.gender}</span>}
              {patient.bloodGroup && <Badge variant="info">{patient.bloodGroup}</Badge>}
            </div>
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
        {patient.emergencyContact && (
          <Card title="Emergency Contact" icon={Shield}>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{patient.emergencyContact.name}</p>
              <Badge variant="default">{patient.emergencyContact.relation}</Badge>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-rose-500" />
                </div>
                {patient.emergencyContact.phone}
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Latest Vitals */}
      {latestVitals && (
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
      )}

      {/* Allergies & Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card title="Allergies" icon={AlertCircle}>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a, i) => (
                <Badge key={i} variant="danger" dot>{a}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No known allergies</p>
          )}
        </Card>
        <Card title="Chronic Conditions" icon={Heart}>
          {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map((c, i) => (
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
          {patient.medications && patient.medications.length > 0 ? (
            <div className="space-y-2">
              {patient.medications.map((med, i) => (
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
      {patient.medicalHistory && patient.medicalHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card title="Medical History" icon={Calendar}>
            <div className="space-y-2">
              {patient.medicalHistory.map((entry, i) => (
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
