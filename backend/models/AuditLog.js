import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String
  },
  action: {
    type: String,
    required: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  statusCode: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas rápidas
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL para remover logs antigos (90 dias)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('AuditLog', auditLogSchema);

