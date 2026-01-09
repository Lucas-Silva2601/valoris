import mongoose from 'mongoose';

const countryDefenseSchema = new mongoose.Schema({
  countryId: {
    type: String, // ISO_A3
    required: true,
    unique: true
  },
  countryName: {
    type: String,
    required: true
  },
  defenseLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  technologyLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  treasuryBalance: {
    type: Number,
    default: 0
  },
  infrastructureLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  defensePower: {
    type: Number,
    default: 0,
    min: 0
  },
  autoDefenseEnabled: {
    type: Boolean,
    default: true
  },
  defenseUnits: [{
    type: {
      type: String,
      enum: ['tank', 'ship', 'plane'],
      required: true
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    }
  }],
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

// Atualizar poder de defesa antes de salvar
countryDefenseSchema.pre('save', function(next) {
  this.defensePower = calculateDefensePower(this);
  this.lastUpdate = Date.now();
  next();
});

// Calcular poder de defesa
const calculateDefensePower = (defense) => {
  let power = 0;
  
  // Baseado no nível de defesa
  power += defense.defenseLevel * 10;
  
  // Baseado no nível tecnológico
  power += defense.technologyLevel * 15;
  
  // Baseado na infraestrutura
  power += defense.infrastructureLevel * 5;
  
  // Baseado no tesouro (até 20% de bônus)
  const treasuryBonus = Math.min(defense.treasuryBalance / 10000, 0.2) * 100;
  power += treasuryBonus;
  
  // Baseado nas unidades de defesa
  for (const unit of defense.defenseUnits) {
    power += unit.count * unit.level * 5;
  }
  
  return Math.round(power);
};

export default mongoose.model('CountryDefense', countryDefenseSchema);

