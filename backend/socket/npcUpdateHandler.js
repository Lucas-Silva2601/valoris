/**
 * ✅ FASE 19.2: Handler de atualização de NPCs com throttling baseado em Bounding Box
 * Envia apenas NPCs que estão visíveis na viewport do cliente
 */

import { getIO } from './socketHandler.js';
import npcRepository from '../repositories/npcRepository.js';
import * as turf from '@turf/turf';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCUpdateHandler');

// Armazenar viewport bounds por socket ID
const socketViewports = new Map();

/**
 * Atualizar viewport bounds de um socket
 */
export const updateSocketViewport = (socketId, bounds) => {
  if (!bounds || !bounds.southwest || !bounds.northeast) {
    return;
  }
  
  socketViewports.set(socketId, bounds);
  
  // Limpar viewport após 30 segundos de inatividade
  setTimeout(() => {
    socketViewports.delete(socketId);
  }, 30000);
};

/**
 * Filtrar NPCs dentro do bounding box
 */
const filterNPCsInBounds = (npcs, bounds) => {
  if (!bounds || !bounds.southwest || !bounds.northeast) {
    return npcs; // Se não tiver bounds, retornar todos (fallback)
  }
  
  const { southwest, northeast } = bounds;
  const bbox = turf.bbox(turf.polygon([[
    [southwest.lng, southwest.lat],
    [northeast.lng, southwest.lat],
    [northeast.lng, northeast.lat],
    [southwest.lng, northeast.lat],
    [southwest.lng, southwest.lat]
  ]]));
  
  return npcs.filter(npc => {
    if (!npc.positionLat || !npc.positionLng) {
      return false;
    }
    
    const point = turf.point([npc.positionLng, npc.positionLat]);
    return turf.booleanPointInPolygon(point, turf.bboxPolygon(bbox));
  });
};

/**
 * Emitir atualizações de NPCs para sockets com viewport conhecida
 */
export const emitNPCUpdates = async () => {
  try {
    const io = getIO();
    if (!io) {
      return;
    }
    
    // Buscar todos os NPCs
    const allNPCs = await npcRepository.find({});
    
    // Para cada socket com viewport conhecida, enviar apenas NPCs visíveis
    for (const [socketId, bounds] of socketViewports.entries()) {
      try {
        const visibleNPCs = filterNPCsInBounds(allNPCs, bounds);
        
        // Converter NPCs para formato de atualização
        const npcUpdates = visibleNPCs.map(npc => ({
          npcId: npc.npcId || npc.id,
          position: {
            lat: npc.positionLat,
            lng: npc.positionLng
          },
          routineState: npc.routineState,
          status: npc.status,
          direction: npc.direction
        }));
        
        // Emitir apenas para este socket específico
        io.to(socketId).emit('npcs:update', {
          npcs: npcUpdates,
          count: npcUpdates.length,
          bounds,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Erro ao emitir atualizações de NPCs para socket ${socketId}:`, error);
      }
    }
    
    // Se houver sockets sem viewport, enviar todos os NPCs (com limite)
    const socketsWithoutViewport = Array.from(io.sockets.sockets.keys())
      .filter(id => !socketViewports.has(id));
    
    if (socketsWithoutViewport.length > 0) {
      // Limitar a 100 NPCs para não sobrecarregar
      const limitedNPCs = allNPCs.slice(0, 100).map(npc => ({
        npcId: npc.npcId || npc.id,
        position: {
          lat: npc.positionLat,
          lng: npc.positionLng
        },
        routineState: npc.routineState,
        status: npc.status,
        direction: npc.direction
      }));
      
      for (const socketId of socketsWithoutViewport) {
        io.to(socketId).emit('npcs:update', {
          npcs: limitedNPCs,
          count: limitedNPCs.length,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    logger.error('Erro ao emitir atualizações de NPCs:', error);
  }
};

/**
 * Remover viewport de um socket ao desconectar
 */
export const removeSocketViewport = (socketId) => {
  socketViewports.delete(socketId);
};
