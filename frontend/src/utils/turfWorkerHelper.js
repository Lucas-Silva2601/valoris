/**
 * ✅ FASE 19.2: Helper para usar Web Worker de Turf.js
 * Facilita comunicação entre main thread e worker
 */

let worker = null;
let requestIdCounter = 0;
const pendingRequests = new Map();

/**
 * Inicializar worker (lazy loading)
 */
function getWorker() {
  if (!worker && typeof Worker !== 'undefined') {
    try {
      // Criar worker a partir do arquivo
      worker = new Worker(new URL('../workers/turfWorker.js', import.meta.url), { type: 'module' });
      
      // Escutar mensagens do worker
      worker.onmessage = (e) => {
        const { success, result, error, requestId } = e.data;
        const { resolve, reject } = pendingRequests.get(requestId) || {};
        
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          
          if (success) {
            resolve(result);
          } else {
            reject(new Error(error));
          }
        }
      };

      // Tratar erros do worker
      worker.onerror = (error) => {
        console.error('Erro no Web Worker de Turf.js:', error);
        // Rejeitar todas as requisições pendentes
        pendingRequests.forEach(({ reject }, requestId) => {
          reject(error);
          pendingRequests.delete(requestId);
        });
      };
    } catch (error) {
      console.warn('⚠️ Web Worker não disponível, usando Turf.js diretamente:', error);
      return null;
    }
  }
  return worker;
}

/**
 * Executar cálculo no worker ou fallback direto
 */
async function executeInWorker(type, data) {
  const workerInstance = getWorker();
  
  // Se worker não disponível, usar Turf.js diretamente (fallback)
  if (!workerInstance) {
    const turf = await import('@turf/turf');
    return executeDirectly(turf, type, data);
  }

  return new Promise((resolve, reject) => {
    const requestId = ++requestIdCounter;
    
    // Armazenar callbacks
    pendingRequests.set(requestId, { resolve, reject });
    
    // Timeout de segurança (10 segundos)
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Timeout no Web Worker'));
      }
    }, 10000);
    
    // Enviar mensagem para worker
    workerInstance.postMessage({ type, data, requestId });
  });
}

/**
 * Executar cálculo diretamente (fallback quando worker não disponível)
 */
function executeDirectly(turf, type, data) {
  switch (type) {
    case 'pointInPolygon':
      const { point, polygon } = data;
      const turfPoint = turf.point(point);
      const turfPolygon = polygon.type === 'Polygon' 
        ? turf.polygon(polygon.coordinates)
        : turf.multiPolygon(polygon.coordinates);
      return turf.booleanPointInPolygon(turfPoint, turfPolygon);

    case 'pointInPolygons':
      const { point: testPoint, polygons } = data;
      const testTurfPoint = turf.point(testPoint);
      return polygons.find(feature => {
        if (!feature.geometry) return false;
        try {
          let poly = null;
          if (feature.geometry.type === 'Polygon') {
            poly = turf.polygon(feature.geometry.coordinates);
          } else if (feature.geometry.type === 'MultiPolygon') {
            poly = turf.multiPolygon(feature.geometry.coordinates);
          }
          if (poly) {
            return turf.booleanPointInPolygon(testTurfPoint, poly);
          }
        } catch (error) {
          return false;
        }
        return false;
      });

    case 'distance':
      const { point1, point2, units = 'kilometers' } = data;
      const p1 = turf.point(point1);
      const p2 = turf.point(point2);
      return turf.distance(p1, p2, { units });

    case 'bbox':
      const { geometry } = data;
      let feature = null;
      if (geometry.type === 'Polygon') {
        feature = turf.polygon(geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        feature = turf.multiPolygon(geometry.coordinates);
      }
      if (feature) {
        return turf.bbox(feature);
      }
      return null;

    case 'centroid':
      const { geometry: centroidGeometry } = data;
      let centroidFeature = null;
      if (centroidGeometry.type === 'Polygon') {
        centroidFeature = turf.polygon(centroidGeometry.coordinates);
      } else if (centroidGeometry.type === 'MultiPolygon') {
        centroidFeature = turf.multiPolygon(centroidGeometry.coordinates);
      }
      if (centroidFeature) {
        const centroid = turf.centroid(centroidFeature);
        return {
          lat: centroid.geometry.coordinates[1],
          lng: centroid.geometry.coordinates[0]
        };
      }
      return null;

    default:
      throw new Error(`Tipo de cálculo desconhecido: ${type}`);
  }
}

/**
 * Verificar se um ponto está dentro de um polígono
 */
export async function pointInPolygon(point, polygon) {
  return executeInWorker('pointInPolygon', { point, polygon });
}

/**
 * Verificar se um ponto está dentro de algum polígono de uma lista
 */
export async function pointInPolygons(point, polygons) {
  return executeInWorker('pointInPolygons', { point, polygons });
}

/**
 * Calcular distância entre dois pontos
 */
export async function distance(point1, point2, units = 'kilometers') {
  return executeInWorker('distance', { point1, point2, units });
}

/**
 * Calcular bounding box de um polígono
 */
export async function bbox(geometry) {
  return executeInWorker('bbox', { geometry });
}

/**
 * Calcular centroide de um polígono
 */
export async function centroid(geometry) {
  return executeInWorker('centroid', { geometry });
}

/**
 * Limpar recursos do worker
 */
export function cleanup() {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
}
