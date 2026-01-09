import { describe, it, expect } from '@jest/globals';
import {
  getMinimumSharePrice,
  getRepairCost,
  calculateBaseDefensePower,
  calculateCombatDamage,
  validateOwnershipTransfer,
  getControlThreshold,
  validateMissionCreation
} from '../../utils/businessRules.js';

describe('Business Rules', () => {
  describe('getMinimumSharePrice', () => {
    it('deve calcular preço base corretamente', () => {
      const price = getMinimumSharePrice(0, 0);
      expect(price).toBeGreaterThanOrEqual(1000);
    });

    it('deve aumentar preço com investimento', () => {
      const price1 = getMinimumSharePrice(50000, 50);
      const price2 = getMinimumSharePrice(100000, 50);
      expect(price2).toBeGreaterThan(price1);
    });

    it('deve aumentar preço com escassez de ações', () => {
      const price1 = getMinimumSharePrice(50000, 80);
      const price2 = getMinimumSharePrice(50000, 20);
      expect(price2).toBeGreaterThan(price1);
    });
  });

  describe('getRepairCost', () => {
    it('deve calcular custo de reparo corretamente', () => {
      expect(getRepairCost(10)).toBe(100);
      expect(getRepairCost(50)).toBe(500);
      expect(getRepairCost(0)).toBe(0);
    });
  });

  describe('calculateBaseDefensePower', () => {
    it('deve calcular poder de defesa base', () => {
      const power = calculateBaseDefensePower(5, 3, 4, 5000);
      expect(power).toBeGreaterThan(0);
      expect(typeof power).toBe('number');
    });

    it('deve aumentar com nível de defesa', () => {
      const power1 = calculateBaseDefensePower(1, 1, 1, 0);
      const power2 = calculateBaseDefensePower(10, 1, 1, 0);
      expect(power2).toBeGreaterThan(power1);
    });

    it('deve considerar bônus do tesouro', () => {
      const power1 = calculateBaseDefensePower(5, 5, 5, 0);
      const power2 = calculateBaseDefensePower(5, 5, 5, 20000);
      expect(power2).toBeGreaterThan(power1);
    });
  });

  describe('calculateCombatDamage', () => {
    it('deve calcular dano de combate', () => {
      const damage = calculateCombatDamage(100, 50, 'tank', 'land');
      expect(damage).toBeGreaterThan(0);
      expect(typeof damage).toBe('number');
    });

    it('deve reduzir dano com defesa maior', () => {
      const damage1 = calculateCombatDamage(100, 10, 'tank', 'land');
      const damage2 = calculateCombatDamage(100, 100, 'tank', 'land');
      expect(damage2).toBeLessThan(damage1);
    });
  });

  describe('validateOwnershipTransfer', () => {
    it('deve validar transferência de propriedade', () => {
      const ownership = {
        shareholders: [
          { userId: 'user1', shares: 30 },
          { userId: 'user2', shares: 20 }
        ]
      };

      const result1 = validateOwnershipTransfer(ownership, 'user1');
      expect(result1.valid).toBe(true);

      const result2 = validateOwnershipTransfer(ownership, 'user3');
      expect(result2.valid).toBe(false);
    });

    it('deve rejeitar se não houver acionistas', () => {
      const ownership = { shareholders: [] };
      const result = validateOwnershipTransfer(ownership, 'user1');
      expect(result.valid).toBe(false);
    });
  });

  describe('getControlThreshold', () => {
    it('deve retornar 51%', () => {
      expect(getControlThreshold()).toBe(51);
    });
  });

  describe('validateMissionCreation', () => {
    it('deve validar criação de missão por investidor', () => {
      const result = validateMissionCreation('investor', 500);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar criação por operacional', () => {
      const result = validateMissionCreation('operational', 500);
      expect(result.valid).toBe(false);
    });

    it('deve validar recompensa dentro do range', () => {
      const result1 = validateMissionCreation('investor', 5);
      expect(result1.valid).toBe(false);

      const result2 = validateMissionCreation('investor', 15000);
      expect(result2.valid).toBe(false);

      const result3 = validateMissionCreation('investor', 500);
      expect(result3.valid).toBe(true);
    });
  });
});

