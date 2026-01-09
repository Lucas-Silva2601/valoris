import * as turf from '@turf/turf';
import { getCountryId, getCountryName } from './countryUtils';

/**
 * ✅ Identificar país a partir de coordenadas do clique no mapa Leaflet
 * Usa o GeoJSON carregado para encontrar qual país contém o ponto clicado
 * 
 * @param {Object} latlng - Objeto com lat e lng do clique
 * @param {Object} countriesData - GeoJSON com dados dos países
 * @returns {Object} - { countryId, countryName, valid }
 */
export const identifyCountryFromMapClick = (latlng, countriesData) => {
  if (!latlng || !countriesData || !countriesData.features) {
    return {
      countryId: 'UNK',
      countryName: 'Local Desconhecido',
      valid: false
    };
  }

  const point = turf.point([latlng.lng, latlng.lat]);

  // Procurar país que contém o ponto
  for (const feature of countriesData.features) {
    if (!feature.geometry) continue;

    let polygon = null;

    if (feature.geometry.type === 'Polygon') {
      polygon = turf.polygon(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Para MultiPolygon, verificar cada polígono
      for (const coords of feature.geometry.coordinates) {
        polygon = turf.polygon(coords);
        if (turf.booleanPointInPolygon(point, polygon)) {
          break;
        }
      }
    }

    if (polygon && turf.booleanPointInPolygon(point, polygon)) {
      // ✅ Extrair informações do país usando as funções utilitárias
      let countryId = getCountryId(feature);
      const countryName = getCountryName(feature);

      // ✅ MELHORIA: Se getCountryId retornar null, tentar extrair diretamente das propriedades
      if (!countryId || countryId === 'UNK' || countryId.trim().length === 0) {
        const props = feature.properties || {};
        // Tentar todas as possíveis propriedades de código ISO
        countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || null;
        
        if (countryId) {
          countryId = countryId.toString().trim().toUpperCase();
        }
      }

      // ✅ Log detalhado para debug (apenas se encontrar país)
      if (countryId && countryId !== 'UNK') {
        console.log('🌍 País identificado:', {
          countryId,
          countryName,
          properties: feature.properties,
          iso_a3: feature.properties?.ISO_A3,
          adm0_a3: feature.properties?.ADM0_A3,
          iso3: feature.properties?.ISO3
        });
      }

      // ✅ Aceitar qualquer ID válido (não apenas se não for UNK)
      if (countryId && countryId.trim().length > 0 && countryId !== 'UNK') {
        return {
          countryId: countryId.trim().toUpperCase(), // Garantir maiúsculas
          countryName,
          valid: true,
          feature
        };
      }
    }
  }

  // Se não encontrou país, retornar inválido
  return {
    countryId: 'UNK',
    countryName: 'Local Desconhecido',
    valid: false
  };
};

