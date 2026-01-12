/**
 * ✅ FASE 18.7: Cache Inteligente de GeoJSON no Frontend
 * Evita requisições repetidas e melhora performance
 */

class GeoJsonCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50; // Máximo de 50 itens no cache
    this.ttl = 5 * 60 * 1000; // 5 minutos de TTL
  }

  /**
   * Gerar chave de cache
   */
  getKey(type, id) {
    return `${type}:${id}`;
  }

  /**
   * Obter item do cache
   */
  get(type, id) {
    const key = this.getKey(type, id);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Armazenar item no cache
   */
  set(type, id, data) {
    const key = this.getKey(type, id);

    // Limpar cache se estiver cheio (LRU simples)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpar cache específico ou todo o cache
   */
  clear(type = null, id = null) {
    if (type && id) {
      const key = this.getKey(type, id);
      this.cache.delete(key);
    } else if (type) {
      // Limpar todos os itens de um tipo
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpar todo o cache
      this.cache.clear();
    }
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton
export const geoJsonCache = new GeoJsonCache();

