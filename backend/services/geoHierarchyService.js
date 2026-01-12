import * as turf from '@turf/turf';
import stateRepository from '../repositories/stateRepository.js';
import cityRepository from '../repositories/cityRepository.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('GeoHierarchyService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache para GeoJSON
let countriesGeoJSONCache = null;
const statesGeoJSONCache = new Map(); // Cache por país
const citiesGeoJSONCache = new Map(); // Cache por estado

/**
 * ✅ FASE 18.2: Carregar GeoJSON de países (já existe, reutilizando)
 */
const loadCountriesGeoJSON = () => {
  if (countriesGeoJSONCache) {
    return countriesGeoJSONCache;
  }

  try {
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    if (fs.existsSync(geoJsonPath)) {
      const data = fs.readFileSync(geoJsonPath, 'utf8');
      countriesGeoJSONCache = JSON.parse(data);
      return countriesGeoJSONCache;
    }
  } catch (error) {
    console.error('Erro ao carregar GeoJSON de países:', error);
  }
  
  return { type: 'FeatureCollection', features: [] };
};

/**
 * ✅ FASE 18.2: Carregar GeoJSON de estados de um país (LAZY LOADING)
 * Por enquanto retorna estados do banco de dados, mas pode ser expandido para arquivos
 */
export const loadStatesGeoJSON = async (countryId) => {
  // ✅ Validar countryId antes de processar
  if (!countryId || countryId === 'undefined' || countryId === 'null') {
    logger.warn(`⚠️  Tentativa de carregar estados com countryId inválido: ${countryId}`);
    return { type: 'FeatureCollection', features: [] };
  }

  // Verificar cache primeiro
  if (statesGeoJSONCache.has(countryId)) {
    logger.debug(`✅ Estados de ${countryId} carregados do cache`);
    return statesGeoJSONCache.get(countryId);
  }

  const startTime = Date.now();
  try {
    // Buscar estados do banco de dados
    const states = await stateRepository.findByCountryId(countryId);
    
    // Converter para formato GeoJSON
    const features = states.map(state => ({
      type: 'Feature',
      properties: {
        state_id: state.stateId,
        name: state.name,
        code: state.code,
        country_id: state.countryId,
        country_name: state.countryName
      },
      geometry: state.geometry || null
    }));

    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    // Armazenar no cache
    statesGeoJSONCache.set(countryId, geoJSON);
    const duration = Date.now() - startTime;
    logger.info(`✅ GeoJSON de estados carregado para ${countryId} em ${duration}ms (${states.length} estados)`);
    return geoJSON;
  } catch (error) {
    logger.error(`Erro ao carregar GeoJSON de estados para ${countryId}:`, error);
    return { type: 'FeatureCollection', features: [] };
  }
};

/**
 * ✅ FASE 18.2: Carregar GeoJSON de cidades de um estado (LAZY LOADING)
 */
export const loadCitiesGeoJSON = async (stateId) => {
  // ✅ Validar stateId antes de processar
  if (!stateId || stateId === 'undefined' || stateId === 'null') {
    logger.warn(`⚠️  Tentativa de carregar cidades com stateId inválido: ${stateId}`);
    return { type: 'FeatureCollection', features: [] };
  }

  // Verificar cache primeiro
  if (citiesGeoJSONCache.has(stateId)) {
    logger.debug(`✅ Cidades de ${stateId} carregadas do cache`);
    return citiesGeoJSONCache.get(stateId);
  }

  const startTime = Date.now();
  try {
    // Buscar cidades do banco de dados
    const cities = await cityRepository.findByStateId(stateId);
    
    // Converter para formato GeoJSON
    const features = cities.map(city => ({
      type: 'Feature',
      properties: {
        city_id: city.cityId,
        name: city.name,
        state_id: city.stateId,
        state_name: city.stateName,
        country_id: city.countryId,
        country_name: city.countryName,
        land_value: city.landValue,
        population: city.population
      },
      geometry: city.geometry || null
    }));

    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    // Armazenar no cache
    citiesGeoJSONCache.set(stateId, geoJSON);
    return geoJSON;
  } catch (error) {
    console.error(`Erro ao carregar GeoJSON de cidades para ${stateId}:`, error);
    return { type: 'FeatureCollection', features: [] };
  }
};

/**
 * ✅ FASE 18.2: Detecção hierárquica 3-nível (País > Estado > Cidade)
 * Identifica a hierarquia completa a partir de coordenadas
 */
export const identifyHierarchy = async (lat, lng) => {
  const countriesGeoJSON = loadCountriesGeoJSON();
  const point = turf.point([lng, lat]);

  // 1. Identificar País
  let country = null;
  for (const feature of countriesGeoJSON.features || []) {
    if (!feature.geometry) continue;

    let isInside = false;
    if (feature.geometry.type === 'Polygon') {
      const polygon = turf.polygon(feature.geometry.coordinates);
      isInside = turf.booleanPointInPolygon(point, polygon);
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const coords of feature.geometry.coordinates) {
        try {
          const polygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, polygon)) {
            isInside = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (isInside) {
      const countryId = feature.properties.ISO_A3 || 
                       feature.properties.ADM0_A3 || 
                       feature.properties.ISO_A2;
      const countryName = feature.properties.NAME || 
                         feature.properties.NAME_EN || 
                         feature.properties.ADMIN ||
                         'País Desconhecido';

      country = {
        id: countryId,
        name: countryName,
        feature: feature
      };
      break;
    }
  }

  if (!country) {
    return {
      valid: false,
      country: null,
      state: null,
      city: null,
      message: 'Coordenadas não estão dentro de nenhum país conhecido'
    };
  }

  // 2. Identificar Estado dentro do país
  let state = null;
  try {
    const statesGeoJSON = await loadStatesGeoJSON(country.id);
    
    for (const feature of statesGeoJSON.features || []) {
      if (!feature.geometry) continue;

      let isInside = false;
      if (feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        isInside = turf.booleanPointInPolygon(point, polygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          try {
            const polygon = turf.polygon(coords);
            if (turf.booleanPointInPolygon(point, polygon)) {
              isInside = true;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      if (isInside) {
        state = {
          id: feature.properties.state_id,
          name: feature.properties.name,
          code: feature.properties.code,
          countryId: feature.properties.country_id,
          feature: feature
        };
        break;
      }
    }
  } catch (error) {
    console.error('Erro ao identificar estado:', error);
  }

  // 3. Identificar Cidade dentro do estado (ou país, se não tiver estado)
  let city = null;
  if (state) {
    try {
      const citiesGeoJSON = await loadCitiesGeoJSON(state.id);
      
      for (const feature of citiesGeoJSON.features || []) {
        if (!feature.geometry) continue;

        let isInside = false;
        if (feature.geometry.type === 'Polygon') {
          const polygon = turf.polygon(feature.geometry.coordinates);
          isInside = turf.booleanPointInPolygon(point, polygon);
        } else if (feature.geometry.type === 'MultiPolygon') {
          for (const coords of feature.geometry.coordinates) {
            try {
              const polygon = turf.polygon(coords);
              if (turf.booleanPointInPolygon(point, polygon)) {
                isInside = true;
                break;
              }
            } catch (error) {
              continue;
            }
          }
        }

        if (isInside) {
          city = {
            id: feature.properties.city_id,
            name: feature.properties.name,
            stateId: feature.properties.state_id,
            countryId: feature.properties.country_id,
            landValue: feature.properties.land_value,
            population: feature.properties.population,
            feature: feature
          };
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao identificar cidade:', error);
    }
  }

  return {
    valid: true,
    country: country,
    state: state,
    city: city,
    coordinates: { lat, lng }
  };
};

/**
 * Limpar cache (útil para testes ou quando dados são atualizados)
 */
export const clearGeoJSONCache = () => {
  countriesGeoJSONCache = null;
  statesGeoJSONCache.clear();
  citiesGeoJSONCache.clear();
};

/**
 * Obter hierarquia completa de um ponto (wrapper para compatibilidade)
 */
export const getHierarchy = identifyHierarchy;

