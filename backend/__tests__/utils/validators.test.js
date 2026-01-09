import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateCoordinates,
  validateShares,
  validateUnitType,
  validateCountryId,
  validateAmount,
  sanitizeString,
  sanitizeNumber
} from '../../utils/validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('deve validar emails corretos', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('deve validar usernames corretos', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('abc')).toBe(true);
    });

    it('deve rejeitar usernames inválidos', () => {
      expect(validateUsername('ab')).toBe(false); // Muito curto
      expect(validateUsername('a'.repeat(21))).toBe(false); // Muito longo
      expect(validateUsername('user@name')).toBe(false); // Caracteres inválidos
    });
  });

  describe('validatePassword', () => {
    it('deve validar senhas com 6+ caracteres', () => {
      expect(validatePassword('senha123')).toBe(true);
      expect(validatePassword('123456')).toBe(true);
    });

    it('deve rejeitar senhas muito curtas', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('deve validar coordenadas corretas', () => {
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
    });

    it('deve rejeitar coordenadas inválidas', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
    });
  });

  describe('validateShares', () => {
    it('deve validar porcentagens de ações', () => {
      expect(validateShares(1)).toBe(true);
      expect(validateShares(50)).toBe(true);
      expect(validateShares(100)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(validateShares(0)).toBe(false);
      expect(validateShares(101)).toBe(false);
      expect(validateShares(-1)).toBe(false);
    });
  });

  describe('validateUnitType', () => {
    it('deve validar tipos de unidade', () => {
      expect(validateUnitType('tank')).toBe(true);
      expect(validateUnitType('ship')).toBe(true);
      expect(validateUnitType('plane')).toBe(true);
    });

    it('deve rejeitar tipos inválidos', () => {
      expect(validateUnitType('invalid')).toBe(false);
      expect(validateUnitType('soldier')).toBe(false);
    });
  });

  describe('validateCountryId', () => {
    it('deve validar IDs de país', () => {
      expect(validateCountryId('BRA')).toBe(true);
      expect(validateCountryId('USA')).toBe(true);
    });

    it('deve rejeitar IDs inválidos', () => {
      expect(validateCountryId('BR')).toBe(false);
      expect(validateCountryId('BRAZIL')).toBe(false);
      expect(validateCountryId('')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('deve validar valores monetários', () => {
      expect(validateAmount(0)).toBe(true);
      expect(validateAmount(1000)).toBe(true);
      expect(validateAmount(999999)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(validateAmount(-1)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('deve sanitizar strings', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<script>');
    });

    it('deve retornar string vazia para valores não-string', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('deve sanitizar números', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('45.67')).toBe(45.67);
    });

    it('deve retornar 0 para valores inválidos', () => {
      expect(sanitizeNumber('abc')).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
    });
  });
});

