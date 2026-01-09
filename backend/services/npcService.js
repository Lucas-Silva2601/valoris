import NPC from '../models/NPC.js';
import Building from '../models/Building.js';
import mongoose from 'mongoose';
import * as turf from '@turf/turf';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCService');

/**
 * Verificar se uma coordenada está em terra firme (dentro de algum país)
 */
const isOnLand = (lat, lng, countriesGeoJSON) => {
  if (!countriesGeoJSON || !countriesGeoJSON.features) {
    // Se não tiver GeoJSON, assumir que está em terra (para não bloquear movimento)
    return true;
  }

  const point = turf.point([lng, lat]);
  
  // Verificar se o ponto está dentro de algum país (polígono)
  for (const feature of countriesGeoJSON.features) {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      const polygon = turf.polygon(feature.geometry.coordinates);
      if (turf.booleanPointInPolygon(point, polygon)) {
        return true;
      }
    } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      // Para MultiPolygon, verificar cada polígono
      for (const coords of feature.geometry.coordinates) {
        const polygon = turf.polygon(coords);
        if (turf.booleanPointInPolygon(point, polygon)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Criar NPC em um país
 */
export const createNPC = async (countryId, countryName, buildingId = null, customPosition = null) => {
  const npcId = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determinar posição
  let position = { lat: 0, lng: 0 };
  
  if (customPosition) {
    // Usar posição customizada se fornecida
    position = customPosition;
  } else if (buildingId) {
    const building = await Building.findOne({ buildingId });
    if (building) {
      position = building.position;
    }
  } else {
    // Gerar posição aleatória baseada no countryId (para NPCs sem edifício)
    const hash = countryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseLat = (hash % 180) - 90;
    const baseLng = ((hash * 7) % 360) - 180;
    const randomOffset = (Math.random() - 0.5) * 5; // ~5 graus de variação
    position = {
      lat: baseLat + randomOffset,
      lng: baseLng + randomOffset
    };
  }

  const npc = new NPC({
    npcId,
    // name será gerado automaticamente pelo modelo (default function)
    countryId,
    countryName,
    position,
    homeBuilding: buildingId,
    status: 'idle',
    npcType: Math.random() > 0.5 ? 'resident' : 'worker',
    speed: 5, // km/h
    lastMovementTime: new Date(),
    nextActionTime: new Date(Date.now() + (30000 + Math.random() * 90000)) // 30-120 segundos
  });

  await npc.save();
  logger.info(`👤 NPC criado: ${npc.npcId} em ${countryName}`);
  return npc;
};

/**
 * Criar NPCs automaticamente para edifícios (residentes)
 */
export const createNPCsForBuilding = async (building) => {
  const NPC = (await import('../models/NPC.js')).default;
  const npcsToCreate = Math.floor(building.capacity * 0.3); // 30% da capacidade

  for (let i = 0; i < npcsToCreate; i++) {
    await createNPC(building.countryId, building.countryName, building._id);
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
      
      // Definir o NPC para ir até a construção (status working = construindo)
      npc.status = 'working';
      npc.targetPosition = building.position;
      npc.workBuilding = building._id;
      npc.lastMovementTime = new Date();
      await npc.save();
      
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
  const npc = await NPC.findById(npcId);
  if (!npc || npc.status !== 'walking') {
    return null;
  }

  if (!npc.targetPosition || !npc.targetPosition.lat || !npc.targetPosition.lng) {
    npc.status = 'idle';
    await npc.save();
    return npc;
  }

  // Calcular distância e tempo decorrido
  const from = turf.point([npc.position.lng, npc.position.lat]);
  const to = turf.point([npc.targetPosition.lng, npc.targetPosition.lat]);
  const distanceKm = turf.distance(from, to, { units: 'kilometers' });
  
  const timeElapsedMs = new Date() - npc.lastMovementTime;
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
  const distanceTraveledKm = npc.speed * timeElapsedHours;

  // Se chegou ao destino
  if (distanceTraveledKm >= distanceKm) {
    npc.position = npc.targetPosition;
    npc.targetPosition = null;
    npc.status = 'idle';
    npc.lastMovementTime = new Date();
    await npc.save();
    return npc;
  }

  // Calcular nova posição (interpolação linear)
  const progress = distanceTraveledKm / distanceKm;
  let newLat = npc.position.lat + (npc.targetPosition.lat - npc.position.lat) * progress;
  let newLng = npc.position.lng + (npc.targetPosition.lng - npc.position.lng) * progress;

  // Verificar se a nova posição está em terra firme (se possível)
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
      
      // Se não está em terra, ajustar para ficar em terra
      if (!isOnLand(newLat, newLng, countriesGeoJSON)) {
        // Tentar encontrar posição próxima que esteja em terra
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
  } catch (error) {
    // Se não conseguir verificar, permitir movimento (para não bloquear)
    logger.warn('Erro ao verificar terra firme para NPC:', error);
  }

  // Calcular direção
  const bearing = turf.bearing(from, to);
  npc.direction = bearing < 0 ? bearing + 360 : bearing;

  npc.position = { lat: newLat, lng: newLng };
  npc.lastMovementTime = new Date();
  await npc.save();

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
  if (npc.homeBuilding && npc.workBuilding) {
    const Building = (await import('../models/Building.js')).default;
    const currentBuilding = await Building.findById(
      npc.status === 'working' ? npc.workBuilding : npc.homeBuilding
    );
    
    if (currentBuilding) {
      const targetBuilding = await Building.findById(
        npc.status === 'working' ? npc.homeBuilding : npc.workBuilding
      );
      
      if (targetBuilding && isOnLand(targetBuilding.position.lat, targetBuilding.position.lng, countriesGeoJSON)) {
        npc.targetPosition = targetBuilding.position;
        npc.status = 'walking';
        await npc.save();
        return npc;
      }
    }
  }

  // Se não tem destino específico, escolher edifício aleatório próximo (em terra)
  const Building = (await import('../models/Building.js')).default;
  const nearbyBuildings = await Building.find({
    countryId: npc.countryId,
    position: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [npc.position.lng, npc.position.lat]
        },
        $maxDistance: 5000 // 5km de raio
      }
    }
  }).limit(10); // Buscar mais edifícios para ter opções

  // Filtrar apenas edifícios em terra firme
  const validBuildings = nearbyBuildings.filter(building => 
    isOnLand(building.position.lat, building.position.lng, countriesGeoJSON)
  );

  if (validBuildings.length > 0) {
    const randomBuilding = validBuildings[Math.floor(Math.random() * validBuildings.length)];
    npc.targetPosition = randomBuilding.position;
    npc.status = 'walking';
    await npc.save();
    return npc;
  }

  // Se não há edifícios próximos, escolher posição aleatória em terra firme
  // Tentar várias posições até encontrar uma em terra
  let attempts = 0;
  let newPosition = null;
  
  while (attempts < 20 && !newPosition) {
    // Variação de ~1-5km da posição atual
    const randomOffsetLat = (Math.random() - 0.5) * (0.01 + Math.random() * 0.04);
    const randomOffsetLng = (Math.random() - 0.5) * (0.01 + Math.random() * 0.04);
    
    const testLat = npc.position.lat + randomOffsetLat;
    const testLng = npc.position.lng + randomOffsetLng;
    
    if (isOnLand(testLat, testLng, countriesGeoJSON)) {
      newPosition = { lat: testLat, lng: testLng };
    }
    attempts++;
  }

  // Se não encontrou posição em terra após 20 tentativas, usar variação pequena (assumir que já está em terra)
  if (!newPosition) {
    const randomOffset = (Math.random() - 0.5) * 0.01; // ~1km
    newPosition = {
      lat: npc.position.lat + randomOffset,
      lng: npc.position.lng + randomOffset
    };
  }

  npc.targetPosition = newPosition;
  npc.status = 'walking';
  await npc.save();

  return npc;
};

/**
 * Processar movimento de todos os NPCs
 */
export const processAllNPCsMovement = async () => {
  const npcs = await NPC.find({ status: 'walking' });
  let updated = 0;
  const updatedNPCs = [];

  for (const npc of npcs) {
    try {
      const updatedNPC = await updateNPCPosition(npc._id);
      if (updatedNPC) {
        updated++;
        updatedNPCs.push(updatedNPC);
      }
    } catch (error) {
      logger.error(`Erro ao atualizar NPC ${npc.npcId}:`, error);
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

  // Escolher novos destinos para NPCs idle (a cada 30 segundos)
  const idleNPCs = await NPC.find({ 
    status: 'idle',
    nextActionTime: { $lte: new Date() }
  }).limit(50); // Processar até 50 por vez

  for (const npc of idleNPCs) {
    try {
      // Definir próxima ação em 30-120 segundos
      npc.nextActionTime = new Date(Date.now() + (30000 + Math.random() * 90000));
      const updatedNPC = await chooseNextDestination(npc, countriesGeoJSON);
      if (updatedNPC && updatedNPC.status === 'walking') {
        updatedNPCs.push(updatedNPC);
      }
    } catch (error) {
      logger.error(`Erro ao escolher destino para NPC ${npc.npcId}:`, error);
    }
  }

  return { 
    updated, 
    idleProcessed: idleNPCs.length,
    npcs: updatedNPCs.map(npc => ({
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
  return await NPC.find({ countryId })
    .populate('homeBuilding', 'buildingId name type position')
    .populate('workBuilding', 'buildingId name type position')
    .sort({ createdAt: -1 });
};

/**
 * Obter TODOS os NPCs (para mostrar no mapa)
 * ✅ Retorna array vazio se banco não estiver disponível
 */
export const getAllNPCs = async () => {
  try {
    // Verificar se MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      logger.warn('⚠️  MongoDB não está conectado. Retornando array vazio de NPCs.');
      return [];
    }

    const npcs = await NPC.find()
      .populate('homeBuilding', 'buildingId name type position')
      .populate('workBuilding', 'buildingId name type position')
      .sort({ createdAt: -1 })
      .limit(1000) // Limitar a 1000 NPCs para performance
      .lean(); // Usar lean() para melhor performance
    
    // Converter ObjectIds para strings se necessário
    return npcs.map(npc => ({
      ...npc,
      _id: npc._id.toString(),
      homeBuilding: npc.homeBuilding ? {
        ...npc.homeBuilding,
        _id: npc.homeBuilding._id?.toString()
      } : null,
      workBuilding: npc.workBuilding ? {
        ...npc.workBuilding,
        _id: npc.workBuilding._id?.toString()
      } : null
    }));
  } catch (error) {
    // ✅ NÃO QUEBRAR A APLICAÇÃO - Retornar array vazio
    logger.error('Erro ao obter todos os NPCs:', error.message || error);
    logger.warn('⚠️  Retornando array vazio de NPCs devido ao erro.');
    return []; // Retornar array vazio em vez de quebrar
  }
};

