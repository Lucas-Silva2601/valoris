import * as turf from '@turf/turf';

/**
 * Converte coordenadas Lat/Lng para pixels do mapa
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Nível de zoom
 * @returns {Object} Coordenadas em pixels {x, y}
 */
export const latLngToPixels = (lat, lng, zoom) => {
  const scale = Math.pow(2, zoom);
  const worldCoordinateX = (lng + 180) / 360;
  const worldCoordinateY = 
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2;
  
  return {
    x: worldCoordinateX * scale * 256,
    y: worldCoordinateY * scale * 256
  };
};

/**
 * Converte pixels do mapa para coordenadas Lat/Lng
 * @param {number} x - Coordenada X em pixels
 * @param {number} y - Coordenada Y em pixels
 * @param {number} zoom - Nível de zoom
 * @returns {Object} Coordenadas {lat, lng}
 */
export const pixelsToLatLng = (x, y, zoom) => {
  const scale = Math.pow(2, zoom);
  const worldCoordinateX = x / (scale * 256);
  const worldCoordinateY = y / (scale * 256);
  
  const lng = worldCoordinateX * 360 - 180;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * worldCoordinateY))) * 180 / Math.PI;
  
  return { lat, lng };
};

/**
 * Detecta em qual país um ponto (coordenada) está localizado
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} countriesGeoJSON - GeoJSON com todos os países
 * @returns {Object|null} Feature do país ou null se não encontrado
 */
export const detectCountryByCoordinates = (lat, lng, countriesGeoJSON) => {
  if (!countriesGeoJSON || !countriesGeoJSON.features) {
    return null;
  }

  const point = turf.point([lng, lat]);

  // Buscar país que contém o ponto
  for (const feature of countriesGeoJSON.features) {
    try {
      const polygon = turf.feature(feature.geometry);
      
      if (turf.booleanPointInPolygon(point, polygon)) {
        return feature;
      }
    } catch (error) {
      // Ignorar erros de geometria inválida
      continue;
    }
  }

  return null;
};

/**
 * Verifica se um ponto está dentro de um polígono
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} polygonFeature - Feature GeoJSON do polígono
 * @returns {boolean} True se o ponto está dentro do polígono
 */
export const isPointInPolygon = (lat, lng, polygonFeature) => {
  try {
    const point = turf.point([lng, lat]);
    const polygon = turf.feature(polygonFeature.geometry);
    return turf.booleanPointInPolygon(point, polygon);
  } catch (error) {
    console.error('Erro ao verificar ponto no polígono:', error);
    return false;
  }
};

/**
 * Calcula a distância entre dois pontos em quilômetros
 * @param {number} lat1 - Latitude do primeiro ponto
 * @param {number} lng1 - Longitude do primeiro ponto
 * @param {number} lat2 - Latitude do segundo ponto
 * @param {number} lng2 - Longitude do segundo ponto
 * @returns {number} Distância em quilômetros
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const from = turf.point([lng1, lat1]);
  const to = turf.point([lng2, lat2]);
  return turf.distance(from, to, { units: 'kilometers' });
};

/**
 * Calcula o centroide de um polígono
 * @param {Object} polygonFeature - Feature GeoJSON do polígono
 * @returns {Object} Coordenadas {lat, lng} do centroide
 */
export const getPolygonCentroid = (polygonFeature) => {
  try {
    const polygon = turf.feature(polygonFeature.geometry);
    const centroid = turf.centroid(polygon);
    return {
      lat: centroid.geometry.coordinates[1],
      lng: centroid.geometry.coordinates[0]
    };
  } catch (error) {
    console.error('Erro ao calcular centroide:', error);
    return null;
  }
};

/**
 * Calcula a área de um polígono em km²
 * @param {Object} polygonFeature - Feature GeoJSON do polígono
 * @returns {number} Área em quilômetros quadrados
 */
export const getPolygonArea = (polygonFeature) => {
  try {
    const polygon = turf.feature(polygonFeature.geometry);
    return turf.area(polygon) / 1000000; // Converter de m² para km²
  } catch (error) {
    console.error('Erro ao calcular área:', error);
    return 0;
  }
};

/**
 * Otimiza detecção de fronteiras usando bounding box primeiro
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} countriesGeoJSON - GeoJSON com todos os países
 * @returns {Object|null} Feature do país ou null
 */
export const detectCountryOptimized = (lat, lng, countriesGeoJSON) => {
  if (!countriesGeoJSON || !countriesGeoJSON.features) {
    return null;
  }

  const point = turf.point([lng, lat]);

  // Primeiro filtro: verificar bounding box
  const candidates = countriesGeoJSON.features.filter(feature => {
    try {
      const bbox = turf.bbox(feature);
      return (
        lng >= bbox[0] && lng <= bbox[2] &&
        lat >= bbox[1] && lat <= bbox[3]
      );
    } catch (error) {
      return false;
    }
  });

  // Segundo filtro: verificar se está realmente dentro do polígono
  for (const feature of candidates) {
    try {
      const polygon = turf.feature(feature.geometry);
      if (turf.booleanPointInPolygon(point, polygon)) {
        return feature;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

