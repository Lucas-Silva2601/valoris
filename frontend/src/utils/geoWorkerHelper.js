/**
 * ✅ FASE 19.2: Helper para usar Web Worker de geografia
 */

let worker = null;
let requestIdCounter = 0;
const pendingRequests = new Map();

/**
 * Inicializar worker
 */
export const initGeoWorker = () => {
  if (typeof Worker !== 'undefined' && !worker) {
    try {
      worker = new Worker(new URL('../workers/geoWorker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        const { success, result, error, type, requestId } = e.data;
        
        const resolver = pendingRequests.get(requestId);
        if (resolver) {
          pendingRequests.delete(requestId);
          if (success) {
            resolver.resolve({ success: true, result, type });
          } else {
            resolver.reject(new Error(error || 'Erro no worker'));
          }
        }
      };
      
      worker.onerror = (error) => {
        console.error('Erro no Web Worker de geografia:', error);
        // Rejeitar todas as requisições pendentes
        pendingRequests.forEach((resolver) => {
          resolver.reject(error);
        });
        pendingRequests.clear();
      };
    } catch (error) {
      console.warn('Não foi possível inicializar Web Worker, usando fallback síncrono:', error);
      worker = null;
    }
  }
  
  return worker !== null;
};

/**
 * Verificar se ponto está dentro de polígono (assíncrono via Worker)
 */
export const pointInPolygonAsync = (point, polygon) => {
  return new Promise(async (resolve, reject) => {
    if (!worker) {
      // Fallback síncrono se worker não estiver disponível
      try {
        const turf = await import('@turf/turf');
        const turfPoint = turf.point(point);
        const turfPolygon = polygon.type === 'Polygon' 
          ? turf.polygon(polygon.coordinates)
          : turf.polygon(polygon.coordinates[0]);
        const result = turf.booleanPointInPolygon(turfPoint, turfPolygon);
        resolve({ success: true, result });
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    const requestId = ++requestIdCounter;
    pendingRequests.set(requestId, { resolve, reject });
    
    worker.postMessage({
      type: 'pointInPolygon',
      data: {
        point,
        polygon,
        requestId
      }
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout no Web Worker'));
      }
    }, 5000);
  });
};

/**
 * Identificar país de um ponto (assíncrono via Worker)
 */
export const identifyCountryAsync = (point, features) => {
  return new Promise(async (resolve, reject) => {
    if (!worker) {
      // Fallback síncrono
      try {
        const turf = await import('@turf/turf');
        const turfPoint = turf.point(point);
        
        for (const feature of features) {
          if (!feature.geometry) continue;
          
          let isInside = false;
          if (feature.geometry.type === 'Polygon') {
            const poly = turf.polygon(feature.geometry.coordinates);
            isInside = turf.booleanPointInPolygon(turfPoint, poly);
          } else if (feature.geometry.type === 'MultiPolygon') {
            for (const coords of feature.geometry.coordinates) {
              const poly = turf.polygon(coords);
              if (turf.booleanPointInPolygon(turfPoint, poly)) {
                isInside = true;
                break;
              }
            }
          }
          
          if (isInside) {
            const props = feature.properties || {};
            resolve({
              success: true,
              result: {
                countryId: props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK',
                countryName: props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido',
                feature
              }
            });
            return;
          }
        }
        
        resolve({ success: true, result: null });
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    const requestId = ++requestIdCounter;
    pendingRequests.set(requestId, { resolve, reject });
    
    worker.postMessage({
      type: 'identifyCountry',
      data: {
        point,
        features,
        requestId
      }
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout no Web Worker'));
      }
    }, 5000);
  });
};

/**
 * Limpar worker
 */
export const cleanupGeoWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
};

