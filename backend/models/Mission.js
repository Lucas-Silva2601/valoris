import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  missionId: {
    type: String,
    required: true,
    unique: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['military', 'economic', 'diplomatic', 'exploration'],
    required: true
  },
  targetCountry: {
    type: String, // ISO_A3
    default: null
  },
  requirements: {
    minLevel: {
      type: Number,
      default: 1
    },
    requiredRole: {
      type: String,
      enum: ['investor', 'operational', 'any'],
      default: 'operational'
    }
  },
  reward: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  },
  status: {
    type: String,
    enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

// Índices
missionSchema.index({ creatorId: 1, status: 1 });
missionSchema.index({ acceptedBy: 1, status: 1 });
missionSchema.index({ status: 1, createdAt: -1 });
missionSchema.index({ type: 1, status: 1 });

export default mongoose.model('Mission', missionSchema);

