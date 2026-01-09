import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: String, // FASE DE TESTE: Aceitar string para userId de teste
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 10000, // Saldo inicial
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalSpent: {
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
walletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Wallet', walletSchema);

