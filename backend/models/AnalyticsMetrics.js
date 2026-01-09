import mongoose from 'mongoose';

/**
 * Modelo para métricas agregadas de analytics
 */
const analyticsMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  // Jogadores
  activePlayers: {
    type: Number,
    default: 0
  },
  newPlayers: {
    type: Number,
    default: 0
  },
  returningPlayers: {
    type: Number,
    default: 0
  },
  // Transações
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalTransactionValue: {
    type: Number,
    default: 0
  },
  averageTransactionValue: {
    type: Number,
    default: 0
  },
  // Combates
  totalCombats: {
    type: Number,
    default: 0
  },
  combatsByType: {
    invasion: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    conquest: { type: Number, default: 0 }
  },
  // Investimentos
  totalInvestments: {
    type: Number,
    default: 0
  },
  totalInvestmentValue: {
    type: Number,
    default: 0
  },
  topInvestedCountries: [{
    countryId: String,
    countryName: String,
    investmentValue: Number,
    investorCount: Number
  }],
  // Unidades
  unitsCreated: {
    type: Number,
    default: 0
  },
  unitsByType: {
    tank: { type: Number, default: 0 },
    ship: { type: Number, default: 0 },
    plane: { type: Number, default: 0 }
  },
  // Missões
  missionsCreated: {
    type: Number,
    default: 0
  },
  missionsCompleted: {
    type: Number,
    default: 0
  },
  // Dividendos
  dividendsDistributed: {
    type: Number,
    default: 0
  },
  totalDividendValue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índice para queries por data
analyticsMetricsSchema.index({ date: -1 });

export default mongoose.model('AnalyticsMetrics', analyticsMetricsSchema);

