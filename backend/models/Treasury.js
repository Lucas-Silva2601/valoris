import mongoose from 'mongoose';

const treasurySchema = new mongoose.Schema({
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
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  expenses: [{
    type: {
      type: String,
      enum: ['infrastructure', 'defense', 'maintenance'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  infrastructureLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  defenseLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
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
treasurySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Treasury', treasurySchema);

