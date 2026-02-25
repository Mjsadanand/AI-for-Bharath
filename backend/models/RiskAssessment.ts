import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskAssessment extends Document {
  patientId: mongoose.Types.ObjectId;
  assessedBy?: mongoose.Types.ObjectId;
  assessmentDate: Date;
  riskScores: {
    category: string;
    score: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
  }[];
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  confidenceLevel: number;
  evidenceSources: string[];
  predictions: {
    condition: string;
    probability: number;
    timeframe: string;
    preventable: boolean;
  }[];
  recommendations: {
    type: 'lifestyle' | 'medication' | 'screening' | 'referral' | 'monitoring';
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    evidenceBasis: string;
  }[];
  alerts: {
    type: 'warning' | 'critical' | 'info';
    message: string;
    acknowledged: boolean;
    acknowledgedBy?: mongoose.Types.ObjectId;
    acknowledgedAt?: Date;
  }[];
  followUpRequired: boolean;
  nextAssessmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const riskAssessmentSchema = new Schema<IRiskAssessment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    assessedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assessmentDate: { type: Date, default: Date.now },
    riskScores: [
      {
        category: String,
        score: Number,
        level: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
        factors: [String],
      },
    ],
    overallRisk: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    confidenceLevel: { type: Number, min: 0, max: 1 },
    evidenceSources: [String],
    predictions: [
      {
        condition: String,
        probability: Number,
        timeframe: String,
        preventable: Boolean,
      },
    ],
    recommendations: [
      {
        type: { type: String, enum: ['lifestyle', 'medication', 'screening', 'referral', 'monitoring'] },
        description: String,
        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
        evidenceBasis: String,
      },
    ],
    alerts: [
      {
        type: { type: String, enum: ['warning', 'critical', 'info'] },
        message: String,
        acknowledged: { type: Boolean, default: false },
        acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: Date,
      },
    ],
    followUpRequired: { type: Boolean, default: false },
    nextAssessmentDate: Date,
  },
  { timestamps: true }
);

riskAssessmentSchema.index({ patientId: 1, assessmentDate: -1 });

const RiskAssessment = mongoose.model<IRiskAssessment>('RiskAssessment', riskAssessmentSchema);
export default RiskAssessment;
