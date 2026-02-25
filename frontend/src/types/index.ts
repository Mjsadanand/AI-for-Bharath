export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient' | 'researcher' | 'admin';
  specialization?: string;
  token: string;
}

export interface Patient {
  _id: string;
  userId: string | User;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosedDate: string;
    status: string;
    notes: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy: string;
    active: boolean;
  }>;
  vitalSigns: Array<{
    date: string;
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    oxygenSaturation: number;
  }>;
}

export interface ClinicalNote {
  _id: string;
  patientId: string | Patient;
  providerId: string | User;
  sessionDate: string;
  noteType: string;
  chiefComplaint: string;
  hpiText: string;
  physicalExam: string;
  assessment: {
    diagnoses: Array<{
      condition: string;
      icdCode: string;
      status: string;
    }>;
    clinicalImpression: string;
  };
  plan: string;
  extractedEntities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  transcript: string;
  verificationStatus: string;
  createdAt: string;
}

export interface RiskAssessment {
  _id: string;
  patientId: string;
  assessedBy: string;
  riskScores: Array<{
    category: string;
    score: number;
    level: string;
    factors: string[];
  }>;
  overallRisk: string;
  confidence: number;
  predictions: Array<{
    condition: string;
    probability: number;
    timeframe: string;
    preventable: boolean;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    description: string;
    evidenceBasis: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    acknowledged: boolean;
  }>;
  assessmentDate: string;
}

export interface Appointment {
  _id: string;
  patientId: string | Patient;
  doctorId: string | User;
  scheduledDate: string;
  duration: number;
  type: string;
  status: string;
  priority: string;
  reason: string;
  notes: string;
}

export interface InsuranceClaim {
  _id: string;
  patientId: string | Patient;
  providerId: string | User;
  claimNumber: string;
  serviceDate: string;
  diagnosisCodes: string[];
  procedureCodes: string[];
  totalAmount: number;
  approvedAmount?: number;
  status: string;
  denialReason?: string;
  submittedDate?: string;
}

export interface LabResult {
  _id: string;
  patientId: string | Patient;
  orderedBy: string | User;
  testName: string;
  category: string;
  status: string;
  orderedDate: string;
  resultDate?: string;
  parameters: Array<{
    name: string;
    value: number;
    unit: string;
    referenceRange: { min: number; max: number };
    status: string;
  }>;
}

export interface ResearchPaper {
  _id: string;
  title: string;
  authors: string[];
  abstract: string;
  journal: string;
  publicationDate: string;
  doi: string;
  keywords: string[];
  category: string;
  citations: number;
  impactFactor: number;
  savedBy: string[];
}

export interface DashboardData {
  stats: Record<string, number>;
  todayAppointments?: Appointment[];
  recentPatients?: Patient[];
  pendingNotes?: ClinicalNote[];
  activeAlerts?: Array<{
    assessmentId: string;
    patientId: string;
    overallRisk: string;
    type: string;
    message: string;
  }>;
  upcomingAppointments?: Appointment[];
  latestAssessment?: RiskAssessment;
  recentLabResults?: LabResult[];
  currentMedications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
}
