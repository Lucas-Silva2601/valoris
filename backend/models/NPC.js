import mongoose from 'mongoose';

const npcSchema = new mongoose.Schema({
  npcId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: function() {
      const names = [
        'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia',
        'Lucas', 'Fernanda', 'Rafael', 'Mariana', 'Gabriel', 'Beatriz',
        'Thiago', 'Camila', 'Felipe', 'Isabela', 'Bruno', 'Larissa'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
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
  // Posição atual
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
  // Destino atual (para onde está indo)
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
  // Edifício de origem (casa, trabalho)
  homeBuilding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    default: null
  },
  workBuilding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    default: null
  },
  // Estado do NPC
  status: {
    type: String,
    enum: ['idle', 'walking', 'working', 'resting'],
    default: 'idle'
  },
  // ✅ Adicionar campos solicitados
  skinColor: {
    type: String,
    default: function() {
      // Cores de pele diversificadas (tons de marrom, bege e bronze)
      const colors = [
        '#f4d5bd', '#422d1a', '#d4a574', '#c19a6b',
        '#8b6f47', '#5c4a3a', '#e6c4a0', '#b8916d',
        '#6b4e3d', '#9d7a5a', '#a6896d', '#7a5c42'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  currentTask: {
    type: String,
    enum: ['idle', 'walking', 'working', 'resting'],
    default: 'idle'
  },
  // Velocidade de movimento (km/h)
  speed: {
    type: Number,
    default: 5, // 5 km/h (velocidade de caminhada humana)
    min: 0
  },
  // Direção atual (em graus, 0-360)
  direction: {
    type: Number,
    default: 0,
    min: 0,
    max: 360
  },
  // Última atualização de posição
  lastMovementTime: {
    type: Date,
    default: Date.now
  },
  // Próxima ação agendada
  nextActionTime: {
    type: Date,
    default: null
  },
  // Tipo de NPC (afeta comportamento)
  npcType: {
    type: String,
    enum: ['resident', 'worker', 'tourist', 'student'],
    default: 'resident'
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
npcSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices
npcSchema.index({ countryId: 1, position: '2dsphere' });
npcSchema.index({ status: 1, countryId: 1 });
npcSchema.index({ homeBuilding: 1 });
npcSchema.index({ workBuilding: 1 });

export default mongoose.model('NPC', npcSchema);

