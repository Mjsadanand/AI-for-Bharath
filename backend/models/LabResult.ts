import mongoose, { Document, Schema } from 'mongoose';

export interface ILabResult extends Document {
  patientId: mongoose.Types.ObjectId;
  orderedBy: mongoose.Types.ObjectId;
  testName: string;
  category: string;
  results: {
    parameter: string;
    value: number | string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'reviewed';
  collectedDate?: Date;
  completedDate?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const labResultSchema = new Schema<ILabResult>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    orderedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testName: { type: String, required: true },
    category: { type: String, required: true },
    results: [
      {
        parameter: String,
        value: Schema.Types.Mixed,
        unit: String,
        referenceRange: String,
        status: { type: String, enum: ['normal', 'abnormal', 'critical'] },
      },
    ],
    status: {
      type: String,
      enum: ['ordered', 'collected', 'processing', 'completed', 'reviewed'],
      default: 'ordered',
    },
    collectedDate: Date,
    completedDate: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    notes: String,
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

labResultSchema.index({ patientId: 1, completedDate: -1 });

const LabResult = mongoose.model<ILabResult>('LabResult', labResultSchema);
export default LabResult;
