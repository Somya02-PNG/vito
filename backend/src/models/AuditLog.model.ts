import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actorRole: {
      type: String,
      required: true,
      default: 'SYSTEM',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export async function logAuditEvent(params: {
  actorId?: Types.ObjectId | string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const log = new AuditLog({
      actorId: params.actorId,
      actorRole: params.actorRole || 'SYSTEM',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress || '',
      userAgent: params.userAgent || '',
    });
    await log.save();
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}

const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
