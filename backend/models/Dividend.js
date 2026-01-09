import mongoose from 'mongoose';

const dividendSchema = new mongoose.Schema({
  countryId: {
    type: String, // ISO_A3 code
    required: true,
    index: true
  },
  countryName: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  distributionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  sources: {
    transactionFees: {
      type: Number,
      default: 0
    },
    resourceExploitation: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    }
  },
  distributions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shares: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  treasuryReserve: {
    type: Number,
    default: 0 // 5% reservado para tesouro
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
dividendSchema.index({ countryId: 1, distributionDate: -1 });
dividendSchema.index({ 'distributions.userId': 1, distributionDate: -1 });

export default mongoose.model('Dividend', dividendSchema);

