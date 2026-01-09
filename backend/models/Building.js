import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  buildingId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
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
  type: {
    type: String,
    enum: ['house', 'apartment', 'office', 'skyscraper', 'factory', 'mall'],
    required: true
  },
  name: {
    type: String,
    default: function() {
      const typeNames = {
        house: 'Casa',
        apartment: 'Apartamento',
        office: 'Escritório',
        skyscraper: 'Arranha-céu',
        factory: 'Fábrica',
        mall: 'Shopping'
      };
      return typeNames[this.type] || 'Edifício';
    }
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
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  // Capacidade de pessoas que podem trabalhar/morar
  capacity: {
    type: Number,
    default: function() {
      const baseCapacity = {
        house: 4,
        apartment: 20,
        office: 50,
        skyscraper: 500,
        factory: 100,
        mall: 200
      };
      return (baseCapacity[this.type] || 10) * this.level;
    }
  },
  // Geração de receita (se aplicável)
  revenuePerHour: {
    type: Number,
    default: function() {
      const baseRevenue = {
        house: 0,
        apartment: 10,
        office: 50,
        skyscraper: 500,
        factory: 200,
        mall: 300
      };
      return (baseRevenue[this.type] || 0) * this.level;
    }
  },
  // Estado do edifício
  condition: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  // NPCs associados (moradores, trabalhadores)
  npcs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NPC'
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
buildingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Recalcular capacidade e receita baseado no nível
  if (this.isModified('level')) {
    const baseCapacity = {
      house: 4,
      apartment: 20,
      office: 50,
      skyscraper: 500,
      factory: 100,
      mall: 200
    };
    const baseRevenue = {
      house: 0,
      apartment: 10,
      office: 50,
      skyscraper: 500,
      factory: 200,
      mall: 300
    };
    this.capacity = (baseCapacity[this.type] || 10) * this.level;
    this.revenuePerHour = (baseRevenue[this.type] || 0) * this.level;
  }
  next();
});

// Índices
buildingSchema.index({ countryId: 1, position: '2dsphere' });
buildingSchema.index({ ownerId: 1, countryId: 1 });
buildingSchema.index({ type: 1, countryId: 1 });

export default mongoose.model('Building', buildingSchema);

