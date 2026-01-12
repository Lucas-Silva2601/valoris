/**
 * ✅ FASE 18.7: Cache para cálculos de land_value e yield
 * Evita recalcular valores que não mudaram
 */

class CalculationCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos de TTL
  }

  /**
   * Gerar chave de cache
   */
  getKey(type, id, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${type}:${id}:${paramsStr}`;
  }

  /**
   * Obter valor do cache
   */
  get(type, id, params = {}) {
    const key = this.getKey(type, id, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Armazenar valor no cache
   */
  set(type, id, params = {}, value) {
    const key = this.getKey(type, id, params);
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidar cache de um tipo/ID específico
   */
  invalidate(type, id) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:${id}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton
export const calculationCache = new CalculationCache();

