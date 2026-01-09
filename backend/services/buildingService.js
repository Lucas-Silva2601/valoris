import Building from '../models/Building.js';
import Wallet from '../models/Wallet.js';
import { subtractBalance } from './walletService.js';
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

  // Garantir que o usuário tenha carteira
  const { getOrCreateWallet } = await import('./walletService.js');
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < cost) {
    throw new Error(`Saldo insuficiente. Você tem ${wallet.balance.toFixed(2)} VAL, mas precisa de ${cost} VAL`);
  }

  // Verificar se já existe edifício muito próximo (evitar sobreposição)
  // Usar consulta geográfica MongoDB
  const nearbyBuildings = await Building.find({
    position: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: 100 // 100 metros de distância mínima
      }
    }
  });

  if (nearbyBuildings.length > 0) {
    throw new Error('Já existe um edifício muito próximo desta localização (distância mínima: 100m)');
  }

  // Criar edifício
  const buildingId = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const building = new Building({
    buildingId,
    ownerId: userId,
    countryId: finalCountryId,
    countryName: finalCountryName,
    type,
    position: { lat, lng },
    level,
    cost
  });

  await building.save();

  // Subtrair saldo
  await subtractBalance(
    userId,
    cost,
    `Construção de ${building.name} em ${finalCountryName}`,
    { buildingId, countryId: finalCountryId, type }
  );

  logger.info(`🏗️ Edifício construído: ${building.name} (${type}) nível ${level} em ${finalCountryName} (${finalCountryId}) por usuário ${userId}`);

  // Criar 10 NPCs construtores que vão para o local da construção
  const npcService = await import('./npcService.js');
  try {
    const constructorsCreated = await npcService.createConstructionNPCs(building, 10);
    logger.info(`👷 Criados ${constructorsCreated} NPCs construtores para ${building.name}`);
  } catch (error) {
    logger.error(`Erro ao criar NPCs construtores:`, error);
  }

  return building;
};

/**
 * Obter edifícios de um país
 */
export const getBuildingsByCountry = async (countryId) => {
  return await Building.find({ countryId })
    .populate('ownerId', 'username')
    .populate('npcs', 'npcId name position status')
    .sort({ createdAt: -1 });
};

/**
 * Obter edifícios de um usuário
 */
export const getUserBuildings = async (userId, countryId = null) => {
  const query = { ownerId: userId };
  if (countryId) {
    query.countryId = countryId;
  }
  return await Building.find(query)
    .populate('npcs', 'npcId name position status')
    .sort({ createdAt: -1 });
};

/**
 * Melhorar edifício
 */
export const upgradeBuilding = async (userId, buildingId) => {
  const building = await Building.findOne({ buildingId, ownerId: userId });

  if (!building) {
    throw new Error('Edifício não encontrado ou você não é o proprietário');
  }

  if (building.level >= 10) {
    throw new Error('Edifício já está no nível máximo');
  }

  const upgradeCost = calculateBuildingCost(building.type, building.level + 1) - building.cost;

  // Verificar saldo
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < upgradeCost) {
    throw new Error(`Saldo insuficiente. Necessário: ${upgradeCost} VAL`);
  }

  // Subtrair saldo
  await subtractBalance(
    userId,
    upgradeCost,
    `Melhoria de ${building.name} (nível ${building.level} → ${building.level + 1})`,
    { buildingId, countryId: building.countryId }
  );

  // Atualizar nível
  building.level += 1;
  building.cost += upgradeCost;
  await building.save();

  logger.info(`⬆️ Edifício melhorado: ${building.name} para nível ${building.level}`);

  return building;
};

/**
 * Demolir edifício
 */
export const demolishBuilding = async (userId, buildingId) => {
  const building = await Building.findOne({ buildingId, ownerId: userId });

  if (!building) {
    throw new Error('Edifício não encontrado ou você não é o proprietário');
  }

  // Remover NPCs associados (eles encontrarão novos lugares)
  const NPC = (await import('../models/NPC.js')).default;
  await NPC.updateMany(
    { $or: [{ homeBuilding: building._id }, { workBuilding: building._id }] },
    { 
      $unset: { 
        homeBuilding: building.type === 'house' || building.type === 'apartment' ? 1 : 0,
        workBuilding: building.type !== 'house' && building.type !== 'apartment' ? 1 : 0
      }
    }
  );

  await building.deleteOne();

  logger.info(`🗑️ Edifício demolido: ${building.name} por usuário ${userId}`);

  return { success: true, message: 'Edifício demolido com sucesso' };
};

