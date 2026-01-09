import mongoose from 'mongoose';

const combatSchema = new mongoose.Schema({
  combatId: {
    type: String,
    required: true,
    unique: true
  },
  attackerCountry: {
    type: String, // ISO_A3
    required: true
  },
  defenderCountry: {
    type: String, // ISO_A3
    required: true
  },
  attackerUnits: [{
    unitId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['tank', 'ship', 'plane'],
      required: true
    },
    healthBefore: Number,
    healthAfter: Number,
    damageDealt: Number
  }],
  defenderUnits: [{
    unitId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['tank', 'ship', 'plane'],
      required: true
    },
    healthBefore: Number,
    healthAfter: Number,
    damageDealt: Number
  }],
  defenseSystem: {
    level: Number,
    damageDealt: Number,
    healthBefore: Number,
    healthAfter: Number
  },
  result: {
    type: String,
    enum: ['attacker_victory', 'defender_victory', 'ongoing', 'draw'],
    default: 'ongoing'
  },
  damageToInfrastructure: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  location: {
    lat: Number,
    lng: Number
  }
});

// Índices
combatSchema.index({ attackerCountry: 1, defenderCountry: 1 });
combatSchema.index({ startedAt: -1 });

export default mongoose.model('Combat', combatSchema);

