/**
 * ✅ FASE 19.2: Web Worker para cálculos geográficos com Turf.js
 * Move cálculos pesados para thread separada, evitando congelamento da UI
 */

// Importar Turf.js via CDN (ou pode usar importScripts se estiver no mesmo domínio)
importScripts('https://unpkg.com/@turf/turf@6.5.0/turf.min.js');

// Mensagens que o worker pode receber
self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'pointInPolygon':
        handlePointInPolygon(data);
        break;
      
      case 'pointInMultiPolygon':
        handlePointInMultiPolygon(data);
        break;
      
      case 'distance':
        handleDistance(data);
        break;
      
      case 'bbox':
        handleBbox(data);
        break;
      
      case 'centroid':
        handleCentroid(data);
        break;
      
      default:
        self.postMessage({
          success: false,
          error: `Tipo de operação desconhecido: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Verificar se um ponto está dentro de um polígono
 */
function handlePointInPolygon(data) {
  const { point, polygon } = data;
  
  const turfPoint = turf.point([point.lng, point.lat]);
  const turfPolygon = turf.polygon(polygon.coordinates);
  
  const isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
  
  self.postMessage({
    success: true,
    type: 'pointInPolygon',
    result: isInside
  });
}

/**
 * Verificar se um ponto está dentro de um MultiPolygon
 */
function handlePointInMultiPolygon(data) {
  const { point, multiPolygon } = data;
  
  const turfPoint = turf.point([point.lng, point.lat]);
  let isInside = false;
  
  // Verificar cada polígono do MultiPolygon
  for (const coordinates of multiPolygon.coordinates) {
    const turfPolygon = turf.polygon(coordinates);
    if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
      isInside = true;
      break;
    }
  }
  
  self.postMessage({
    success: true,
    type: 'pointInMultiPolygon',
    result: isInside
  });
}

/**
 * Calcular distância entre dois pontos
 */
function handleDistance(data) {
  const { point1, point2, units = 'kilometers' } = data;
  
  const turfPoint1 = turf.point([point1.lng, point1.lat]);
  const turfPoint2 = turf.point([point2.lng, point2.lat]);
  
  const distance = turf.distance(turfPoint1, turfPoint2, { units });
  
  self.postMessage({
    success: true,
    type: 'distance',
    result: distance
  });
}

/**
 * Calcular bounding box de um polígono
 */
function handleBbox(data) {
  const { geometry } = data;
  
  let turfFeature;
  if (geometry.type === 'Polygon') {
    turfFeature = turf.polygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    turfFeature = turf.multiPolygon(geometry.coordinates);
  } else {
    throw new Error(`Tipo de geometria não suportado: ${geometry.type}`);
  }
  
  const bbox = turf.bbox(turfFeature);
  
  self.postMessage({
    success: true,
    type: 'bbox',
    result: bbox // [minLng, minLat, maxLng, maxLat]
  });
}

/**
 * Calcular centroide de um polígono
 */
function handleCentroid(data) {
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
  
  self.postMessage({
    success: true,
    type: 'centroid',
    result: {
      lat: centroid.geometry.coordinates[1],
      lng: centroid.geometry.coordinates[0]
    }
  });
}
