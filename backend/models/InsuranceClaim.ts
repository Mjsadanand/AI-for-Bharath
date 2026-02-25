import mongoose, { Document, Schema } from 'mongoose';

export interface IInsuranceClaim extends Document {
  patientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  clinicalNoteId?: mongoose.Types.ObjectId;
  claimNumber: string;
  insuranceProvider: string;
  policyNumber: string;
  diagnosisCodes: { code: string; description: string }[];
  procedureCodes: { code: string; description: string }[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'denied' | 'appealed';
  submittedDate?: Date;
  processedDate?: Date;
  approvedAmount?: number;
  denialReason?: string;
  notes?: string;
  auditTrail: {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const insuranceClaimSchema = new Schema<IInsuranceClaim>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clinicalNoteId: { type: Schema.Types.ObjectId, ref: 'ClinicalNote' },
    claimNumber: { type: String, required: true, unique: true },
    insuranceProvider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    diagnosisCodes: [{ code: String, description: String }],
    procedureCodes: [{ code: String, description: String }],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'processing', 'approved', 'denied', 'appealed'],
      default: 'draft',
    },
    submittedDate: Date,
    processedDate: Date,
    approvedAmount: Number,
    denialReason: String,
    notes: String,
    auditTrail: [
      {
        action: String,
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        performedAt: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  { timestamps: true }
);

const InsuranceClaim = mongoose.model<IInsuranceClaim>('InsuranceClaim', insuranceClaimSchema);
export default InsuranceClaim;
