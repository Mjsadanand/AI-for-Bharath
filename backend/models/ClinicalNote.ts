import mongoose, { Document, Schema } from 'mongoose';

export interface IClinicalNote extends Document {
  patientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  sessionDate: Date;
  noteType: 'consultation' | 'follow-up' | 'emergency' | 'procedure' | 'discharge';
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExam: {
    general?: string;
    vitals?: string;
    findings: string[];
  };
  assessment: {
    diagnosis: string;
    icdCode?: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }[];
  plan: {
    treatment: string;
    medications?: string[];
    followUp?: string;
    referrals?: string[];
    instructions?: string;
  }[];
  extractedEntities: {
    type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'lab_test';
    value: string;
    confidence: number;
  }[];
  transcript?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'amended';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const clinicalNoteSchema = new Schema<IClinicalNote>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionDate: { type: Date, default: Date.now },
    noteType: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency', 'procedure', 'discharge'],
      required: true,
    },
    chiefComplaint: { type: String, required: true },
    historyOfPresentIllness: { type: String },
    physicalExam: {
      general: String,
      vitals: String,
      findings: [String],
    },
    assessment: [
      {
        diagnosis: String,
        icdCode: String,
        severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
        notes: String,
      },
    ],
    plan: [
      {
        treatment: String,
        medications: [String],
        followUp: String,
        referrals: [String],
        instructions: String,
      },
    ],
    extractedEntities: [
      {
        type: { type: String, enum: ['symptom', 'diagnosis', 'medication', 'procedure', 'lab_test'] },
        value: String,
        confidence: Number,
      },
    ],
    transcript: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'amended'],
      default: 'pending',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    prescriptions: [
      {
        medication: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
  },
  { timestamps: true }
);

clinicalNoteSchema.index({ patientId: 1, sessionDate: -1 });
clinicalNoteSchema.index({ providerId: 1, sessionDate: -1 });

const ClinicalNote = mongoose.model<IClinicalNote>('ClinicalNote', clinicalNoteSchema);
export default ClinicalNote;
