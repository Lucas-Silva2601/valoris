import mongoose from 'mongoose';

const economicMetricsSchema = new mongoose.Schema({
  countryId: {
    type: String, // ISO_A3 code
    required: true,
    unique: true,
    index: true
  },
  countryName: {
    type: String,
    required: true
  },
  healthScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  investmentLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  politicalStability: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  infrastructure: {
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    condition: {
      type: Number,
      default: 100,
      min: 0,
      max: 100 // 100% = perfeito, 0% = destruído
    }
  },
  resources: {
    virtual: {
      type: Number,
      default: 100,
      min: 0
    },
    exploitationRate: {
      type: Number,
      default: 1,
      min: 0,
      max: 10
    }
  },
  events: [{
    type: {
      type: String,
      enum: ['economic_boom', 'recession', 'political_crisis', 'natural_disaster', 'war'],
      required: true
    },
    impact: {
      type: Number,
      required: true,
      min: -100,
      max: 100
    },
    description: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    active: {
      type: Boolean,
      default: true
    }
  }],
  history: [{
    date: {
      type: Date,
      default: Date.now
    },
    healthScore: Number,
    investmentLevel: Number,
    politicalStability: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar updatedAt antes de salvar
economicMetricsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('EconomicMetrics', economicMetricsSchema);

