/**
 * ✅ FASE 18.7: Monitor de Performance
 * Rastreia tempos de carregamento e uso de memória
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      geoJsonLoads: [],
      mapInteractions: [],
      memoryUsage: []
    };
    this.startTimes = new Map();
  }

  /**
   * Iniciar medição
   */
  start(label) {
    this.startTimes.set(label, {
      startTime: performance.now(),
      startMemory: performance.memory ? performance.memory.usedJSHeapSize : null
    });
  }

  /**
   * Finalizar medição
   */
  end(label) {
    const start = this.startTimes.get(label);
    if (!start) {
      console.warn(`⚠️ Medição ${label} não foi iniciada`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - start.startTime;
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
    const memoryDelta = endMemory && start.startMemory ? endMemory - start.startMemory : null;

    const metric = {
      label,
      duration,
      memoryDelta,
      timestamp: Date.now()
    };

    // Armazenar métrica baseada no tipo
    if (label.includes('geoJson') || label.includes('GeoJSON')) {
      this.metrics.geoJsonLoads.push(metric);
      // Manter apenas últimas 50 medições
      if (this.metrics.geoJsonLoads.length > 50) {
        this.metrics.geoJsonLoads.shift();
      }
    } else if (label.includes('map') || label.includes('click')) {
      this.metrics.mapInteractions.push(metric);
      if (this.metrics.mapInteractions.length > 50) {
        this.metrics.mapInteractions.shift();
      }
    }

    // Log se for lento
    if (duration > 1000) {
      console.warn(`⚠️ Operação ${label} demorou ${duration.toFixed(2)}ms`);
    } else {
      console.debug(`✅ ${label}: ${duration.toFixed(2)}ms`);
    }

    this.startTimes.delete(label);
    return metric;
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    const avgGeoJson = this.metrics.geoJsonLoads.length > 0
      ? this.metrics.geoJsonLoads.reduce((sum, m) => sum + m.duration, 0) / this.metrics.geoJsonLoads.length
      : 0;

    const avgMapInteraction = this.metrics.mapInteractions.length > 0
      ? this.metrics.mapInteractions.reduce((sum, m) => sum + m.duration, 0) / this.metrics.mapInteractions.length
      : 0;

    return {
      geoJsonLoads: {
        count: this.metrics.geoJsonLoads.length,
        avgDuration: avgGeoJson,
        lastDuration: this.metrics.geoJsonLoads.length > 0 ? this.metrics.geoJsonLoads[this.metrics.geoJsonLoads.length - 1].duration : null
      },
      mapInteractions: {
        count: this.metrics.mapInteractions.length,
        avgDuration: avgMapInteraction,
        lastDuration: this.metrics.mapInteractions.length > 0 ? this.metrics.mapInteractions[this.metrics.mapInteractions.length - 1].duration : null
      },
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Limpar métricas antigas
   */
  clear() {
    this.metrics = {
      geoJsonLoads: [],
      mapInteractions: [],
      memoryUsage: []
    };
    this.startTimes.clear();
  }
}

// Singleton
export const performanceMonitor = new PerformanceMonitor();

