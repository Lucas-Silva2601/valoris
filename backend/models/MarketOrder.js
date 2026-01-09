import mongoose from 'mongoose';

const marketOrderSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  countryId: {
    type: String, // ISO_A3 code
    required: true,
    index: true
  },
  countryName: {
    type: String,
    required: true
  },
  shares: {
    type: Number,
    required: true,
    min: 0.1,
    max: 100
  },
  pricePerShare: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  // Escrow: ações retidas pelo sistema
  escrowShares: {
    type: Number,
    default: 0,
    min: 0
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar updatedAt antes de salvar
marketOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices compostos para queries eficientes
marketOrderSchema.index({ countryId: 1, status: 1 });
marketOrderSchema.index({ sellerId: 1, status: 1 });
marketOrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('MarketOrder', marketOrderSchema);

