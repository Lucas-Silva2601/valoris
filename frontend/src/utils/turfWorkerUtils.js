/**
 * ✅ FASE 19.2: Utilitário para usar Web Worker com Turf.js
 * Evita que a UI congele durante cálculos geográficos pesados
 */

let worker = null;
let requestIdCounter = 0;
const pendingRequests = new Map();

/**
 * Inicializar Web Worker
 */
const initWorker = () => {
  if (worker) return worker;

  try {
    // Tentar criar worker usando import.meta.url
    worker = new Worker(
      new URL('../workers/turfWorker.js', import.meta.url),
      { type: 'module' }
    );

    worker.addEventListener('message', (event) => {
      const { id, error, ...result } = event.data;
      
      if (pendingRequests.has(id)) {
        const { resolve, reject } = pendingRequests.get(id);
        pendingRequests.delete(id);

        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      }
    });

    worker.addEventListener('error', (error) => {
      console.error('Erro no Web Worker:', error);
      // Se houver erro, limpar worker e usar fallback
      worker = null;
    });

    return worker;
  } catch (error) {
    console.warn('Não foi possível criar Web Worker, usando fallback síncrono:', error);
    return null;
  }
};

/**
 * Verificar se um ponto está dentro de um polígono (usando Web Worker se disponível)
 */
export const pointInPolygon = async (point, polygon) => {
  if (!polygon || !polygon.coordinates) {
    return false;
  }

  const w = initWorker();
  
  // Se não conseguir criar worker, usar fallback síncrono
  if (!w) {
    // Fallback: usar Turf.js diretamente (pode travar UI com muitos cálculos)
    const { default: turf } = await import('@turf/turf');
    const turfPoint = turf.point(point);
    const turfPolygon = turf.polygon(polygon.coordinates);
    return turf.booleanPointInPolygon(turfPoint, turfPolygon);
  }

  // Usar Web Worker
  return new Promise((resolve, reject) => {
    const id = ++requestIdCounter;
    
    pendingRequests.set(id, { resolve, reject });

    const type = polygon.type === 'MultiPolygon' ? 'pointInMultiPolygon' : 'pointInPolygon';
    
    w.postMessage({
      id,
      type,
      data: {
        point,
        polygon: type === 'pointInMultiPolygon' ? polygon : undefined,
        multiPolygon: type === 'pointInMultiPolygon' ? polygon : undefined
      }
    });

    // Timeout de 5 segundos
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Timeout ao calcular pointInPolygon'));
      }
    }, 5000);
  }).then(result => result.result);
};

/**
 * Identificar país a partir de um ponto (usando Web Worker)
 */
export const identifyCountryFromPoint = async (point, features) => {
  if (!features || features.length === 0) {
    return null;
  }

  const w = initWorker();
  
  // Se não conseguir criar worker, usar fallback síncrono
  if (!w) {
    // Fallback: usar Turf.js diretamente
    const { default: turf } = await import('@turf/turf');
    const turfPoint = turf.point(point);

    for (const feature of features) {
      if (!feature.geometry) continue;

      let pointInPolygon = false;

      if (feature.geometry.type === 'Polygon') {
        const turfPolygon = turf.polygon(feature.geometry.coordinates);
        pointInPolygon = turf.booleanPointInPolygon(turfPoint, turfPolygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const turfPolygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
            pointInPolygon = true;
            break;
          }
        }
      }

      if (pointInPolygon) {
        return feature;
      }
    }

    return null;
  }

  // Usar Web Worker
  return new Promise((resolve, reject) => {
    const id = ++requestIdCounter;
    
    pendingRequests.set(id, { resolve, reject });

    w.postMessage({
      id,
      type: 'identifyCountryFromPoint',
      data: { point, features }
    });

    // Timeout de 10 segundos (pode ser mais lento com muitos países)
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Timeout ao identificar país'));
      }
    }, 10000);
  }).then(result => result.result);
};

/**
 * Limpar worker (útil para testes ou cleanup)
 */
export const cleanupWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
};

