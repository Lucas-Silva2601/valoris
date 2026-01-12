/**
 * ✅ FASE 19.2: Utilitário para usar Web Worker com Turf.js
 * Evita congelamento da UI durante cálculos geográficos pesados
 */

let worker = null;
let workerReady = false;
let pendingRequests = new Map();
let requestId = 0;

/**
 * Inicializar worker (lazy load)
 */
const initWorker = () => {
  if (worker) return worker;

  try {
    // Usar worker se disponível
    if (typeof Worker !== 'undefined') {
      worker = new Worker('/turf-worker.js');
      
      worker.onmessage = (e) => {
        const { requestId, success, result, error } = e.data;
        
        if (pendingRequests.has(requestId)) {
          const { resolve, reject } = pendingRequests.get(requestId);
          pendingRequests.delete(requestId);
          
          if (success) {
            resolve(result);
          } else {
            reject(new Error(error));
          }
        }
      };
      
      worker.onerror = (error) => {
        console.error('Erro no Turf Worker:', error);
        // Marcar worker como indisponível e usar fallback
        workerReady = false;
      };
      
      workerReady = true;
    }
  } catch (error) {
    console.warn('⚠️ Web Worker não disponível, usando fallback síncrono:', error);
    workerReady = false;
  }
  
  return worker;
};

/**
 * Executar operação no worker (ou fallback síncrono)
 */
const executeInWorker = async (type, data) => {
  return new Promise((resolve, reject) => {
    initWorker();
    
    // Se worker não estiver disponível, usar fallback
    if (!worker || !workerReady) {
      // Fallback síncrono (volta para main thread)
      try {
        const result = executeFallback(type, data);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    // Enviar para worker
    const currentRequestId = ++requestId;
    pendingRequests.set(currentRequestId, { resolve, reject });
    
    worker.postMessage({
      requestId: currentRequestId,
      type,
      data
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      if (pendingRequests.has(currentRequestId)) {
        pendingRequests.delete(currentRequestId);
        reject(new Error('Timeout no worker'));
      }
    }, 5000);
  });
};

/**
 * Fallback síncrono (usa Turf.js diretamente na main thread)
 */
const executeFallback = (type, data) => {
  // Importar Turf.js dinamicamente
  const turf = require('@turf/turf');
  
  switch (type) {
    case 'pointInPolygon': {
      const { point, polygon } = data;
      const turfPoint = turf.point([point.lng, point.lat]);
      const turfPolygon = turf.polygon(polygon.coordinates);
      return turf.booleanPointInPolygon(turfPoint, turfPolygon);
    }
    
    case 'pointInMultiPolygon': {
      const { point, multiPolygon } = data;
      const turfPoint = turf.point([point.lng, point.lat]);
      for (const coordinates of multiPolygon.coordinates) {
        const turfPolygon = turf.polygon(coordinates);
        if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
          return true;
        }
      }
      return false;
    }
    
    case 'distance': {
      const { point1, point2, units = 'kilometers' } = data;
      const turfPoint1 = turf.point([point1.lng, point1.lat]);
      const turfPoint2 = turf.point([point2.lng, point2.lat]);
      return turf.distance(turfPoint1, turfPoint2, { units });
    }
    
    case 'bbox': {
      const { geometry } = data;
      let turfFeature;
      if (geometry.type === 'Polygon') {
        turfFeature = turf.polygon(geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        turfFeature = turf.multiPolygon(geometry.coordinates);
      } else {
        throw new Error(`Tipo de geometria não suportado: ${geometry.type}`);
      }
      return turf.bbox(turfFeature);
    }
    
    case 'centroid': {
      const { geometry } = data;
      let turfFeature;
      if (geometry.type === 'Polygon') {
        turfFeature = turf.polygon(geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        turfFeature = turf.multiPolygon(geometry.coordinates);
      } else {
        throw new Error(`Tipo de geometria não suportado: ${geometry.type}`);
      }
      const centroid = turf.centroid(turfFeature);
      return {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0]
      };
    }
    
    default:
      throw new Error(`Tipo de operação desconhecido: ${type}`);
  }
};

/**
 * Verificar se um ponto está dentro de um polígono (assíncrono)
 */
export const pointInPolygon = async (point, polygon) => {
  return executeInWorker('pointInPolygon', { point, polygon });
};

/**
 * Verificar se um ponto está dentro de um MultiPolygon (assíncrono)
 */
export const pointInMultiPolygon = async (point, multiPolygon) => {
  return executeInWorker('pointInMultiPolygon', { point, multiPolygon });
};

/**
 * Calcular distância entre dois pontos (assíncrono)
 */
export const distance = async (point1, point2, units = 'kilometers') => {
  return executeInWorker('distance', { point1, point2, units });
};

/**
 * Calcular bounding box (assíncrono)
 */
export const bbox = async (geometry) => {
  return executeInWorker('bbox', { geometry });
};

/**
 * Calcular centroide (assíncrono)
 */
export const centroid = async (geometry) => {
  return executeInWorker('centroid', { geometry });
};

/**
 * Destruir worker (limpeza)
 */
export const destroyWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    workerReady = false;
    pendingRequests.clear();
  }
};

