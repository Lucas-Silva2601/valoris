/**
 * ✅ FASE 19.2: Utilitário para usar Web Worker de geografia
 * Wrapper para facilitar uso do worker no código React
 */

let worker = null;
let requestIdCounter = 0;
const pendingRequests = new Map();

/**
 * Inicializar worker
 */
const initWorker = () => {
  if (typeof Worker === 'undefined') {
    console.warn('⚠️ Web Workers não suportados neste navegador');
    return null;
  }

  if (!worker) {
    try {
      // Tentar carregar worker do arquivo local
      worker = new Worker(new URL('../workers/geographyWorker.js', import.meta.url), { type: 'module' });
      
      worker.addEventListener('message', (event) => {
        const { type, result, error, requestId } = event.data;
        
        const pendingRequest = pendingRequests.get(requestId);
        if (pendingRequest) {
          if (error) {
            pendingRequest.reject(new Error(error));
          } else {
            pendingRequest.resolve(result);
          }
          pendingRequests.delete(requestId);
        }
      });
      
      worker.addEventListener('error', (error) => {
        console.error('Erro no Web Worker de geografia:', error);
        // Rejeitar todas as requisições pendentes
        for (const [requestId, pendingRequest] of pendingRequests.entries()) {
          pendingRequest.reject(error);
          pendingRequests.delete(requestId);
        }
      });
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Web Worker, usando cálculo direto:', error);
      return null;
    }
  }
  
  return worker;
};

/**
 * Verificar se ponto está dentro de um polígono (usando worker)
 */
export const pointInPolygon = async (point, polygon) => {
  const w = initWorker();
  
  if (!w) {
    // Fallback: usar cálculo direto se worker não disponível
    try {
      const turf = await import('@turf/turf');
      const turfPoint = turf.point([point.lng, point.lat]);
      const turfPolygon = turf.polygon(polygon.coordinates);
      return turf.booleanPointInPolygon(turfPoint, turfPolygon);
    } catch (error) {
      console.error('Erro ao calcular pointInPolygon (fallback):', error);
      return false;
    }
  }
  
  const requestId = ++requestIdCounter;
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    
    w.postMessage({
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
        reject(new Error('Timeout ao calcular pointInPolygon'));
      }
    }, 5000);
  });
};

/**
 * Identificar país a partir de coordenadas (usando worker)
 */
export const identifyCountry = async (point, countries) => {
  const w = initWorker();
  
  if (!w) {
    // Fallback: usar cálculo direto se worker não disponível
    try {
      const turf = await import('@turf/turf');
      const turfPoint = turf.point([point.lng, point.lat]);
      
      for (const country of countries) {
        if (!country.geometry) continue;
        
        let isInside = false;
        
        if (country.geometry.type === 'Polygon') {
          const turfPolygon = turf.polygon(country.geometry.coordinates);
          isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
        } else if (country.geometry.type === 'MultiPolygon') {
          for (const polygonCoords of country.geometry.coordinates) {
            const turfPolygon = turf.polygon(polygonCoords);
            if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
              isInside = true;
              break;
            }
          }
        }
        
        if (isInside) {
          return {
            id: country.properties?.ISO_A3 || country.properties?.ADM0_A3 || country.properties?.ISO3 || 'UNK',
            name: country.properties?.name || country.properties?.NAME || country.properties?.NAME_EN || 'País Desconhecido',
            properties: country.properties
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao identificar país (fallback):', error);
      return null;
    }
  }
  
  const requestId = ++requestIdCounter;
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    
    w.postMessage({
      type: 'identifyCountry',
      data: {
        point,
        countries,
        requestId
      }
    });
    
    // Timeout de 10 segundos
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout ao identificar país'));
      }
    }, 10000);
  });
};

/**
 * Limpar worker
 */
export const cleanupWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
};

