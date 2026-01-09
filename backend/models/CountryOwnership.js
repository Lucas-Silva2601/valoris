import mongoose from 'mongoose';

const countryOwnershipSchema = new mongoose.Schema({
  countryId: {
    type: String, // ISO_A3 code
    required: true,
    unique: true
  },
  countryName: {
    type: String,
    required: true
  },
  totalShares: {
    type: Number,
    default: 100, // 100% total
    min: 0,
    max: 100
  },
  shareholders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    purchasePrice: {
      type: Number,
      required: true
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentSharePrice: {
    type: Number,
    default: 1000, // Preço base por ação
    min: 0
  },
  totalInvested: {
    type: Number,
    default: 0
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
countryOwnershipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices
// countryId já tem índice único (unique: true), não precisa criar novamente
countryOwnershipSchema.index({ 'shareholders.userId': 1 });

export default mongoose.model('CountryOwnership', countryOwnershipSchema);

