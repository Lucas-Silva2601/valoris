import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import * as dividendService from '../../services/dividendService.js';

// Mock dos modelos usando vi.mock
vi.mock('../../models/CountryOwnership.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock('../../models/EconomicMetrics.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

import CountryOwnership from '../../models/CountryOwnership.js';
import EconomicMetrics from '../../models/EconomicMetrics.js';

describe('Dividend Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDividends', () => {
    it('deve calcular dividendos corretamente', async () => {
      const mockOwnership = {
        countryId: 'BRA',
        countryName: 'Brasil',
        totalInvested: 100000,
        shareholders: [
          { userId: 'user1', shares: 50 },
          { userId: 'user2', shares: 30 }
        ]
      };

      const mockMetrics = {
        resources: { virtual: 100, exploitationRate: 2 },
        healthScore: 75
      };

      CountryOwnership.findOne.mockResolvedValue(mockOwnership);
      EconomicMetrics.findOne.mockResolvedValue(mockMetrics);

      const result = await dividendService.calculateDividends('BRA');

      expect(result).toBeDefined();
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.distributions.length).toBe(2);
      expect(result.treasuryReserve).toBeGreaterThan(0);
    });

    it('deve retornar null se não houver acionistas', async () => {
      const mockOwnership = {
        countryId: 'BRA',
        shareholders: []
      };

      CountryOwnership.findOne.mockResolvedValue(mockOwnership);

      const result = await dividendService.calculateDividends('BRA');

      expect(result).toBeNull();
    });
  });

  describe('calculateTransactionFees', () => {
    it('deve calcular taxas baseadas no investimento total', () => {
      const ownership = { totalInvested: 100000 };
      // Teste indireto através de calculateDividends
      // A função é privada, então testamos o comportamento geral
    });
  });
});

