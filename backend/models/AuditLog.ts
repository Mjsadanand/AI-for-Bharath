import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  module: 'clinical-doc' | 'translator' | 'predictive' | 'research' | 'workflow' | 'auth' | 'system';
  resourceType: string;
  resourceId?: mongoose.Types.ObjectId;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    module: {
      type: String,
      enum: ['clinical-doc', 'translator', 'predictive', 'research', 'workflow', 'auth', 'system'],
      required: true,
    },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    details: String,
    ipAddress: String,
    userAgent: String,
    result: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
