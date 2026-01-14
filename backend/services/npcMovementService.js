import * as turf from '@turf/turf';
import { createLogger } from '../utils/logger.js';
import npcRepository from '../repositories/npcRepository.js';
import { getCountryPolygon } from './geoHierarchyService.js';

const logger = createLogger('NPCMovementService');

/**
 * 🚶 FASE 20: Sistema de Caminhada Inteligente (Wander AI)
 * 
 * NPCs andam livremente pelo território do país, sem sair das fronteiras.
 * A cada 10 segundos, escolhem um novo destino aleatório.
 */

/**
 * ✅ PASSO 4: MOVIMENTO DE LONGO ALCANCE
 * Gerar destino aleatório a pelo menos 200km de distância
 * Isso garante que os NPCs REALMENTE andem pelo território
 */
async function generateWanderDestination(npc, minDistanceKm = 200, maxDistanceKm = 500) {
  try {
    const currentPos = turf.point([npc.positionLng, npc.positionLat]);
    
    // Obter polígono do país
    const countryPolygon = await getCountryPolygon(npc.countryId);
    if (!countryPolygon) {
      logger.warn(`País ${npc.countryId} não tem polígono definido`);
      return null;
    }
    
    // Obter BBox do país para gerar pontos aleatórios
    const bbox = turf.bbox(countryPolygon);
    
    // Tentar até 50 vezes encontrar um destino válido
    for (let attempt = 0; attempt < 50; attempt++) {
      // Gerar ponto aleatório dentro do BBox do país
      const randomPoints = turf.randomPoint(1, { bbox });
      const destination = randomPoints.features[0];
      
      // Validar se está dentro do polígono
      const isInside = turf.booleanPointInPolygon(destination, countryPolygon);
      
      if (!isInside) continue;
      
      const [lng, lat] = destination.geometry.coordinates;
      
      // Calcular distância do ponto atual
      const distance = turf.distance(currentPos, destination, { units: 'kilometers' });
      
      // ✅ VALIDAÇÃO: Deve estar a pelo menos 200km de distância
      if (distance >= minDistanceKm && distance <= maxDistanceKm) {
        logger.debug(`NPC ${npc.npcId} vai andar ${distance.toFixed(0)}km`);
        return { lat, lng };
      }
    }
    
    // Se não conseguiu com a distância mínima, aceitar qualquer ponto válido
    for (let attempt = 0; attempt < 30; attempt++) {
      const randomPoints = turf.randomPoint(1, { bbox });
      const destination = randomPoints.features[0];
      
      const isInside = turf.booleanPointInPolygon(destination, countryPolygon);
      
      if (isInside) {
        const [lng, lat] = destination.geometry.coordinates;
        return { lat, lng };
      }
    }
    
    // Se ainda não conseguiu, ficar parado
    logger.debug(`NPC ${npc.npcId} não conseguiu encontrar destino válido, ficando parado`);
    return null;
    
  } catch (error) {
    logger.error(`Erro ao gerar destino para NPC ${npc.npcId}:`, error);
    return null;
  }
}

/**
 * Atualizar movimento de um NPC individual
 */
export async function updateNPCMovement(npc) {
  try {
    // Verificar se NPC tem posição válida
    if (!npc.positionLat || !npc.positionLng) {
      return npc;
    }
    
    // Verificar se NPC tem país definido
    if (!npc.countryId) {
      return npc;
    }
    
    // Gerar novo destino
    const destination = await generateWanderDestination(npc);
    
    if (!destination) {
      // Não conseguiu gerar destino, manter posição atual
      return npc;
    }
    
    // Atualizar posição do NPC no banco
    await npcRepository.update(npc.id, {
      positionLat: destination.lat,
      positionLng: destination.lng,
      status: 'walking'
    });
    
    // Retornar NPC atualizado
    return {
      ...npc,
      positionLat: destination.lat,
      positionLng: destination.lng,
      position: {
        lat: destination.lat,
        lng: destination.lng
      },
      status: 'walking'
    };
    
  } catch (error) {
    logger.error(`Erro ao atualizar movimento do NPC ${npc.npcId}:`, error);
    return npc;
  }
}

/**
 * Processar movimento de todos os NPCs
 */
export async function processAllNPCMovement() {
  try {
    const allNPCs = await npcRepository.find({});
    
    logger.info(`🚶 Processando movimento de ${allNPCs.length} NPCs...`);
    
    let moved = 0;
    let stayed = 0;
    let errors = 0;
    
    // Processar em lotes de 50 para não sobrecarregar
    const batchSize = 50;
    for (let i = 0; i < allNPCs.length; i += batchSize) {
      const batch = allNPCs.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (npc) => {
        try {
          // Pular NPCs sem coordenadas ou país
          if (!npc.positionLat || !npc.positionLng || !npc.countryId) {
            stayed++;
            return;
          }
          
          const updatedNPC = await updateNPCMovement(npc);
          
          if (updatedNPC.positionLat !== npc.positionLat || updatedNPC.positionLng !== npc.positionLng) {
            moved++;
          } else {
            stayed++;
          }
        } catch (error) {
          errors++;
          logger.error(`Erro ao processar NPC ${npc.npcId}:`, error);
        }
      }));
    }
    
    logger.info(`✅ Movimento processado: ${moved} moveram, ${stayed} ficaram parados, ${errors} erros`);
    
  } catch (error) {
    logger.error('Erro ao processar movimento de NPCs:', error);
  }
}

/**
 * Verificar se um ponto está longe o suficiente de outros NPCs
 */
export function isPointFarEnough(point, existingPoints, minDistanceKm = 50) {
  const pointCoord = turf.point(point);
  
  for (const existing of existingPoints) {
    const existingCoord = turf.point(existing);
    const distance = turf.distance(pointCoord, existingCoord, { units: 'kilometers' });
    
    if (distance < minDistanceKm) {
      return false;
    }
  }
  
  return true;
}

/**
 * Gerar posição inicial aleatória dentro de um país
 * (Usado no seed/criação de NPCs)
 */
export async function generateRandomPositionInCountry(countryId, existingPositions = []) {
  try {
    const countryPolygon = await getCountryPolygon(countryId);
    if (!countryPolygon) {
      logger.warn(`País ${countryId} não tem polígono definido`);
      return null;
    }
    
    // Obter bbox do país
    const bbox = turf.bbox(countryPolygon);
    
    // Tentar até 100 vezes encontrar um ponto válido
    for (let attempt = 0; attempt < 100; attempt++) {
      // Gerar ponto aleatório dentro do bbox
      const randomPoints = turf.randomPoint(1, { bbox });
      const point = randomPoints.features[0];
      
      // Verificar se está dentro do polígono
      const isInside = turf.booleanPointInPolygon(point, countryPolygon);
      
      if (!isInside) continue;
      
      const [lng, lat] = point.geometry.coordinates;
      
      // Verificar se está longe o suficiente de outros NPCs
      if (existingPositions.length > 0) {
        const isFarEnough = isPointFarEnough([lng, lat], existingPositions, 50);
        if (!isFarEnough) continue;
      }
      
      return { lat, lng };
    }
    
    logger.warn(`Não conseguiu gerar posição válida para país ${countryId} após 100 tentativas`);
    return null;
    
  } catch (error) {
    logger.error(`Erro ao gerar posição aleatória para país ${countryId}:`, error);
    return null;
  }
}

export default {
  updateNPCMovement,
  processAllNPCMovement,
  generateRandomPositionInCountry,
  isPointFarEnough
};

