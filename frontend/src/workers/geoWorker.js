/**
 * ✅ FASE 19.2: Web Worker para cálculos geográficos com Turf.js
 * Evita que a UI congele durante cálculos de "ponto dentro do polígono"
 */

importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js');

// ✅ Cache de GeoJSON para evitar carregar várias vezes
let countriesGeoJSON = null;

/**
 * Processar mensagens do main thread
 */
self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'POINT_IN_POLYGON':
        handlePointInPolygon(data);
        break;
      
      case 'IDENTIFY_COUNTRY':
        handleIdentifyCountry(data);
        break;
      
      case 'LOAD_GEOJSON':
        handleLoadGeoJSON(data);
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
 * ✅ Verificar se um ponto está dentro de um polígono
 */
function handlePointInPolygon(data) {
  const { point, polygon } = data;
  
  if (!point || !polygon) {
    self.postMessage({
      success: false,
      error: 'Ponto ou polígono não fornecido'
    });
    return;
  }

  try {
    const turfPoint = turf.point([point.lng, point.lat]);
    let isInside = false;

    if (polygon.type === 'Polygon') {
      const turfPolygon = turf.polygon(polygon.coordinates);
      isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
    } else if (polygon.type === 'MultiPolygon') {
      // Verificar cada polígono
      for (const coords of polygon.coordinates) {
        const turfPolygon = turf.polygon(coords);
        if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
          isInside = true;
          break;
        }
      }
    }

    self.postMessage({
      success: true,
      result: isInside
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
}

/**
 * ✅ Identificar país a partir de coordenadas
 */
function handleIdentifyCountry(data) {
  const { lat, lng, geoJSON } = data;
  
  if (!lat || !lng) {
    self.postMessage({
      success: false,
      error: 'Coordenadas não fornecidas'
    });
    return;
  }

  const geoData = geoJSON || countriesGeoJSON;
  
  if (!geoData || !geoData.features) {
    self.postMessage({
      success: false,
      error: 'GeoJSON não disponível'
    });
    return;
  }

  try {
    const point = turf.point([lng, lat]);
    
    // Procurar país que contém o ponto
    for (const feature of geoData.features) {
      if (!feature.geometry) continue;
      
      let polygon = null;
      let isInside = false;
      
      if (feature.geometry.type === 'Polygon') {
        polygon = turf.polygon(feature.geometry.coordinates);
        isInside = turf.booleanPointInPolygon(point, polygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          polygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, polygon)) {
            isInside = true;
            break;
          }
        }
      }
      
      if (isInside) {
        const props = feature.properties || {};
        const countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK';
        const countryName = props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido';
        
        self.postMessage({
          success: true,
          result: {
            valid: true,
            countryId,
            countryName,
            feature: feature
          }
        });
        return;
      }
    }
    
    // País não encontrado
    self.postMessage({
      success: true,
      result: {
        valid: false,
        countryId: 'UNK',
        countryName: 'Local Desconhecido'
      }
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
}

/**
 * ✅ Carregar GeoJSON no worker
 */
function handleLoadGeoJSON(data) {
  try {
    countriesGeoJSON = data.geoJSON;
    self.postMessage({
      success: true,
      message: `GeoJSON carregado: ${countriesGeoJSON.features?.length || 0} features`
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
}
