/**
 * ✅ FASE 19.2: Web Worker para cálculos geográficos (Turf.js)
 * Evita que cálculos pesados congelem a UI
 */

// Carregar Turf.js no worker
importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js');

// Listener para mensagens do main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'pointInPolygon':
        handlePointInPolygon(data);
        break;
      
      case 'pointInMultiPolygon':
        handlePointInMultiPolygon(data);
        break;
      
      case 'identifyCountry':
        handleIdentifyCountry(data);
        break;
      
      default:
        self.postMessage({
          type: 'error',
          error: `Tipo de operação desconhecido: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Verificar se ponto está dentro de um polígono
 */
function handlePointInPolygon(data) {
  const { point, polygon } = data;
  
  try {
    const turfPoint = turf.point([point.lng, point.lat]);
    const turfPolygon = turf.polygon(polygon.coordinates);
    const isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
    
    self.postMessage({
      type: 'pointInPolygon',
      result: isInside,
      requestId: data.requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      requestId: data.requestId
    });
  }
}

/**
 * Verificar se ponto está dentro de um MultiPolygon
 */
function handlePointInMultiPolygon(data) {
  const { point, multiPolygon } = data;
  
  try {
    const turfPoint = turf.point([point.lng, point.lat]);
    let isInside = false;
    
    for (const polygonCoords of multiPolygon.coordinates) {
      const turfPolygon = turf.polygon(polygonCoords);
      if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
        isInside = true;
        break;
      }
    }
    
    self.postMessage({
      type: 'pointInMultiPolygon',
      result: isInside,
      requestId: data.requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      requestId: data.requestId
    });
  }
}

/**
 * Identificar país a partir de coordenadas
 */
function handleIdentifyCountry(data) {
  const { point, countries } = data;
  
  try {
    const turfPoint = turf.point([point.lng, point.lat]);
    let identifiedCountry = null;
    
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
        identifiedCountry = {
          id: country.properties?.ISO_A3 || country.properties?.ADM0_A3 || country.properties?.ISO3 || 'UNK',
          name: country.properties?.name || country.properties?.NAME || country.properties?.NAME_EN || 'País Desconhecido',
          properties: country.properties
        };
        break;
      }
    }
    
    self.postMessage({
      type: 'identifyCountry',
      result: identifiedCountry,
      requestId: data.requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      requestId: data.requestId
    });
  }
}

