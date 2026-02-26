import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, Badge, StatCard, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
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
  Droplets,
  Thermometer,
  Weight,
  Wind,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Patient } from '../../types';
import WorkflowNav from '../../components/ui/WorkflowNav';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, [page]);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients', { params: { page, limit: 20 } });
      setPatients(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/patients/${id}`);
      setSelectedPatient(data.data);
    } catch (err) {
      toast.error('Failed to load patient details');
    }
  };

  const filtered = patients.filter((p) => {
    const user = p.userId as any;
    const name = (user?.name || '').toLowerCase();
    return name.includes(search.toLowerCase()) || p.bloodGroup?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  if (selectedPatient) {
    return <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowNav />
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-500" />
          Patients
        </h1>
        <p className="text-slate-500 mt-1">View and manage patient records</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Search patients by name..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((patient) => {
              const user = patient.userId as any;
              return (
                <button
                  key={patient._id}
                  onClick={() => fetchPatientDetail(patient._id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                      {(user?.name || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {user?.name || 'Unknown'}
                      </p>
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
                  <div className="flex items-center gap-3">
                    {patient.allergies && patient.allergies.length > 0 && (
                      <Badge variant="danger">{patient.allergies.length} allergies</Badge>
                    )}
                    {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                      <Badge variant="warning">{patient.chronicConditions.length} conditions</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Users} title="No patients found" description="Patients will appear here once registered." />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-200">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientDetail({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const user = patient.userId as any;
  const latestVitals = patient.vitalSigns?.[patient.vitalSigns.length - 1];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button + header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to patients
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {(user?.name || '?')[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user?.name || 'Unknown'}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              {patient.dateOfBirth && <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
              {patient.gender && <span className="capitalize">{patient.gender}</span>}
              {patient.bloodGroup && <Badge variant="info">{patient.bloodGroup}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Emergency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Contact">
          <div className="space-y-2 text-sm">
            {user?.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" /> {user.email}
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {user.phone}
              </div>
            )}
          </div>
        </Card>
        {patient.emergencyContact && (
          <Card title="Emergency Contact">
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{patient.emergencyContact.name}</p>
              <p>{patient.emergencyContact.relation}</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> {patient.emergencyContact.phone}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Latest Vitals */}
      {latestVitals && (
        <Card title="Latest Vitals" subtitle={latestVitals.date ? new Date(latestVitals.date).toLocaleDateString() : ''}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {latestVitals.bloodPressure && (
              <VitalItem icon={Activity} label="Blood Pressure" value={`${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic}`} unit="mmHg" />
            )}
            {latestVitals.heartRate && (
              <VitalItem icon={Heart} label="Heart Rate" value={latestVitals.heartRate} unit="bpm" />
            )}
            {latestVitals.temperature && (
              <VitalItem icon={Thermometer} label="Temperature" value={latestVitals.temperature} unit="°F" />
            )}
            {latestVitals.weight && (
              <VitalItem icon={Weight} label="Weight" value={latestVitals.weight} unit="kg" />
            )}
            {latestVitals.oxygenSaturation && (
              <VitalItem icon={Wind} label="SpO2" value={latestVitals.oxygenSaturation} unit="%" />
            )}
            {latestVitals.height && (
              <VitalItem icon={Activity} label="Height" value={latestVitals.height} unit="cm" />
            )}
          </div>
        </Card>
      )}

      {/* Allergies & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Allergies">
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a, i) => (
                <Badge key={i} variant="danger">{a}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No known allergies</p>
          )}
        </Card>
        <Card title="Chronic Conditions">
          {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map((c, i) => (
                <Badge key={i} variant="warning">{c}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No chronic conditions</p>
          )}
        </Card>
      </div>

      {/* Medications */}
      <Card title="Current Medications">
        {patient.medications && patient.medications.length > 0 ? (
          <div className="space-y-3">
            {patient.medications.map((med, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{med.name}</p>
                    <p className="text-xs text-slate-500">{med.dosage} — {med.frequency}</p>
                  </div>
                </div>
                <Badge variant={med.endDate ? 'default' : 'success'}>{med.endDate ? 'completed' : 'active'}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No medications recorded</p>
        )}
      </Card>

      {/* Medical History */}
      {patient.medicalHistory && patient.medicalHistory.length > 0 && (
        <Card title="Medical History">
          <div className="space-y-3">
            {patient.medicalHistory.map((entry, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{entry.condition}</p>
                  <span className="text-xs text-slate-400">
                    {entry.diagnosedDate ? new Date(entry.diagnosedDate).toLocaleDateString() : ''}
                  </span>
                </div>
                {entry.notes && <p className="text-xs text-slate-500 mt-1">{entry.notes}</p>}
                <Badge variant={entry.status === 'resolved' ? 'success' : entry.status === 'active' ? 'warning' : 'default'}>
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function VitalItem({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string | number; unit: string }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <Icon className="w-4 h-4 text-primary-500 mx-auto mb-1" />
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{unit}</p>
    </div>
  );
}
