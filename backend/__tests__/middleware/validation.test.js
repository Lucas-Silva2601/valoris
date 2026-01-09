import { describe, it, expect, vi } from '@jest/globals';
import { validateRegister, validateBuyShares } from '../../middleware/validation.js';

describe('Validation Middleware', () => {
  describe('validateRegister', () => {
    it('deve validar dados de registro corretos', () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      validateRegister(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar username inválido', () => {
      const req = {
        body: {
          username: 'ab', // Muito curto
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

