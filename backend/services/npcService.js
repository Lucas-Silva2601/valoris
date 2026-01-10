import npcRepository from '../repositories/npcRepository.js';
import { checkConnection } from '../config/supabase.js';
import * as turf from '@turf/turf';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCService');

/**
 * ✅ Verificar se uma coordenada está em terra firme (dentro de algum país)
 * MELHORADO: Tratamento robusto de erros e validações
 * IMPORTANTE: Retorna true por padrão para não bloquear movimento quando há problemas
 */
const isOnLand = (lat, lng, countriesGeoJSON) => {
  try {
    // ✅ Validar coordenadas de entrada
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      logger.debug(`Coordenadas inválidas para verificação de terra: lat=${lat}, lng=${lng}`);
      return true; // ✅ Retornar true para não bloquear (assumir terra)
    }

    // ✅ Se não tiver GeoJSON, assumir que está em terra (para não bloquear movimento)
    if (!countriesGeoJSON || !countriesGeoJSON.features || !Array.isArray(countriesGeoJSON.features)) {
      logger.debug('GeoJSON não disponível para verificação de terra. Assumindo que está em terra.');
      return true; // ✅ Não bloquear quando GeoJSON não está disponível
    }

    // ✅ Verificar se features array está vazio
    if (countriesGeoJSON.features.length === 0) {
      logger.debug('GeoJSON features array vazio. Assumindo que está em terra.');
      return true;
    }

    const point = turf.point([lng, lat]);
    let featuresChecked = 0;
    
    // Verificar se o ponto está dentro de algum país (polígono)
    for (const feature of countriesGeoJSON.features) {
      try {
        if (!feature || !feature.geometry) continue;
        featuresChecked++;
        
        if (feature.geometry.type === 'Polygon') {
          if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) continue;
          
          try {
            const polygon = turf.polygon(feature.geometry.coordinates);
            if (turf.booleanPointInPolygon(point, polygon)) {
              return true; // ✅ Encontrou que está em terra
            }
          } catch (polyError) {
            logger.debug(`Erro ao criar/verificar polígono:`, polyError.message);
            continue;
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) continue;
          
          // Para MultiPolygon, verificar cada polígono
          for (const coords of feature.geometry.coordinates) {
            if (!Array.isArray(coords)) continue;
            try {
              const polygon = turf.polygon(coords);
              if (turf.booleanPointInPolygon(point, polygon)) {
                return true; // ✅ Encontrou que está em terra
              }
            } catch (polyError) {
              // Pular este polígono se houver erro, continuar com os outros
              logger.debug(`Erro ao verificar polígono individual:`, polyError.message);
              continue;
            }
          }
        }
      } catch (featureError) {
        // Pular este feature se houver erro, continuar com os outros
        logger.debug(`Erro ao verificar feature:`, featureError.message);
        continue;
      }
    }
    
    // ✅ Se verificou features mas não encontrou match, retornar false
    // Mas apenas se realmente verificou algo (featuresChecked > 0)
    if (featuresChecked > 0) {
      return false; // Não está em nenhum país conhecido
    }
    
    // ✅ Se não conseguiu verificar nenhuma feature, assumir que está em terra
    logger.debug('Não foi possível verificar features do GeoJSON. Assumindo terra.');
    return true;
  } catch (error) {
    // ✅ Se houver qualquer erro, logar e retornar true para não bloquear movimento
    logger.warn('Erro ao verificar terra firme:', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
      lat,
      lng,
      hasGeoJSON: !!countriesGeoJSON,
      featuresCount: countriesGeoJSON?.features?.length || 0
    });
    return true; // ✅ Assumir que está em terra para não bloquear movimento
  }
};

/**
 * Criar NPC em um país
 */
export const createNPC = async (countryId, countryName, buildingId = null, customPosition = null) => {
  if (!checkConnection()) {
    throw new Error('Supabase não está conectado');
  }

  const npcId = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determinar posição
  let position = { lat: 0, lng: 0 };
  
  if (customPosition) {
    // Usar posição customizada se fornecida
    position = customPosition;
  } else if (buildingId) {
    try {
      const buildingRepository = (await import('../repositories/buildingRepository.js')).default;
      const building = await buildingRepository.findByBuildingId(buildingId);
      if (building && building.position) {
        position = building.position;
      }
    } catch (error) {
      logger.warn('Erro ao buscar edifício para NPC:', error.message);
    }
  } else {
    // ✅ Gerar posição usando centroide do país do GeoJSON (melhor distribuição)
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
      
      if (fs.existsSync(geoJsonPath)) {
        const data = fs.readFileSync(geoJsonPath, 'utf8');
        const countriesGeoJSON = JSON.parse(data);
        
        // Encontrar o país correspondente
        for (const feature of countriesGeoJSON.features || []) {
          const featureCountryId = feature.properties?.ISO_A3 || feature.properties?.ADM0_A3 || 
                                  feature.properties?.ISO3 || feature.properties?.ISO_A2;
          
          if (featureCountryId === countryId || featureCountryId === countryId?.substring(0, 3)) {
            // Calcular centroide do país
            let polygon = null;
            if (feature.geometry?.type === 'Polygon') {
              polygon = turf.polygon(feature.geometry.coordinates);
            } else if (feature.geometry?.type === 'MultiPolygon') {
              polygon = turf.polygon(feature.geometry.coordinates[0]);
            }
            
            if (polygon) {
              const centroid = turf.centroid(polygon);
              const centerLat = centroid.geometry.coordinates[1];
              const centerLng = centroid.geometry.coordinates[0];
              
              // ✅ AUMENTAR variação para melhor distribuição (~0.5-5 graus = ~55-550km)
              // Usar distribuição em círculo para espalhar melhor os NPCs
              const angle = Math.random() * 2 * Math.PI;
              const radius = 0.5 + (Math.random() * 4.5); // 0.5-5 graus
              const randomOffsetLat = Math.cos(angle) * radius;
              const randomOffsetLng = Math.sin(angle) * radius;
              
              position = {
                lat: centerLat + randomOffsetLat,
                lng: centerLng + randomOffsetLng
              };
              break; // Encontrou país, sair do loop
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Erro ao calcular centroide do país para NPC, usando hash:', error);
      // Fallback para método anterior se não conseguir carregar GeoJSON
      const hash = countryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseLat = (hash % 180) - 90;
      const baseLng = ((hash * 7) % 360) - 180;
      const randomOffset = (Math.random() - 0.5) * 5;
      position = {
        lat: baseLat + randomOffset,
        lng: baseLng + randomOffset
      };
    }
    
    // ✅ Garantir que position sempre tenha valores válidos
    if (!position || !position.lat || !position.lng || isNaN(position.lat) || isNaN(position.lng)) {
      logger.error(`Não foi possível gerar posição válida para NPC em ${countryName}. Usando coordenadas padrão.`);
      // Posição padrão segura (Brasil)
      position = { lat: -14.2350, lng: -51.9253 };
    }
  }

  // Gerar nome aleatório
  const names = [
    'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia',
    'Lucas', 'Fernanda', 'Rafael', 'Mariana', 'Gabriel', 'Beatriz',
    'Thiago', 'Camila', 'Felipe', 'Isabela', 'Bruno', 'Larissa'
  ];
  const name = names[Math.floor(Math.random() * names.length)];

  // Gerar cor de pele aleatória
  const skinColors = [
    '#f4d5bd', '#422d1a', '#d4a574', '#c19a6b',
    '#8b6f47', '#5c4a3a', '#e6c4a0', '#b8916d',
    '#6b4e3d', '#9d7a5a', '#a6896d', '#7a5c42'
  ];
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];

  const npc = await npcRepository.create({
    npcId,
    name,
    countryId,
    countryName,
    position,
    homeBuilding: buildingId,
    status: 'idle',
    npcType: Math.random() > 0.5 ? 'resident' : 'worker',
    speed: 5,
    skinColor,
    lastMovementTime: new Date(),
    nextActionTime: new Date(Date.now() + (30000 + Math.random() * 90000))
  });

  logger.info(`👤 NPC criado: ${npc.npcId} em ${countryName}`);
  return npc;
};

/**
 * Criar NPCs automaticamente para edifícios (residentes)
 */
export const createNPCsForBuilding = async (building) => {
  if (!checkConnection()) {
    logger.warn('Supabase não está conectado. NPCs não serão criados.');
    return;
  }

  const npcsToCreate = Math.floor((building.capacity || 10) * 0.3); // 30% da capacidade

  for (let i = 0; i < npcsToCreate; i++) {
    await createNPC(building.countryId, building.countryName, building.id || building._id);
  }

  logger.info(`👥 Criados ${npcsToCreate} NPCs para edifício ${building.name}`);
};

/**
 * Criar NPCs construtores que vão para o local da construção
 */
export const createConstructionNPCs = async (building, count = 10) => {
  let created = 0;
  
  // Criar NPCs em posições próximas à construção (espalhados)
  for (let i = 0; i < count; i++) {
    // Criar NPCs em um raio de ~10km da construção
    const angle = (i / count) * 2 * Math.PI; // Distribuir em círculo
    const distanceKm = 0.05 + (Math.random() * 0.05); // 5-10km de distância
    // 1 grau ≈ 111km, então 0.05 graus ≈ 5.5km
    const offsetLat = Math.cos(angle) * distanceKm;
    const offsetLng = Math.sin(angle) * distanceKm;
    
    const startPosition = {
      lat: building.position.lat + offsetLat,
      lng: building.position.lng + offsetLng
    };
    
    try {
      const npc = await createNPC(
        building.countryId, 
        building.countryName, 
        null, 
        startPosition
      );
      
      // ✅ Definir o NPC para ir até a construção (status working = construindo)
      // ✅ GARANTIR que o building tem posição válida
      if (!building.position || !building.position.lat || !building.position.lng) {
        logger.error(`Edifício ${building.buildingId} não tem posição válida para NPC construtor`);
        continue; // Pular este NPC
      }
      
      // ✅ Atualizar NPC usando repositório Supabase (não .save() do Mongoose)
      await npcRepository.updateByNpcId(npc.npcId, {
        status: 'working',
        targetPosition: building.position,
        workBuilding: building.id || building.buildingId || building._id,
        lastMovementTime: new Date()
      });
      
      created++;
    } catch (error) {
      logger.error(`Erro ao criar NPC construtor ${i + 1}:`, error);
    }
  }
  
  return created;
};

/**
 * Atualizar posição de NPC (movimento)
 */
export const updateNPCPosition = async (npcId) => {
  if (!checkConnection()) {
    return null;
  }

  // Buscar NPC por npc_id (string) em vez de _id
  const npc = await npcRepository.findByNpcId(npcId);
  if (!npc || npc.status !== 'walking') {
    return null;
  }

  // ✅ GARANTIR que NPC tem posição válida
  if (!npc.position || !npc.position.lat || !npc.position.lng || 
      isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
    logger.warn(`NPC ${npcId} não tem posição válida. Tentando recuperar...`);
    // Tentar usar targetPosition como posição atual se disponível
    if (npc.targetPosition && npc.targetPosition.lat && npc.targetPosition.lng) {
      await npcRepository.updateByNpcId(npcId, { 
        position: npc.targetPosition,
        status: 'idle'
      });
      npc.position = npc.targetPosition;
      npc.status = 'idle';
      return npc;
    } else {
      // Se não tem posição nem destino, definir posição padrão do país (centroide aproximado)
      logger.error(`NPC ${npcId} sem posição e sem destino. Não é possível atualizar.`);
      return null;
    }
  }

  if (!npc.targetPosition || !npc.targetPosition.lat || !npc.targetPosition.lng) {
    await npcRepository.updateByNpcId(npcId, { status: 'idle' });
    npc.status = 'idle';
    return npc;
  }

  // ✅ Validar posições antes de calcular distância
  if (!npc.position || !npc.position.lat || !npc.position.lng ||
      isNaN(npc.position.lat) || isNaN(npc.position.lng) ||
      !npc.targetPosition || !npc.targetPosition.lat || !npc.targetPosition.lng ||
      isNaN(npc.targetPosition.lat) || isNaN(npc.targetPosition.lng)) {
    logger.warn(`NPC ${npcId}: Posições inválidas para calcular movimento`);
    await npcRepository.updateByNpcId(npcId, { status: 'idle', targetPosition: null });
    return null;
  }

  // Calcular distância e tempo decorrido
  const from = turf.point([npc.position.lng, npc.position.lat]);
  const to = turf.point([npc.targetPosition.lng, npc.targetPosition.lat]);
  const distanceKm = turf.distance(from, to, { units: 'kilometers' });
  
  // ✅ Validar distância calculada
  if (isNaN(distanceKm) || distanceKm < 0 || !isFinite(distanceKm)) {
    logger.error(`NPC ${npcId}: Distância inválida calculada: ${distanceKm}`);
    await npcRepository.updateByNpcId(npcId, { status: 'idle', targetPosition: null, lastMovementTime: new Date() });
    return null;
  }
  
  // ✅ Validar lastMovementTime antes de calcular tempo decorrido
  const now = new Date();
  let lastMoveTime;
  try {
    lastMoveTime = npc.lastMovementTime ? new Date(npc.lastMovementTime) : now;
    // Se a data for inválida, usar agora
    if (isNaN(lastMoveTime.getTime())) {
      lastMoveTime = now;
    }
  } catch (e) {
    lastMoveTime = now;
  }
  
  const timeElapsedMs = now - lastMoveTime;
  let timeElapsedHours;
  let distanceTraveledKm;
  
  // ✅ Garantir que timeElapsedMs é válido (pode ser NaN se lastMovementTime for inválido)
  if (isNaN(timeElapsedMs) || timeElapsedMs < 0 || !isFinite(timeElapsedMs)) {
    logger.warn(`NPC ${npcId}: lastMovementTime inválido, usando tempo atual`);
    await npcRepository.updateByNpcId(npcId, { lastMovementTime: now });
    // Usar um valor pequeno para permitir movimento mínimo (~3.6 segundos)
    timeElapsedHours = 0.001;
    distanceTraveledKm = (npc.speed || 5) * timeElapsedHours;
  } else {
    timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    distanceTraveledKm = (npc.speed || 5) * timeElapsedHours;
  }
  
  // ✅ Validar distanceTraveledKm
  if (isNaN(distanceTraveledKm) || distanceTraveledKm < 0 || !isFinite(distanceTraveledKm)) {
    logger.warn(`NPC ${npcId}: Distância percorrida inválida (${distanceTraveledKm}), resetando lastMovementTime`);
    await npcRepository.updateByNpcId(npcId, { lastMovementTime: now });
    return npc;
  }

  // ✅ Se chegou ao destino - GARANTIR que targetPosition é válida antes de atualizar
  if (distanceTraveledKm >= distanceKm) {
    // ✅ Validar que targetPosition é válida
    if (!npc.targetPosition || !npc.targetPosition.lat || !npc.targetPosition.lng ||
        isNaN(npc.targetPosition.lat) || isNaN(npc.targetPosition.lng)) {
      logger.error(`NPC ${npcId}: targetPosition inválida ao chegar ao destino`);
      // Tentar manter posição atual e remover destino
      await npcRepository.updateByNpcId(npcId, {
        targetPosition: null,
        status: 'idle',
        lastMovementTime: new Date()
      });
      npc.targetPosition = null;
      npc.status = 'idle';
      return npc;
    }
    
    // ✅ Validar limites da posição destino
    const targetLat = parseFloat(npc.targetPosition.lat);
    const targetLng = parseFloat(npc.targetPosition.lng);
    
    if (targetLat < -90 || targetLat > 90 || targetLng < -180 || targetLng > 180) {
      logger.error(`NPC ${npcId}: targetPosition fora dos limites:`, npc.targetPosition);
      await npcRepository.updateByNpcId(npcId, {
        targetPosition: null,
        status: 'idle',
        lastMovementTime: new Date()
      });
      npc.targetPosition = null;
      npc.status = 'idle';
      return npc;
    }
    
    try {
      await npcRepository.updateByNpcId(npcId, {
        position: { lat: targetLat, lng: targetLng },
        targetPosition: null,
        status: 'idle',
        lastMovementTime: new Date()
      });
      
      npc.position = { lat: targetLat, lng: targetLng };
      npc.targetPosition = null;
      npc.status = 'idle';
      npc.lastMovementTime = new Date();
      return npc;
    } catch (error) {
      logger.error(`Erro ao atualizar posição do NPC ${npcId} ao chegar ao destino:`, error.message || error);
      // Retornar NPC sem atualizar em caso de erro
      return npc;
    }
  }

  // ✅ Calcular nova posição (interpolação linear) com validações
  const progress = Math.min(1, Math.max(0, distanceTraveledKm / distanceKm)); // Garantir progress entre 0 e 1
  let newLat = npc.position.lat + (npc.targetPosition.lat - npc.position.lat) * progress;
  let newLng = npc.position.lng + (npc.targetPosition.lng - npc.position.lng) * progress;
  
  // ✅ Validar se as novas coordenadas são válidas
  if (isNaN(newLat) || isNaN(newLng) || !isFinite(newLat) || !isFinite(newLng)) {
    logger.error(`NPC ${npcId}: Nova posição calculada inválida: lat=${newLat}, lng=${newLng}`);
    logger.error(`  Posição atual: lat=${npc.position.lat}, lng=${npc.position.lng}`);
    logger.error(`  Posição destino: lat=${npc.targetPosition.lat}, lng=${npc.targetPosition.lng}`);
    logger.error(`  Progress: ${progress}, distanceTraveledKm: ${distanceTraveledKm}, distanceKm: ${distanceKm}`);
    await npcRepository.updateByNpcId(npcId, { status: 'idle', targetPosition: null, lastMovementTime: now });
    return null;
  }

  // ✅ MELHORIA: Verificar múltiplos pontos ao longo do caminho para garantir que não atravessa oceano
  // Carregar GeoJSON uma vez
  let countriesGeoJSON = null;
  try {
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (fs.existsSync(geoJsonPath)) {
      const data = fs.readFileSync(geoJsonPath, 'utf8');
      countriesGeoJSON = JSON.parse(data);
      
      // Verificar se a nova posição está em terra firme
      if (!isOnLand(newLat, newLng, countriesGeoJSON)) {
        // ✅ Verificar pontos intermediários para detectar se atravessou oceano
        const steps = 5; // Verificar 5 pontos ao longo do caminho
        let lastValidPosition = { lat: npc.position.lat, lng: npc.position.lng };
        let foundWater = false;
        
        for (let step = 1; step <= steps; step++) {
          const stepProgress = (step / steps) * progress;
          const stepLat = npc.position.lat + (npc.targetPosition.lat - npc.position.lat) * stepProgress;
          const stepLng = npc.position.lng + (npc.targetPosition.lng - npc.position.lng) * stepProgress;
          
          if (isOnLand(stepLat, stepLng, countriesGeoJSON)) {
            lastValidPosition = { lat: stepLat, lng: stepLng };
          } else {
            foundWater = true;
            break; // Encontrou água, parar e usar última posição válida
          }
        }
        
        if (foundWater) {
          // Usar última posição válida antes de entrar na água
          newLat = lastValidPosition.lat;
          newLng = lastValidPosition.lng;
          logger.debug(`NPC ${npc.npcId} ajustado para evitar oceano`);
        } else {
          // Se chegou aqui mas newLat/newLng não está em terra, tentar encontrar posição próxima
          let foundLand = false;
          for (let i = 0; i < 10 && !foundLand; i++) {
            const offset = 0.001 * (i + 1); // Aumentar offset gradualmente
            const testPositions = [
              { lat: newLat + offset, lng: newLng },
              { lat: newLat - offset, lng: newLng },
              { lat: newLat, lng: newLng + offset },
              { lat: newLat, lng: newLng - offset }
            ];
            
            for (const testPos of testPositions) {
              if (isOnLand(testPos.lat, testPos.lng, countriesGeoJSON)) {
                newLat = testPos.lat;
                newLng = testPos.lng;
                foundLand = true;
                break;
              }
            }
          }
          
          // Se ainda não encontrou, usar posição anterior (não mover)
          if (!foundLand) {
            logger.warn(`NPC ${npc.npcId} não pode se mover - posição não está em terra`);
            return npc;
          }
        }
      }
      }
    } catch (error) {
      // ✅ Melhorar tratamento de erro com mais detalhes para identificar o problema
      logger.warn('⚠️  Erro ao verificar terra firme para NPC durante movimento:', {
        message: error.message || String(error),
        errorType: error.constructor?.name || typeof error,
        npcId: npc.npcId,
        calculatedPosition: { lat: newLat, lng: newLng },
        currentPosition: npc.position,
        targetPosition: npc.targetPosition
      });
      
      // ✅ Permitir movimento mesmo se não conseguir verificar (para não bloquear completamente)
      // Mas validar coordenadas antes de continuar
      if (isNaN(newLat) || isNaN(newLng) || 
          newLat < -90 || newLat > 90 || newLng < -180 || newLng > 180) {
        logger.error(`❌ Posição inválida após erro na verificação: lat=${newLat}, lng=${newLng}`);
        return npc; // Não mover se posição é inválida
      }
      
      // ✅ Se coordenadas são válidas, permitir movimento mesmo sem verificação de terra
      logger.debug(`✅ Permitindo movimento sem verificação de terra (coordenadas válidas): lat=${newLat}, lng=${newLng}`);
    }

  // Calcular direção
  const bearing = turf.bearing(from, to);
  const direction = bearing < 0 ? bearing + 360 : bearing;

  // ✅ GARANTIR que newLat e newLng são números válidos
  if (isNaN(newLat) || isNaN(newLng) || !isFinite(newLat) || !isFinite(newLng)) {
    logger.error(`NPC ${npcId}: Posição calculada inválida: lat=${newLat}, lng=${newLng}`);
    return npc; // Retornar NPC sem atualizar
  }

  // ✅ Validar limites de coordenadas
  if (newLat < -90 || newLat > 90 || newLng < -180 || newLng > 180) {
    logger.error(`NPC ${npcId}: Posição fora dos limites: lat=${newLat}, lng=${newLng}`);
    return npc; // Retornar NPC sem atualizar
  }

  // Atualizar no banco - SEMPRE garantir posição válida
  try {
    await npcRepository.updateByNpcId(npcId, {
      position: { lat: parseFloat(newLat), lng: parseFloat(newLng) },
      direction: parseFloat(direction),
      lastMovementTime: new Date()
    });
  } catch (error) {
    logger.error(`Erro ao atualizar posição do NPC ${npcId}:`, error);
    // Se erro for de constraint NOT NULL, tentar recuperar posição do banco
    if (error.message && error.message.includes('null value in column "position_lat"')) {
      logger.warn(`Tentando recuperar NPC ${npcId} do banco...`);
      const recoveredNPC = await npcRepository.findByNpcId(npcId);
      if (recoveredNPC && recoveredNPC.position) {
        return recoveredNPC;
      }
    }
    return npc; // Retornar NPC sem atualizar em caso de erro
  }

  // Atualizar objeto local
  npc.position = { lat: newLat, lng: newLng };
  npc.direction = direction;
  npc.lastMovementTime = new Date();

  return npc;
};

/**
 * Escolher próximo destino para NPC (na terra firme)
 */
export const chooseNextDestination = async (npc, countriesGeoJSON = null) => {
  // Carregar GeoJSON se não foi fornecido
  if (!countriesGeoJSON) {
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
      
      if (fs.existsSync(geoJsonPath)) {
        const data = fs.readFileSync(geoJsonPath, 'utf8');
        countriesGeoJSON = JSON.parse(data);
      }
    } catch (error) {
      logger.warn('Não foi possível carregar GeoJSON para verificação de terra:', error);
    }
  }

  // Se NPC tem casa e trabalho, alternar entre eles
  if (npc.homeBuilding || npc.workBuilding) {
    try {
      const buildingRepository = (await import('../repositories/buildingRepository.js')).default;
      
      const currentBuildingId = npc.status === 'working' ? npc.workBuilding : npc.homeBuilding;
      const targetBuildingId = npc.status === 'working' ? npc.homeBuilding : npc.workBuilding;
      
      if (targetBuildingId) {
        // ✅ Tentar encontrar o edifício - pode ser ID UUID ou buildingId string
        let targetBuilding = null;
        try {
          // Tentar primeiro como UUID (se for um ID do banco)
          if (targetBuildingId.length === 36 || targetBuildingId.includes('-')) {
            targetBuilding = await buildingRepository.findById(targetBuildingId);
          }
          // Se não encontrou, tentar como buildingId
          if (!targetBuilding) {
            targetBuilding = await buildingRepository.findByBuildingId(targetBuildingId);
          }
        } catch (buildingError) {
          // Log do erro mas não bloquear o processo
          logger.debug('Erro ao buscar edifício do NPC:', buildingError.message);
        }
        
        // ✅ GARANTIR que o edifício tem posição válida antes de atualizar
        if (targetBuilding && targetBuilding.position && 
            targetBuilding.position.lat != null && targetBuilding.position.lng != null &&
            !isNaN(targetBuilding.position.lat) && !isNaN(targetBuilding.position.lng) &&
            isOnLand(targetBuilding.position.lat, targetBuilding.position.lng, countriesGeoJSON)) {
          
          const targetPos = {
            lat: parseFloat(targetBuilding.position.lat),
            lng: parseFloat(targetBuilding.position.lng)
          };
          
          // Validar limites
          if (targetPos.lat >= -90 && targetPos.lat <= 90 &&
              targetPos.lng >= -180 && targetPos.lng <= 180) {
            await npcRepository.updateByNpcId(npc.npcId, {
              targetPosition: targetPos,
              status: 'walking'
            });
            npc.targetPosition = targetPos;
            npc.status = 'walking';
            return npc;
          }
        }
      }
    } catch (error) {
      logger.debug('Erro ao buscar edifícios do NPC:', error.message);
    }
  }

  // Se não tem destino específico, escolher edifício aleatório próximo (em terra)
  // ✅ AUMENTAR raio de busca para 50km para encontrar mais edifícios
  try {
    const buildingRepository = (await import('../repositories/buildingRepository.js')).default;
    const nearbyBuildings = await buildingRepository.findNearby(
      npc.position.lng, npc.position.lat, 50, npc.countryId
    );
    
    // ✅ Filtrar apenas edifícios válidos (sem depender de verificação de terra firme se GeoJSON não está disponível)
    const validBuildings = nearbyBuildings.filter(building => {
      if (!building.position || !building.position.lat || !building.position.lng) return false;
      
      // ✅ Se GeoJSON está disponível, verificar terra firme; senão, aceitar todos os edifícios válidos
      if (countriesGeoJSON && countriesGeoJSON.features && Array.isArray(countriesGeoJSON.features) && countriesGeoJSON.features.length > 0) {
        return isOnLand(building.position.lat, building.position.lng, countriesGeoJSON);
      }
      
      // ✅ Se não pode verificar terra firme, aceitar edifícios válidos
      return true;
    });
    
    if (validBuildings.length > 0) {
      const randomBuilding = validBuildings[Math.floor(Math.random() * validBuildings.length)];
      
      // ✅ GARANTIR que o edifício tem posição válida
      if (randomBuilding.position && 
          randomBuilding.position.lat != null && randomBuilding.position.lng != null &&
          !isNaN(randomBuilding.position.lat) && !isNaN(randomBuilding.position.lng)) {
        
        const targetPos = {
          lat: parseFloat(randomBuilding.position.lat),
          lng: parseFloat(randomBuilding.position.lng)
        };
        
        // Validar limites
        if (targetPos.lat >= -90 && targetPos.lat <= 90 &&
            targetPos.lng >= -180 && targetPos.lng <= 180) {
          await npcRepository.updateByNpcId(npc.npcId, {
            targetPosition: targetPos,
            status: 'walking'
          });
          npc.targetPosition = targetPos;
          npc.status = 'walking';
          return npc;
        }
      }
    }
  } catch (error) {
    logger.debug('Erro ao buscar edifícios próximos:', error.message);
  }

  // Se não há edifícios próximos, escolher posição aleatória em terra firme DENTRO DO MESMO PAÍS
  // ✅ MELHORIA: Garantir que NPCs só se movam dentro do mesmo país
  let attempts = 0;
  let newPosition = null;
  
  // Função auxiliar para verificar se posição está no mesmo país do NPC
  const isInSameCountry = (lat, lng, countryId, countriesGeoJSON) => {
    if (!countriesGeoJSON || !countriesGeoJSON.features) return true;
    
    const point = turf.point([lng, lat]);
    
    // Encontrar o país que contém o ponto
    for (const feature of countriesGeoJSON.features) {
      if (!feature.geometry) continue;
      
      let inPolygon = false;
      if (feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        inPolygon = turf.booleanPointInPolygon(point, polygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, polygon)) {
            inPolygon = true;
            break;
          }
        }
      }
      
      if (inPolygon) {
        // ✅ Verificar se é o mesmo país (comparar de forma flexível)
        const featureCountryId = feature.properties?.ISO_A3 || 
                                feature.properties?.ADM0_A3 || 
                                feature.properties?.ISO3 ||
                                feature.properties?.ISO_A2;
        // Comparar de forma case-insensitive e também verificar primeiros 3 caracteres
        return featureCountryId?.toUpperCase() === countryId?.toUpperCase() ||
               featureCountryId?.substring(0, 3)?.toUpperCase() === countryId?.substring(0, 3)?.toUpperCase();
      }
    }
    
    return false;
  };
  
  // ✅ GARANTIR que NPC tem posição válida antes de tentar gerar novo destino
  if (!npc.position || !npc.position.lat || !npc.position.lng ||
      isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
    logger.error(`NPC ${npc.npcId}: Não tem posição válida para escolher novo destino. Posição atual:`, npc.position);
    
    // ✅ Tentar recuperar posição do país (centroide aproximado) se não tiver posição válida
    if (npc.countryId) {
      const countryCoords = {
        'BRA': { lat: -14.2350, lng: -51.9253 },
        'USA': { lat: 37.0902, lng: -95.7129 },
        'ARG': { lat: -38.4161, lng: -63.6167 },
        'PER': { lat: -9.1900, lng: -75.0152 },
        'BOL': { lat: -16.2902, lng: -63.5887 },
        'COL': { lat: 4.5709, lng: -74.2973 },
        'VEN': { lat: 6.4238, lng: -66.5897 },
      };
      
      const knownCoords = countryCoords[npc.countryId?.toUpperCase()];
      if (knownCoords) {
        logger.info(`Recuperando posição do país ${npc.countryId} para NPC ${npc.npcId}`);
        try {
          await npcRepository.updateByNpcId(npc.npcId, {
            position: knownCoords
          });
          npc.position = knownCoords;
        } catch (updateError) {
          logger.error(`Erro ao recuperar posição do NPC ${npc.npcId}:`, updateError.message);
          return npc; // Retornar sem atualizar
        }
      } else {
        return npc; // Retornar sem atualizar se não conseguir recuperar
      }
    } else {
      return npc; // Retornar sem atualizar se não tiver countryId
    }
  }

  // ✅ Simplificar: Se verificação de terra firme não está disponível, permitir movimento
  // Se countriesGeoJSON não está disponível, apenas validar coordenadas e limites
  const canCheckLand = countriesGeoJSON && countriesGeoJSON.features && Array.isArray(countriesGeoJSON.features) && countriesGeoJSON.features.length > 0;
  
  // ✅ AUMENTAR MUITO a variação para NPCs VAGAREM PELO PAÍS INTEIRO (não apenas próximo)
  // Usar 2-10 graus = ~220-1100km de raio para permitir movimento pelo país inteiro
  const maxOffsetDegrees = 10; // ~1100km de raio máximo (PAÍS INTEIRO)
  const minOffsetDegrees = 2; // ~220km de raio mínimo (DISTÂNCIA CONSIDERÁVEL)
  
  // ✅ TENTAR PRIMEIRO: Gerar ponto ALEATÓRIO dentro do país usando GeoJSON (melhor distribuição)
  if (canCheckLand && npc.countryId) {
    // Encontrar feature do país do NPC
    let countryFeature = null;
    for (const feature of countriesGeoJSON.features) {
      const props = feature.properties || {};
      const featureCountryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2;
      if (featureCountryId?.toUpperCase() === npc.countryId?.toUpperCase() ||
          featureCountryId?.substring(0, 3)?.toUpperCase() === npc.countryId?.substring(0, 3)?.toUpperCase()) {
        countryFeature = feature;
        break;
      }
    }
    
    // ✅ Se encontrou o país, gerar ponto ALEATÓRIO dentro do polígono (ESPALHADO)
    if (countryFeature && countryFeature.geometry) {
      const bbox = turf.bbox(turf.feature(countryFeature.geometry));
      
      for (let geoAttempt = 0; geoAttempt < 30; geoAttempt++) {
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
        
        if (isInside && !isNaN(randomLat) && !isNaN(randomLng) &&
            randomLat >= -90 && randomLat <= 90 &&
            randomLng >= -180 && randomLng <= 180) {
          newPosition = { 
            lat: parseFloat(randomLat.toFixed(7)), 
            lng: parseFloat(randomLng.toFixed(7)) 
          };
          logger.info(`✅ NPC ${npc.npcId}: Destino ALEATÓRIO ESPALHADO gerado no país: ${newPosition.lat.toFixed(4)}, ${newPosition.lng.toFixed(4)}`);
          break;
        }
      }
    }
  }
  
  // ✅ FALLBACK: Se não conseguiu gerar ponto aleatório no país, usar offset grande do ponto atual
  while (attempts < 100 && !newPosition) {
    // ✅ Usar distribuição em círculo para melhor cobertura do território
    const angle = Math.random() * 2 * Math.PI; // Direção aleatória
    const radius = minOffsetDegrees + (Math.random() * (maxOffsetDegrees - minOffsetDegrees)); // 2-10 graus
    
    const randomOffsetLat = Math.cos(angle) * radius;
    const randomOffsetLng = Math.sin(angle) * radius;
    
    const testLat = npc.position.lat + randomOffsetLat;
    const testLng = npc.position.lng + randomOffsetLng;
    
    // ✅ Validar se coordenadas são válidas antes de verificar
    if (!isNaN(testLat) && !isNaN(testLng) &&
        testLat >= -90 && testLat <= 90 &&
        testLng >= -180 && testLng <= 180) {
      
      // ✅ Se pode verificar terra firme, verificar; senão, aceitar se estiver no mesmo país (aproximado)
      if (canCheckLand) {
        // Verificar se está em terra E no mesmo país
        if (isOnLand(testLat, testLng, countriesGeoJSON) && 
            isInSameCountry(testLat, testLng, npc.countryId, countriesGeoJSON)) {
          newPosition = { 
            lat: parseFloat(testLat.toFixed(7)), 
            lng: parseFloat(testLng.toFixed(7)) 
          };
        }
      } else {
        // ✅ Se não pode verificar terra firme, aceitar posição se estiver dentro do raio máximo
        // Usar limite de 10 graus para garantir que NPCs não saiam muito do país
        const distanceFromCurrent = Math.sqrt(
          Math.pow(testLat - npc.position.lat, 2) + 
          Math.pow(testLng - npc.position.lng, 2)
        );
        
        // ✅ Aceitar se estiver dentro do limite máximo (5 graus)
        // Isso permite movimento mesmo sem verificação de terra, mas mantém NPCs dentro do país aproximado
        if (distanceFromCurrent <= maxOffsetDegrees) {
          newPosition = { 
            lat: parseFloat(testLat.toFixed(7)), 
            lng: parseFloat(testLng.toFixed(7)) 
          };
        }
      }
    }
    attempts++;
  }

  // ✅ Se não encontrou posição válida após 100 tentativas, usar método alternativo
  if (!newPosition) {
    // ✅ GARANTIR que a posição atual do NPC é válida antes de usar
    if (!npc.position || !npc.position.lat || !npc.position.lng ||
        isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
      logger.error(`NPC ${npc.npcId}: Não tem posição válida para gerar novo destino após fallback`);
      return npc; // Retornar sem atualizar
    }
    
    // ✅ Tentar usar GeoJSON para encontrar ponto válido dentro do país
    if (canCheckLand && countriesGeoJSON) {
      // ✅ Buscar o país do NPC no GeoJSON e tentar gerar pontos dentro dele
      // Usar correspondência flexível de countryId
      let countryFeature = null;
      for (const feature of countriesGeoJSON.features) {
        const featureCountryId = feature.properties?.ISO_A3 || 
                                feature.properties?.ADM0_A3 || 
                                feature.properties?.ISO3 ||
                                feature.properties?.ISO_A2;
        // Comparar de forma case-insensitive e também verificar primeiros 3 caracteres
        if (featureCountryId?.toUpperCase() === npc.countryId?.toUpperCase() ||
            featureCountryId?.substring(0, 3)?.toUpperCase() === npc.countryId?.substring(0, 3)?.toUpperCase()) {
          countryFeature = feature;
          break;
        }
      }
      
      if (countryFeature) {
        // Tentar calcular um ponto aleatório dentro do polígono do país
        try {
          let polygon = null;
          if (countryFeature.geometry.type === 'Polygon') {
            polygon = turf.polygon(countryFeature.geometry.coordinates);
          } else if (countryFeature.geometry.type === 'MultiPolygon') {
            // Usar o maior polígono
            const largestPolygon = countryFeature.geometry.coordinates.reduce((largest, current) => {
              const currentSize = current[0]?.length || 0;
              const largestSize = largest[0]?.length || 0;
              return currentSize > largestSize ? current : largest;
            }, countryFeature.geometry.coordinates[0]);
            polygon = turf.polygon(largestPolygon);
          }
          
          if (polygon) {
            // Gerar ponto aleatório dentro do bounding box do país
            const bbox = turf.bbox(polygon);
            for (let i = 0; i < 20; i++) {
              const randomLat = bbox[1] + (Math.random() * (bbox[3] - bbox[1]));
              const randomLng = bbox[0] + (Math.random() * (bbox[2] - bbox[0]));
              
              if (isOnLand(randomLat, randomLng, countriesGeoJSON) && 
                  isInSameCountry(randomLat, randomLng, npc.countryId, countriesGeoJSON)) {
                newPosition = {
                  lat: parseFloat(randomLat.toFixed(7)),
                  lng: parseFloat(randomLng.toFixed(7))
                };
                break;
              }
            }
          }
        } catch (polyError) {
          logger.debug(`Erro ao gerar ponto aleatório no país:`, polyError.message);
        }
      }
    }
    
    // ✅ Fallback final: usar variação média baseada na posição atual (1 grau = ~110km)
    if (!newPosition) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 0.5 + (Math.random() * 1.5); // 0.5-2 graus
      const randomOffsetLat = Math.cos(angle) * radius;
      const randomOffsetLng = Math.sin(angle) * radius;
      
      newPosition = {
        lat: parseFloat((npc.position.lat + randomOffsetLat).toFixed(7)),
        lng: parseFloat((npc.position.lng + randomOffsetLng).toFixed(7))
      };
    }
    
    // ✅ Validar posição gerada
    if (newPosition.lat < -90 || newPosition.lat > 90 ||
        newPosition.lng < -180 || newPosition.lng > 180 ||
        isNaN(newPosition.lat) || isNaN(newPosition.lng)) {
      logger.error(`NPC ${npc.npcId}: Posição gerada inválida após fallback:`, newPosition);
      return npc; // Retornar sem atualizar
    }
  }

  // ✅ GARANTIR que newPosition seja válida antes de atualizar
  if (!newPosition || !newPosition.lat || !newPosition.lng || 
      isNaN(newPosition.lat) || isNaN(newPosition.lng)) {
    logger.error(`NPC ${npc.npcId}: Não foi possível gerar posição válida para novo destino`);
    return npc; // Retornar sem atualizar
  }
  
  // Validar limites
  if (newPosition.lat < -90 || newPosition.lat > 90 || 
      newPosition.lng < -180 || newPosition.lng > 180) {
    logger.error(`NPC ${npc.npcId}: Posição gerada fora dos limites:`, newPosition);
    return npc;
  }

  try {
    await npcRepository.updateByNpcId(npc.npcId, {
      targetPosition: { lat: parseFloat(newPosition.lat), lng: parseFloat(newPosition.lng) },
      status: 'walking'
    });
    
    npc.targetPosition = newPosition;
    npc.status = 'walking';
  } catch (error) {
    logger.error(`Erro ao atualizar destino do NPC ${npc.npcId}:`, error.message || error);
    // Não atualizar objeto local em caso de erro
    return npc;
  }

  return npc;
};

/**
 * Processar movimento de todos os NPCs
 */
export const processAllNPCsMovement = async () => {
  if (!checkConnection()) {
    return { updated: 0, idleProcessed: 0, npcs: [] };
  }

  const npcs = await npcRepository.findByStatus('walking');
  let updated = 0;
  const updatedNPCs = [];

  for (const npc of npcs) {
    try {
      // ✅ GARANTIR que NPC tem posição válida antes de tentar atualizar
      if (!npc.position || !npc.position.lat || !npc.position.lng ||
          isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
        logger.warn(`NPC ${npc.npcId} não tem posição válida. Pulando atualização.`);
        continue; // Pular este NPC
      }
      
      const updatedNPC = await updateNPCPosition(npc.npcId);
      if (updatedNPC) {
        updated++;
        updatedNPCs.push(updatedNPC);
      }
    } catch (error) {
      logger.error(`Erro ao atualizar NPC ${npc.npcId}:`, error.message || error);
    }
  }

  // Carregar GeoJSON uma vez para todos os NPCs (melhor performance)
  let countriesGeoJSON = null;
  try {
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (fs.existsSync(geoJsonPath)) {
      const data = fs.readFileSync(geoJsonPath, 'utf8');
      countriesGeoJSON = JSON.parse(data);
    }
  } catch (error) {
    logger.warn('Não foi possível carregar GeoJSON para movimento de NPCs:', error);
  }

  // ✅ Escolher novos destinos para NPCs idle (a cada 30 segundos)
  // ✅ Filtrar apenas NPCs com posição válida
  const allIdleNPCs = await npcRepository.findByStatus('idle');
  const now = new Date();
  const idleNPCs = allIdleNPCs
    .filter(npc => {
      // ✅ GARANTIR que NPC tem posição válida
      if (!npc.position || !npc.position.lat || !npc.position.lng ||
          isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
        return false; // Filtrar NPCs sem posição válida
      }
      return !npc.nextActionTime || new Date(npc.nextActionTime) <= now;
    })
    .slice(0, 50); // Processar até 50 por vez

  let idleProcessed = 0;
  for (const npc of idleNPCs) {
    try {
      // ✅ GARANTIR que NPC ainda tem posição válida antes de processar
      if (!npc.position || !npc.position.lat || !npc.position.lng ||
          isNaN(npc.position.lat) || isNaN(npc.position.lng)) {
        logger.warn(`NPC ${npc.npcId} não tem posição válida. Pulando escolha de destino.`);
        continue; // Pular este NPC
      }
      
      // Definir próxima ação em 30-120 segundos
      const nextActionTime = new Date(Date.now() + (30000 + Math.random() * 90000));
      await npcRepository.updateByNpcId(npc.npcId, {
        nextActionTime: nextActionTime
      });
      npc.nextActionTime = nextActionTime;
      
      const updatedNPC = await chooseNextDestination(npc, countriesGeoJSON);
      if (updatedNPC && updatedNPC.status === 'walking') {
        updatedNPCs.push(updatedNPC);
        idleProcessed++;
      }
    } catch (error) {
      logger.error(`Erro ao escolher destino para NPC ${npc.npcId}:`, error.message || error);
    }
  }

  return { 
    updated, 
    idleProcessed: idleProcessed || 0, // ✅ Usar contador correto
    npcs: updatedNPCs
      .filter(npc => npc && npc.position && npc.position.lat != null && npc.position.lng != null) // ✅ Filtrar NPCs com posição válida
      .map(npc => ({
        npcId: npc.npcId,
        position: npc.position,
        targetPosition: npc.targetPosition,
        status: npc.status,
        npcType: npc.npcType,
        name: npc.name,
        countryId: npc.countryId
      }))
  };
};

/**
 * Obter NPCs de um país
 */
export const getNPCsByCountry = async (countryId) => {
  if (!checkConnection()) {
    return [];
  }
  
  const npcs = await npcRepository.findByCountryId(countryId);
  return npcs;
};

/**
 * Obter TODOS os NPCs (para mostrar no mapa)
 * ✅ Retorna array vazio se banco não estiver disponível
 */
export const getAllNPCs = async () => {
  try {
    if (!checkConnection()) {
      logger.warn('⚠️  Supabase não está conectado. Retornando array vazio de NPCs.');
      return [];
    }

    const npcs = await npcRepository.findAll({ limit: 1000 });
    return npcs;
  } catch (error) {
    // ✅ NÃO QUEBRAR A APLICAÇÃO - Retornar array vazio
    logger.error('Erro ao obter todos os NPCs:', error.message || error);
    logger.warn('⚠️  Retornando array vazio de NPCs devido ao erro.');
    return []; // Retornar array vazio em vez de quebrar
  }
};

