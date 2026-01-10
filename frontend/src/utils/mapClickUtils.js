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
    console.warn('⚠️ Dados insuficientes para identificar país:', { latlng, hasFeatures: !!countriesData?.features });
    return {
      countryId: 'UNK',
      countryName: 'Local Desconhecido',
      valid: false
    };
  }

  const point = turf.point([latlng.lng, latlng.lat]);
  let foundFeature = null;
  let foundPolygon = null;

  // Procurar país que contém o ponto
  for (const feature of countriesData.features) {
    if (!feature.geometry) continue;

    let polygon = null;
    let pointInPolygon = false;

    try {
      if (feature.geometry.type === 'Polygon') {
        polygon = turf.polygon(feature.geometry.coordinates);
        pointInPolygon = turf.booleanPointInPolygon(point, polygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        // Para MultiPolygon, verificar cada polígono
        for (const coords of feature.geometry.coordinates) {
          try {
            polygon = turf.polygon(coords);
            if (turf.booleanPointInPolygon(point, polygon)) {
              pointInPolygon = true;
              break;
            }
          } catch (err) {
            console.warn('Erro ao processar polígono MultiPolygon:', err);
            continue;
          }
        }
      }

      if (pointInPolygon && polygon) {
        foundFeature = feature;
        foundPolygon = polygon;
        break; // Encontrou o país, parar busca
      }
    } catch (error) {
      console.warn('Erro ao verificar polígono:', error);
      continue;
    }
  }

  // Se encontrou um país
  if (foundFeature) {
    // ✅ Extrair informações do país usando as funções utilitárias
    let countryId = getCountryId(foundFeature);
    const countryName = getCountryName(foundFeature);

    // ✅ MELHORIA: Se getCountryId retornar null, tentar extrair diretamente das propriedades
    if (!countryId || countryId === 'UNK' || countryId.trim().length === 0) {
      const props = foundFeature.properties || {};
      // Tentar todas as possíveis propriedades de código ISO
      countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || props.GU_A3 || null;
      
      if (countryId) {
        countryId = countryId.toString().trim().toUpperCase();
        // Se for código de 2 letras, tentar expandir
        if (countryId.length === 2) {
          // Manter como está, mas garantir que seja válido
          countryId = countryId + 'X'; // Adicionar X para padronizar
        }
      }
    }

    // ✅ Log detalhado para debug
    console.log('🌍 País identificado:', {
      countryId,
      countryName,
      coordenadas: { lat: latlng.lat, lng: latlng.lng },
      properties: foundFeature.properties,
      iso_a3: foundFeature.properties?.ISO_A3,
      adm0_a3: foundFeature.properties?.ADM0_A3,
      iso3: foundFeature.properties?.ISO3,
      gu_a3: foundFeature.properties?.GU_A3
    });

    // ✅ Aceitar qualquer ID válido (não apenas se não for UNK)
    if (countryId && countryId.trim().length > 0 && countryId !== 'UNK' && countryId !== 'XXX') {
      return {
        countryId: countryId.trim().toUpperCase(), // Garantir maiúsculas
        countryName: countryName || 'País Desconhecido',
        valid: true,
        feature: foundFeature
      };
    } else {
      console.warn('⚠️ País encontrado mas ID inválido:', {
        countryId,
        countryName,
        properties: foundFeature.properties
      });
    }
  } else {
    console.warn('⚠️ Nenhum país encontrado para coordenadas:', { lat: latlng.lat, lng: latlng.lng });
  }

  // Se não encontrou país, retornar inválido
  return {
    countryId: 'UNK',
    countryName: 'Local Desconhecido',
    valid: false
  };
};

