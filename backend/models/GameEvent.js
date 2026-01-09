import mongoose from 'mongoose';

/**
 * Modelo para eventos do jogo (analytics)
 */
const gameEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'player_login',
      'player_logout',
      'investment_made',
      'dividend_received',
      'combat_started',
      'combat_ended',
      'unit_created',
      'unit_moved',
      'country_conquered',
      'mission_created',
      'mission_completed',
      'treasury_updated',
      'economic_event'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  countryId: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Índices compostos para queries eficientes
gameEventSchema.index({ eventType: 1, timestamp: -1 });
gameEventSchema.index({ userId: 1, timestamp: -1 });
gameEventSchema.index({ countryId: 1, timestamp: -1 });

export default mongoose.model('GameEvent', gameEventSchema);

