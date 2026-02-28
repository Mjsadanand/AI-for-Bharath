import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientCode: string;
  userId: mongoose.Types.ObjectId;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
  };
  medicalHistory: {
    condition: string;
    diagnosedDate: Date;
    status: 'active' | 'resolved' | 'managed';
    notes?: string;
  }[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    prescribedBy: mongoose.Types.ObjectId;
  }[];
  vitalSigns: {
    date: Date;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  }[];
  riskFactors: {
    factor: string;
    severity: 'low' | 'moderate' | 'high';
    identifiedDate: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientCode: { type: String, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: { type: String, required: true },
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        status: { type: String, enum: ['active', 'resolved', 'managed'] },
        notes: String,
      },
    ],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
        prescribedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    vitalSigns: [
      {
        date: Date,
        bloodPressure: { systolic: Number, diastolic: Number },
        heartRate: Number,
        temperature: Number,
        weight: Number,
        height: Number,
        oxygenSaturation: Number,
      },
    ],
    riskFactors: [
      {
        factor: String,
        severity: { type: String, enum: ['low', 'moderate', 'high'] },
        identifiedDate: Date,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate short patient code (PT-0001, PT-0002, ...)
patientSchema.pre('save', async function () {
  if (!this.patientCode) {
    const lastPatient = await mongoose.model<IPatient>('Patient').findOne({ patientCode: { $exists: true } }).sort({ patientCode: -1 }).select('patientCode').lean<Pick<IPatient, 'patientCode'>>();
    let nextNum = 1;
    if (lastPatient && lastPatient.patientCode) {
      const match = lastPatient.patientCode.match(/PT-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.patientCode = `PT-${String(nextNum).padStart(4, '0')}`;
  }
});

const Patient = mongoose.model<IPatient>('Patient', patientSchema);
export default Patient;
