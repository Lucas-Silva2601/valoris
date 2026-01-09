import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { addPagination, selectFields, cachedQuery, clearCache } from '../../utils/queryOptimizer.js';

describe('Query Optimizer', () => {
  describe('addPagination', () => {
    it('deve adicionar skip e limit corretos', () => {
      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis()
      };

      addPagination(mockQuery, 2, 20);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
    });

    it('deve usar valores padrão', () => {
      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis()
      };

      addPagination(mockQuery);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('selectFields', () => {
    it('deve criar projeção correta', () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis()
      };

      selectFields(mockQuery, ['name', 'email']);

      expect(mockQuery.select).toHaveBeenCalledWith({
        name: 1,
        email: 1
      });
    });
  });

  describe('cachedQuery', () => {
    beforeEach(() => {
      clearCache();
    });

    it('deve retornar dados do cache quando disponível', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

      const result1 = await cachedQuery('test-key', queryFn);
      const result2 = await cachedQuery('test-key', queryFn);

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test' });
      expect(result2).toEqual({ data: 'test' });
    });

    it('deve executar query quando cache expira', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

      await cachedQuery('test-key', queryFn, 100);
      
      // Esperar cache expirar
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await cachedQuery('test-key', queryFn, 100);

      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });
});

