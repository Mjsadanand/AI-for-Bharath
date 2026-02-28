export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient' | 'researcher' | 'admin';
  specialization?: string;
  licenseNumber?: string;
  token: string;
}

export interface Patient {
  _id: string;
  userId: string | User;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosedDate: string;
    status: 'active' | 'resolved' | 'managed';
    notes?: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy: string;
  }>;
  vitalSigns: Array<{
    date: string;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  }>;
  riskFactors?: Array<{
    factor: string;
    severity: 'low' | 'moderate' | 'high';
    identifiedDate: string;
  }>;
}

export interface ClinicalNote {
  _id: string;
  patientId: string | Patient;
  providerId: string | User;
  sessionDate: string;
  noteType: 'consultation' | 'follow-up' | 'emergency' | 'procedure' | 'discharge';
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExam?: {
    general?: string;
    vitals?: string;
    findings: string[];
  };
  assessment: Array<{
    diagnosis: string;
    icdCode?: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
  plan: Array<{
    treatment: string;
    medications?: string[];
    followUp?: string;
    referrals?: string[];
    instructions?: string;
  }>;
  extractedEntities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  transcript?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'amended';
  verifiedBy?: string;
  verifiedAt?: string;
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface RiskAssessment {
  _id: string;
  patientId: string | Patient;
  assessedBy?: string;
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
  createdAt: string;
  updatedAt?: string;
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
  notes?: string;
}

export interface InsuranceClaim {
  _id: string;
  patientId: string | Patient;
  providerId: string | User;
  clinicalNoteId?: string;
  claimNumber: string;
  insuranceProvider: string;
  policyNumber: string;
  diagnosisCodes: Array<{ code: string; description: string }>;
  procedureCodes: Array<{ code: string; description: string }>;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'denied' | 'appealed';
  submittedDate?: string;
  processedDate?: string;
  approvedAmount?: number;
  denialReason?: string;
  notes?: string;
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details?: string;
  }>;
  createdAt: string;
}

export interface LabResult {
  _id: string;
  patientId: string | Patient;
  orderedBy: string | User;
  testName: string;
  category: string;
  results: Array<{
    parameter: string;
    value: number | string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'reviewed';
  collectedDate?: string;
  completedDate?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface ResearchPaper {
  _id: string;
  externalId?: string;
  title: string;
  authors: string[];
  publicationDate: string;
  journal: string;
  abstract: string;
  summary?: string;
  keyFindings?: string[];
  methodology?: string;
  limitations?: string[];
  keywords: string[];
  citations: number;
  url?: string;
  savedBy: string[];
  category: string;
  createdAt?: string;
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
  trendingTopicsData?: Array<{
    _id: string;
    keyword: string;
    count: number;
    avgImpactFactor?: number;
  }>;
}
