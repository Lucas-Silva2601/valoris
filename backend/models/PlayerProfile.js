import mongoose from 'mongoose';

const playerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['investor', 'operational'],
    required: true
  },
  statistics: {
    totalInvested: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    countriesOwned: {
      type: Number,
      default: 0
    },
    unitsCreated: {
      type: Number,
      default: 0
    },
    combatsWon: {
      type: Number,
      default: 0
    },
    combatsLost: {
      type: Number,
      default: 0
    },
    missionsCompleted: {
      type: Number,
      default: 0
    },
    missionsCreated: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    achievementId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  actionHistory: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar updatedAt antes de salvar
playerProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices
// userId já tem índice único (unique: true), não precisa criar novamente
playerProfileSchema.index({ role: 1 });

export default mongoose.model('PlayerProfile', playerProfileSchema);

