/**
 * ✅ FASE 19.2: Cliente para Web Worker de Turf.js
 * Facilita o uso do worker de cálculos geográficos
 */

class TurfWorkerClient {
  constructor() {
    this.worker = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.initWorker();
  }

  initWorker() {
    try {
      // Criar worker a partir do arquivo
      this.worker = new Worker(new URL('../workers/turfWorker.js', import.meta.url), { type: 'module' });
      
      this.worker.onmessage = (e) => {
        const { type, payload } = e.data;

        if (type === 'error') {
          console.error('Erro no Web Worker de Turf.js:', payload.message);
          return;
        }

        // Resolver promise pendente
        if (payload.requestId !== undefined) {
          const resolver = this.pendingRequests.get(payload.requestId);
          if (resolver) {
            resolver(payload);
            this.pendingRequests.delete(payload.requestId);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Erro no Web Worker de Turf.js:', error);
      };
    } catch (error) {
      console.warn('⚠️ Web Worker não disponível, usando cálculos na thread principal:', error);
      this.worker = null;
    }
  }

  /**
   * Verificar se um ponto está dentro de um polígono
   */
  async pointInPolygon(point, polygon) {
    if (!this.worker) {
      // Fallback: usar Turf.js diretamente na thread principal
      const turf = await import('@turf/turf');
      const turfPoint = turf.point([point[0], point[1]]);
      const turfPolygon = turf.polygon(polygon.coordinates);
      return turf.booleanPointInPolygon(turfPoint, turfPolygon);
    }

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;
      this.pendingRequests.set(requestId, (payload) => {
        resolve(payload.result);
      });

      // Timeout de 5 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout ao calcular pointInPolygon'));
        }
      }, 5000);

      this.worker.postMessage({
        type: 'pointInPolygon',
        payload: {
          point,
          polygon,
          requestId
        }
      });
    });
  }

  /**
   * Verificar múltiplos pontos em um polígono (batch)
   */
  async pointInPolygonBatch(points, polygon) {
    if (!this.worker) {
      // Fallback: usar Turf.js diretamente na thread principal
      const turf = await import('@turf/turf');
      const turfPolygon = turf.polygon(polygon.coordinates);
      return points.map(point => {
        const turfPoint = turf.point([point[0], point[1]]);
        return {
          point,
          result: turf.booleanPointInPolygon(turfPoint, turfPolygon)
        };
      });
    }

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;
      this.pendingRequests.set(requestId, (payload) => {
        resolve(payload.results);
      });

      // Timeout de 10 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout ao calcular pointInPolygonBatch'));
        }
      }, 10000);

      this.worker.postMessage({
        type: 'pointInPolygonBatch',
        payload: {
          points,
          polygon,
          requestId
        }
      });
    });
  }

  /**
   * Identificar país a partir de um ponto (usando features GeoJSON)
   */
  async identifyCountryFromPoint(point, features) {
    if (!this.worker) {
      // Fallback: usar Turf.js diretamente na thread principal
      const turf = await import('@turf/turf');
      const turfPoint = turf.point([point[0], point[1]]);
      
      for (const feature of features) {
        if (!feature.geometry) continue;
        
        let polygon = null;
        if (feature.geometry.type === 'Polygon') {
          polygon = turf.polygon(feature.geometry.coordinates);
        } else if (feature.geometry.type === 'MultiPolygon') {
          for (const coords of feature.geometry.coordinates) {
            polygon = turf.polygon(coords);
            if (turf.booleanPointInPolygon(turfPoint, polygon)) {
              break;
            }
          }
        }
        
        if (polygon && turf.booleanPointInPolygon(turfPoint, polygon)) {
          const props = feature.properties || {};
          return {
            valid: true,
            countryId: props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK',
            countryName: props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido',
            feature: feature
          };
        }
      }
      
      return {
        valid: false,
        countryId: null,
        countryName: null
      };
    }

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;
      this.pendingRequests.set(requestId, (payload) => {
        resolve(payload);
      });

      // Timeout de 10 segundos
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout ao identificar país'));
        }
      }, 10000);

      this.worker.postMessage({
        type: 'identifyCountryFromPoint',
        payload: {
          point,
          features,
          requestId
        }
      });
    });
  }

  /**
   * Destruir worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Singleton
export const turfWorkerClient = new TurfWorkerClient();

