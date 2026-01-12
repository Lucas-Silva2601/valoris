import buildingRepository from '../repositories/buildingRepository.js';
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
 * ✅ FASE 19.1: Protegido com tratamento de erros para nunca crashar o servidor
 */
export const buildBuilding = async (userId, countryId, countryName, type, lat, lng, level = 1, validateGeography = true) => {
  try {
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

  // ✅ FASE 19.3: Validar referências antes de criar edifício
  try {
    const { validateReferences } = await import('./transactionService.js');
    const validation = await validateReferences({
      userId,
      cityId: stateId ? null : null, // Será validado após identificar hierarquia
      stateId: stateId || null,
      countryId: finalCountryId
    });
    
    if (!validation.valid && validation.errors.length > 0) {
      logger.warn(`⚠️ Referências podem não existir ainda: ${validation.errors.join(', ')}`);
      // Não bloquear, mas logar aviso
    }
  } catch (validationError) {
    logger.warn(`⚠️ Erro ao validar referências (não crítico): ${validationError.message}`);
  }

  // ✅ Garantir que o usuário existe no banco (necessário para foreign key)
  const { ensureTestUserExists } = await import('../utils/userUtils.js');
  const ownerUUID = await ensureTestUserExists(userId);

  // Garantir que o usuário tenha carteira
  const { getOrCreateWallet } = await import('./walletService.js');
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < cost) {
    throw new Error(`Saldo insuficiente. Você tem ${wallet.balance.toFixed(2)} VAL, mas precisa de ${cost} VAL`);
  }

  // ✅ IMPORTANTE: SEMPRE adicionar JITTER de +/- 0.002 graus (como solicitado)
  // Isso garante que construções fiquem espalhadas pela vizinhança, não uma em cima da outra
  let finalLat = lat;
  let finalLng = lng;
  let countryFeature = null;
  
  // Buscar feature do país no GeoJSON (para usar tanto no jitter quanto na verificação de edifícios próximos)
  if (checkConnection()) {
    const countriesGeoJSON = loadCountriesGeoJSON();
    
    // Buscar feature do país no GeoJSON
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
    
    // ✅ SEMPRE adicionar JITTER de +/- 0.002 graus (~222 metros) como solicitado
    const jitterAmount = 0.002; // +/- 0.002 graus como solicitado
    const offsetLat = (Math.random() - 0.5) * 2 * jitterAmount; // -0.002 a +0.002
    const offsetLng = (Math.random() - 0.5) * 2 * jitterAmount; // -0.002 a +0.002
    
    const testLat = lat + offsetLat;
    const testLng = lng + offsetLng;
    
    // ✅ Verificar se a posição com jitter está dentro do polígono do país
    if (countryFeature && countryFeature.geometry) {
      const point = turf.point([testLng, testLat]);
      
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
      
      // ✅ Se estiver dentro do polígono, usar posição com jitter
      if (isInside) {
        finalLat = testLat;
        finalLng = testLng;
        logger.info(`✅ Jitter aplicado: ${offsetLat.toFixed(6)}, ${offsetLng.toFixed(6)} graus`);
      } else {
        // Se não estiver dentro, tentar ajustar para ficar dentro (até 10 tentativas)
        for (let attempt = 0; attempt < 10; attempt++) {
          const adjustedOffsetLat = (Math.random() - 0.5) * 2 * jitterAmount;
          const adjustedOffsetLng = (Math.random() - 0.5) * 2 * jitterAmount;
          const adjustedTestLat = lat + adjustedOffsetLat;
          const adjustedTestLng = lng + adjustedOffsetLng;
          const adjustedPoint = turf.point([adjustedTestLng, adjustedTestLat]);
          
          let adjustedIsInside = false;
          if (countryFeature.geometry.type === 'Polygon') {
            const poly = turf.polygon(countryFeature.geometry.coordinates);
            adjustedIsInside = turf.booleanPointInPolygon(adjustedPoint, poly);
          } else if (countryFeature.geometry.type === 'MultiPolygon') {
            for (const coords of countryFeature.geometry.coordinates) {
              const poly = turf.polygon(coords);
              if (turf.booleanPointInPolygon(adjustedPoint, poly)) {
                adjustedIsInside = true;
                break;
              }
            }
          }
          
          if (adjustedIsInside) {
            finalLat = adjustedTestLat;
            finalLng = adjustedTestLng;
            logger.info(`✅ Jitter ajustado aplicado após ${attempt + 1} tentativas`);
            break;
          }
        }
        // Se não conseguir encontrar posição dentro após 10 tentativas, usar posição original (sem jitter)
        logger.warn(`⚠️  Não foi possível aplicar jitter dentro do polígono. Usando coordenada original.`);
      }
    } else {
      // Se não tiver GeoJSON, aplicar jitter diretamente (sem validação)
      finalLat = testLat;
      finalLng = testLng;
      logger.info(`✅ Jitter aplicado (sem validação GeoJSON): ${offsetLat.toFixed(6)}, ${offsetLng.toFixed(6)} graus`);
    }
  } else {
    // Se não tiver conexão, aplicar jitter diretamente
    const jitterAmount = 0.002;
    finalLat = lat + (Math.random() - 0.5) * 2 * jitterAmount;
    finalLng = lng + (Math.random() - 0.5) * 2 * jitterAmount;
    logger.info(`✅ Jitter aplicado (sem conexão): ${(finalLat - lat).toFixed(6)}, ${(finalLng - lng).toFixed(6)} graus`);
  }
  
  // ✅ Garantir que coordenadas finais são válidas
  if (isNaN(finalLat) || isNaN(finalLng)) {
    logger.warn(`⚠️  Coordenadas finais inválidas após jitter. Usando coordenadas originais.`);
    finalLat = lat;
    finalLng = lng;
  }
  
  // Usar coordenadas finais (com jitter aplicado)
  lat = finalLat;
  lng = finalLng;
  
  // ✅ Validar coordenadas finais antes de criar edifício
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    logger.error(`⚠️  Coordenadas finais inválidas após jitter: lat=${lat}, lng=${lng}`);
    throw new Error('Coordenadas inválidas após aplicar jitter');
  }

  // ✅ Verificar se há edifícios próximos (apenas se countryFeature foi encontrado e há conexão)
  if (checkConnection() && countryFeature && countryFeature.geometry) {
    const nearbyBuildings = await buildingRepository.findNearby(lng, lat, 5); // 5km de raio
    const buildingsInSameCountry = nearbyBuildings.filter(b => 
      (b.countryId === finalCountryId || b.country_id === finalCountryId)
    );
    
    if (buildingsInSameCountry.length > 0) {
      // ✅ Se houver edifícios próximos, gerar posição aleatória ESPALHADA no país
      logger.info(`🏗️ Encontrados ${buildingsInSameCountry.length} edifícios próximos. Gerando posição ESPALHADA...`);
      
      const bbox = turf.bbox(turf.feature(countryFeature.geometry));
      let newPosition = null;
      
      for (let attempt = 0; attempt < 50; attempt++) {
        const randomLng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
        const randomLat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
        
        const point = turf.point([randomLng, randomLat]);
        
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
        
        if (isInside && !isNaN(randomLat) && !isNaN(randomLng) &&
            randomLat >= -90 && randomLat <= 90 &&
            randomLng >= -180 && randomLng <= 180) {
          // Verificar distância mínima de 500m dos edifícios existentes
          const tooClose = buildingsInSameCountry.some(b => {
            const bLat = b.position?.lat || b.position_lat;
            const bLng = b.position?.lng || b.position_lng;
            if (!bLat || !bLng) return false;
            
            const point1 = turf.point([randomLng, randomLat]);
            const point2 = turf.point([bLng, bLat]);
            const distanceKm = turf.distance(point1, point2, { units: 'kilometers' });
            
            return distanceKm < 0.5; // Mínimo 500m
          });
          
          if (!tooClose) {
            newPosition = { lat: randomLat, lng: randomLng };
            logger.info(`✅ Nova posição ESPALHADA gerada: ${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`);
            break;
          }
        }
      }
      
      if (newPosition) {
        lat = newPosition.lat;
        lng = newPosition.lng;
      } else {
        throw new Error('Não foi possível encontrar uma posição adequada para construir. Tente construir em outra área do país.');
      }
    }
  }

  // ✅ Verificação final: se ainda há edifício muito próximo (100m), erro
  if (checkConnection()) {
    const veryNearbyBuildings = await buildingRepository.findNearby(lng, lat, 0.1);
    if (veryNearbyBuildings.length > 0) {
      throw new Error('Já existe um edifício muito próximo desta localização (distância mínima: 100m). Tente construir em outra área do país.');
    }
  }

  // ✅ FASE 18.5: Identificar hierarquia geográfica completa (País > Estado > Cidade)
  let stateId = null;
  let stateName = null;
  let cityId = null;
  let cityName = null;
  
  try {
    const { identifyHierarchy } = await import('./geoHierarchyService.js');
    const hierarchy = await identifyHierarchy(lat, lng);
    
    if (hierarchy.valid) {
      if (hierarchy.state) {
        stateId = hierarchy.state.id;
        stateName = hierarchy.state.name;
      }
      
      if (hierarchy.city) {
        cityId = hierarchy.city.id;
        cityName = hierarchy.city.name;
      }
      
      logger.info(`✅ Hierarquia geográfica identificada: ${finalCountryName} > ${stateName || 'N/A'} > ${cityName || 'N/A'}`);
    } else {
      logger.warn(`⚠️  Hierarquia geográfica não identificada para ${lat}, ${lng}`);
    }
  } catch (error) {
    logger.warn(`⚠️  Erro ao identificar hierarquia geográfica: ${error.message}`);
    // Continuar sem hierarquia se houver erro
  }

  // Criar edifício
  const buildingId = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const buildingData = {
    buildingId,
    ownerId: ownerUUID, // ✅ Usar UUID do usuário garantido
    countryId: finalCountryId,
    countryName: finalCountryName,
    // ✅ FASE 18.5: Incluir hierarquia geográfica completa
    stateId: stateId || null,
    stateName: stateName || null,
    cityId: cityId || null,
    cityName: cityName || null,
    type,
    position: { lat, lng },
    level,
    cost,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Level ${level}`,
    capacity: BUILDING_COSTS[type] / 100, // Capacidade baseada no custo
    revenuePerHour: BUILDING_COSTS[type] / 1000, // Receita baseada no custo
    condition: 100
  };

  // ✅ FASE 19.3: Usar transação atômica se disponível (fallback para modo manual)
  try {
    const { buildBuildingAtomic } = await import('./transactionService.js');
    
    // Tentar usar transação atômica
    const atomicResult = await buildBuildingAtomic(userId, cost, buildingData);
    
    if (atomicResult.success) {
      // Buscar edifício criado pela função SQL
      const building = await buildingRepository.findByBuildingId(buildingData.buildingId);
      
      if (building) {
        logger.info(`🏗️ Edifício construído (transação atômica): ${buildingData.name} (${type}) nível ${level} em ${finalCountryName} (${finalCountryId})${cityName ? `, ${cityName}` : ''}${stateName ? `, ${stateName}` : ''} por usuário ${userId}`);
        return building;
      } else {
        // Se não encontrou, criar manualmente (fallback)
        logger.warn(`⚠️ Transação atômica executada mas edifício não encontrado. Criando manualmente...`);
      }
    }
  } catch (atomicError) {
    // Se transação atômica falhar, usar modo manual (compatibilidade retroativa)
    logger.warn(`⚠️ Transação atômica não disponível ou falhou: ${atomicError.message}. Usando modo manual...`);
  }

  // Modo manual (fallback ou se transação atômica não estiver disponível)
  const building = await buildingRepository.create(buildingData);

  // Subtrair saldo
  await subtractBalance(
    userId,
    cost,
    `Construção de ${building.name} em ${finalCountryName}`,
    { buildingId, countryId: finalCountryId, type }
  );

    logger.info(`🏗️ Edifício construído: ${buildingData.name} (${type}) nível ${level} em ${finalCountryName} (${finalCountryId})${cityName ? `, ${cityName}` : ''}${stateName ? `, ${stateName}` : ''} por usuário ${userId}`);

    return building;
  } catch (error) {
    // ✅ FASE 19.1: Logar erro antes de relançar (middleware global vai capturar)
    logger.error(`Erro ao construir edifício:`, {
      error: error.message,
      stack: error.stack,
      userId,
      countryId,
      type,
      lat,
      lng,
      level
    });
    // Relançar erro para o controller/middleware tratar
    throw error;
  }
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


  await buildingRepository.delete(building.id);

  logger.info(`🗑️ Edifício demolido: ${building.name || building.type} por usuário ${userId}`);

  return { success: true, message: 'Edifício demolido com sucesso' };
};

