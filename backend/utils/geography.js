// Utilitários geográficos para o backend
// Pode usar bibliotecas como Turf.js se necessário

/**
 * Valida se uma coordenada é válida
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Calcula distância entre dois pontos (fórmula de Haversine)
 * @param {number} lat1 - Latitude do primeiro ponto
 * @param {number} lng1 - Longitude do primeiro ponto
 * @param {number} lat2 - Latitude do segundo ponto
 * @param {number} lng2 - Longitude do segundo ponto
 * @returns {number} Distância em quilômetros
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Detecta em qual país um ponto está localizado (versão simplificada)
 * Nota: Para uso completo, seria necessário carregar dados GeoJSON
 */
export const detectCountryByCoordinates = (lat, lng, countriesGeoJSON) => {
  if (!countriesGeoJSON || !countriesGeoJSON.features) {
    return null;
  }

  // Implementação simplificada - em produção, usar Turf.js
  // Por enquanto, retorna null e será implementado quando necessário
  return null;
};

