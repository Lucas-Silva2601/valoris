import mongoose from 'mongoose';

const militaryUnitSchema = new mongoose.Schema({
  unitId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['tank', 'ship', 'plane'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  countryId: {
    type: String, // ISO_A3 do país de origem
    required: true
  },
  position: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  targetPosition: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  health: {
    current: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 1
    }
  },
  attack: {
    type: Number,
    required: true,
    min: 0
  },
  defense: {
    type: Number,
    required: true,
    min: 0
  },
  speed: {
    type: Number,
    required: true,
    min: 0
  },
  range: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['idle', 'moving', 'attacking', 'defending', 'destroyed'],
    default: 'idle'
  },
  inCombat: {
    type: Boolean,
    default: false
  },
  currentCountry: {
    type: String, // ISO_A3 do país atual
    default: null
  },
  fuel: {
    current: {
      type: Number,
      required: true,
      min: 0,
      default: 100
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 100
    }
  },
  lastMovementTime: {
    type: Date,
    default: null
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
militaryUnitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices
militaryUnitSchema.index({ ownerId: 1 });
militaryUnitSchema.index({ countryId: 1 });
militaryUnitSchema.index({ 'position.lat': 1, 'position.lng': 1 });
militaryUnitSchema.index({ status: 1 });

export default mongoose.model('MilitaryUnit', militaryUnitSchema);

