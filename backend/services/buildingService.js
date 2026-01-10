import buildingRepository from '../repositories/buildingRepository.js';
import npcRepository from '../repositories/npcRepository.js';
import { subtractBalance } from './walletService.js';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('BuildingService');

// Cache para dados GeoJSON
let countriesGeoJSONCache = null;

/**
 * Carregar dados GeoJSON dos países
 */
const loadCountriesGeoJSON = () => {
  if (countriesGeoJSONCache) {
    return countriesGeoJSONCache;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (fs.existsSync(geoJsonPath)) {
      const data = fs.readFileSync(geoJsonPath, 'utf8');
      countriesGeoJSONCache = JSON.parse(data);
      logger.info(`✅ GeoJSON carregado: ${countriesGeoJSONCache.features?.length || 0} países`);
      return countriesGeoJSONCache;
    } else {
      logger.warn('⚠️  Arquivo GeoJSON não encontrado. Validação geográfica desabilitada.');
      return { type: 'FeatureCollection', features: [] };
    }
  } catch (error) {
    logger.error('Erro ao carregar GeoJSON:', error);
    return { type: 'FeatureCollection', features: [] };
  }
};

/**
 * Validar se um ponto está dentro de algum país (usando Turf.js)
 */
const validatePointInCountry = (lat, lng, countriesGeoJSON = null) => {
  const geoJSON = countriesGeoJSON || loadCountriesGeoJSON();
  
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    // Se não tiver GeoJSON, permitir construção (modo teste)
    logger.warn('⚠️  GeoJSON vazio. Validação geográfica desabilitada.');
    return { valid: true, countryId: 'UNK', countryName: 'Local Desconhecido' };
  }

  const point = turf.point([lng, lat]);
  
  // Verificar se o ponto está dentro de algum país
  for (const feature of geoJSON.features) {
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
      // Extrair informações do país
      const props = feature.properties || {};
      const countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK';
      const countryName = props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido';
      
      logger.info(`✅ Ponto validado: ${lat}, ${lng} está em ${countryName} (${countryId})`);
      return { valid: true, countryId, countryName, feature };
    }
  }
  
  // Se não encontrou país, retornar inválido
  logger.warn(`⚠️  Ponto ${lat}, ${lng} não está dentro de nenhum país conhecido`);
  return { valid: false, countryId: null, countryName: null };
};

// Custos base por tipo de edifício
const BUILDING_COSTS = {
  house: 1000,
  apartment: 5000,
  office: 10000,
  skyscraper: 50000,
  factory: 20000,
  mall: 30000
};

// Multiplicador de custo por nível
const LEVEL_COST_MULTIPLIER = 1.5;

/**
 * Calcular custo de construção
 */
export const calculateBuildingCost = (type, level = 1) => {
  const baseCost = BUILDING_COSTS[type] || 1000;
  return Math.round(baseCost * Math.pow(LEVEL_COST_MULTIPLIER, level - 1));
};

/**
 * Construir edifício
 */
export const buildBuilding = async (userId, countryId, countryName, type, lat, lng, level = 1, validateGeography = true) => {
  // Validar coordenadas
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordenadas inválidas. lat e lng devem ser números.');
  }

  if (lat < -90 || lat > 90) {
    throw new Error('Latitude inválida. Deve estar entre -90 e 90.');
  }

  if (lng < -180 || lng > 180) {
    throw new Error('Longitude inválida. Deve estar entre -180 e 180.');
  }

  // Validar tipo
  if (!BUILDING_COSTS[type]) {
    throw new Error('Tipo de edifício inválido');
  }

  // Validar geografia usando Turf.js (se habilitado)
  let finalCountryId = countryId;
  let finalCountryName = countryName;

  if (validateGeography) {
    const validation = validatePointInCountry(lat, lng);
    
    if (!validation.valid && validation.countryId) {
      // Se a validação falhou mas temos um countryId fornecido, usar ele
      logger.warn(`⚠️  Ponto não está em nenhum país conhecido, mas usando countryId fornecido: ${countryId}`);
    } else if (validation.valid) {
      // Usar o país identificado pela validação
      finalCountryId = validation.countryId || countryId || 'UNK';
      finalCountryName = validation.countryName || countryName || 'Local Desconhecido';
      logger.info(`✅ Construção validada geograficamente: ${finalCountryName} (${finalCountryId})`);
    }
  } else {
    // Se não validar geografia, usar valores fornecidos ou padrão
    finalCountryId = countryId || 'UNK';
    finalCountryName = countryName || 'Local Desconhecido';
    logger.info(`ℹ️  Construção sem validação geográfica: ${finalCountryName} (${finalCountryId})`);
  }

  // Calcular custo
  const cost = calculateBuildingCost(type, level);

  // ✅ Garantir que o usuário existe no banco (necessário para foreign key)
  const { ensureTestUserExists } = await import('../utils/userUtils.js');
  const ownerUUID = await ensureTestUserExists(userId);

  // Garantir que o usuário tenha carteira
  const { getOrCreateWallet } = await import('./walletService.js');
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < cost) {
    throw new Error(`Saldo insuficiente. Você tem ${wallet.balance.toFixed(2)} VAL, mas precisa de ${cost} VAL`);
  }

  // ✅ IMPORTANTE: Verificar edifícios próximos e ESPALHAR se necessário
  // Se já existirem edifícios no mesmo país, gerar posição ALEATÓRIA ESPALHADA
  if (checkConnection()) {
    const nearbyBuildings = await buildingRepository.findNearby(lng, lat, 5); // 5km de raio
    
    // ✅ Se houver edifícios próximos no MESMO país, gerar nova posição ALEATÓRIA ESPALHADA
    const buildingsInSameCountry = nearbyBuildings.filter(b => 
      (b.countryId === finalCountryId || b.country_id === finalCountryId)
    );
    
    if (buildingsInSameCountry.length > 0) {
      logger.info(`🏗️ Encontrados ${buildingsInSameCountry.length} edifícios próximos no país ${finalCountryName}. Gerando posição ESPALHADA...`);
      
      // ✅ Buscar feature do país no GeoJSON para gerar ponto aleatório
      const countriesGeoJSON = loadCountriesGeoJSON();
      let countryFeature = null;
      
      if (countriesGeoJSON && countriesGeoJSON.features) {
        for (const feature of countriesGeoJSON.features) {
          const props = feature.properties || {};
          const featureCountryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2;
          if (featureCountryId === finalCountryId) {
            countryFeature = feature;
            break;
          }
        }
      }
      
      // ✅ Gerar ponto aleatório ESPALHADO dentro do país (até 50 tentativas)
      if (countryFeature && countryFeature.geometry) {
        let newPosition = null;
        const bbox = turf.bbox(turf.feature(countryFeature.geometry));
        
        for (let attempt = 0; attempt < 50; attempt++) {
          // Gerar coordenada aleatória dentro do bounding box
          const randomLng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
          const randomLat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
          
          const point = turf.point([randomLng, randomLat]);
          
          // Verificar se está dentro do polígono
          let isInside = false;
          if (countryFeature.geometry.type === 'Polygon') {
            const poly = turf.polygon(countryFeature.geometry.coordinates);
            isInside = turf.booleanPointInPolygon(point, poly);
          } else if (countryFeature.geometry.type === 'MultiPolygon') {
            for (const coords of countryFeature.geometry.coordinates) {
              const poly = turf.polygon(coords);
              if (turf.booleanPointInPolygon(point, poly)) {
                isInside = true;
                break;
              }
            }
          }
          
          if (isInside) {
            // ✅ Verificar se a nova posição está longe o suficiente dos edifícios existentes
            const tooClose = buildingsInSameCountry.some(b => {
              const bLat = b.position?.lat || b.position_lat;
              const bLng = b.position?.lng || b.position_lng;
              if (!bLat || !bLng) return false;
              
              // Calcular distância (aproximada em km)
              const R = 6371; // Raio da Terra em km
              const dLat = (randomLat - bLat) * Math.PI / 180;
              const dLng = (randomLng - bLng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(bLat * Math.PI / 180) * Math.cos(randomLat * Math.PI / 180) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distanceKm = R * c;
              
              return distanceKm < 0.5; // Mínimo 500m de distância
            });
            
            if (!tooClose) {
              newPosition = { lat: randomLat, lng: randomLng };
              logger.info(`✅ Nova posição ESPALHADA gerada: ${randomLat.toFixed(4)}, ${randomLng.toFixed(4)} (tentativa ${attempt + 1})`);
              break;
            }
          }
        }
        
        if (newPosition) {
          lat = newPosition.lat;
          lng = newPosition.lng;
          logger.info(`🏗️ Posição ajustada para ESPALHAR construções: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          logger.warn(`⚠️ Não foi possível gerar posição espalhada após 50 tentativas. Usando posição original.`);
        }
      }
    }
    
    // ✅ Verificar se ainda há edifício muito próximo (100m) - se sim, erro
    const veryNearbyBuildings = await buildingRepository.findNearby(lng, lat, 0.1); // 100 metros
    if (veryNearbyBuildings.length > 0) {
      throw new Error('Já existe um edifício muito próximo desta localização (distância mínima: 100m). Tente construir em outra área do país.');
    }
  }

  // Criar edifício
  const buildingId = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const buildingData = {
    buildingId,
    ownerId: ownerUUID, // ✅ Usar UUID do usuário garantido
    countryId: finalCountryId,
    countryName: finalCountryName,
    type,
    position: { lat, lng },
    level,
    cost,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Level ${level}`,
    capacity: BUILDING_COSTS[type] / 100, // Capacidade baseada no custo
    revenuePerHour: BUILDING_COSTS[type] / 1000, // Receita baseada no custo
    condition: 100
  };

  const building = await buildingRepository.create(buildingData);

  // Subtrair saldo
  await subtractBalance(
    userId,
    cost,
    `Construção de ${building.name} em ${finalCountryName}`,
    { buildingId, countryId: finalCountryId, type }
  );

  logger.info(`🏗️ Edifício construído: ${buildingData.name} (${type}) nível ${level} em ${finalCountryName} (${finalCountryId}) por usuário ${userId}`);

  // Criar 10 NPCs construtores que vão para o local da construção
  try {
    const npcService = await import('./npcService.js');
    if (npcService.createConstructionNPCs) {
      const constructorsCreated = await npcService.createConstructionNPCs(building, 10);
      logger.info(`👷 Criados ${constructorsCreated} NPCs construtores para ${buildingData.name}`);
    }
  } catch (error) {
    logger.error(`Erro ao criar NPCs construtores:`, error);
  }

  return building;
};

/**
 * Obter edifícios de um país
 */
export const getBuildingsByCountry = async (countryId) => {
  if (!checkConnection()) {
    return [];
  }

  try {
    const buildings = await buildingRepository.findByCountryId(countryId);
    return buildings.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch (error) {
    logger.error('Erro ao obter edifícios do país:', error);
    return [];
  }
};

/**
 * Obter edifícios de um usuário
 * ✅ Converter userId para UUID válido e garantir que todos os edifícios tenham posição válida
 */
export const getUserBuildings = async (userId, countryId = null) => {
  if (!checkConnection()) {
    return [];
  }

  try {
    // ✅ Garantir que o usuário existe no banco (necessário para UUID válido)
    const { ensureTestUserExists } = await import('../utils/userUtils.js');
    const userUUID = await ensureTestUserExists(userId);
    
    // ✅ Buscar edifícios usando UUID válido
    let buildings = await buildingRepository.findByOwnerId(userUUID || userId);
    
    // ✅ Filtrar edifícios sem posição válida
    buildings = buildings.filter(building => {
      if (!building) return false;
      
      // ✅ Garantir que o edifício tem posição válida
      const position = building.position || { 
        lat: building.position_lat, 
        lng: building.position_lng 
      };
      
      if (!position || position.lat == null || position.lng == null ||
          isNaN(position.lat) || isNaN(position.lng) ||
          position.lat < -90 || position.lat > 90 ||
          position.lng < -180 || position.lng > 180) {
        logger.warn(`⚠️ Edifício ${building.buildingId || building.building_id} sem posição válida, removendo da lista`);
        return false;
      }
      
      // ✅ Garantir que position está no formato correto
      if (!building.position) {
        building.position = position;
      }
      
      return true;
    });
    
    // ✅ Filtrar por país se fornecido
    if (countryId) {
      buildings = buildings.filter(b => 
        (b.countryId && b.countryId === countryId) || 
        (b.country_id && b.country_id === countryId)
      );
    }
    
    // ✅ Ordenar por data de criação (mais recentes primeiro)
    buildings.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
    
    logger.info(`✅ ${buildings.length} edifícios válidos encontrados para usuário ${userId}`);
    
    return buildings;
  } catch (error) {
    logger.error('Erro ao obter edifícios do usuário:', error);
    return [];
  }
};

/**
 * Melhorar edifício
 */
export const upgradeBuilding = async (userId, buildingId) => {
  if (!checkConnection()) {
    throw new Error('Banco de dados não disponível');
  }

  const building = await buildingRepository.findByBuildingId(buildingId);

  if (!building || (building.ownerId !== userId && building.owner_id !== userId)) {
    throw new Error('Edifício não encontrado ou você não é o proprietário');
  }

  const currentLevel = building.level || 1;
  if (currentLevel >= 10) {
    throw new Error('Edifício já está no nível máximo');
  }

  const currentCost = building.cost || calculateBuildingCost(building.type, currentLevel);
  const newLevelCost = calculateBuildingCost(building.type, currentLevel + 1);
  const upgradeCost = newLevelCost - currentCost;

  // Verificar saldo
  const { getOrCreateWallet } = await import('./walletService.js');
  const wallet = await getOrCreateWallet(userId);
  if (!wallet || parseFloat(wallet.balance || 0) < upgradeCost) {
    throw new Error(`Saldo insuficiente. Necessário: ${upgradeCost} VAL`);
  }

  // Subtrair saldo
  await subtractBalance(
    userId,
    upgradeCost,
    `Melhoria de ${building.name || building.type} (nível ${currentLevel} → ${currentLevel + 1})`,
    { buildingId, countryId: building.countryId || building.country_id }
  );

  // Atualizar nível
  const updatedBuilding = await buildingRepository.update(building.id, {
    level: currentLevel + 1,
    cost: newLevelCost,
    name: `${building.type.charAt(0).toUpperCase() + building.type.slice(1)} Level ${currentLevel + 1}`
  });

  logger.info(`⬆️ Edifício melhorado: ${updatedBuilding.name} para nível ${updatedBuilding.level || currentLevel + 1}`);

  return updatedBuilding;
};

/**
 * Demolir edifício
 */
export const demolishBuilding = async (userId, buildingId) => {
  if (!checkConnection()) {
    throw new Error('Banco de dados não disponível');
  }

  const building = await buildingRepository.findByBuildingId(buildingId);

  if (!building || (building.ownerId !== userId && building.owner_id !== userId)) {
    throw new Error('Edifício não encontrado ou você não é o proprietário');
  }

  // Remover NPCs associados (eles encontrarão novos lugares)
  try {
    const npcs = await npcRepository.findAll();
    for (const npc of npcs) {
      const needsUpdate = (npc.homeBuilding === building.id || npc.workBuilding === building.id);
      if (needsUpdate) {
        const updateData = {};
        if (npc.homeBuilding === building.id && (building.type === 'house' || building.type === 'apartment')) {
          updateData.homeBuilding = null;
        }
        if (npc.workBuilding === building.id && building.type !== 'house' && building.type !== 'apartment') {
          updateData.workBuilding = null;
        }
        if (Object.keys(updateData).length > 0) {
          await npcRepository.updateByNpcId(npc.npcId, updateData);
        }
      }
    }
  } catch (error) {
    logger.warn('Erro ao atualizar NPCs associados ao edifício:', error);
  }

  await buildingRepository.delete(building.id);

  logger.info(`🗑️ Edifício demolido: ${building.name || building.type} por usuário ${userId}`);

  return { success: true, message: 'Edifício demolido com sucesso' };
};

