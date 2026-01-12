import { getIO } from './socketHandler.js';
import npcRepository from '../repositories/npcRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCSocketHandler');

// ✅ FASE 19.2: Armazenar viewport (bounding box) de cada jogador
const playerViewports = new Map(); // socketId -> { bounds, lastUpdate }

/**
 * ✅ FASE 19.2: Atualizar viewport do jogador
 */
export const updatePlayerViewport = (socketId, bounds) => {
  if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
    return;
  }

  playerViewports.set(socketId, {
    bounds,
    lastUpdate: Date.now()
  });
};

/**
 * ✅ FASE 19.2: Filtrar NPCs dentro do bounding box (viewport)
 */
const filterNPCsInViewport = (npcs, bounds) => {
  if (!bounds || !npcs || npcs.length === 0) {
    return [];
  }

  return npcs.filter(npc => {
    if (!npc.positionLat || !npc.positionLng) {
      return false;
    }

    const lat = npc.positionLat || npc.position?.lat;
    const lng = npc.positionLng || npc.position?.lng;

    // Verificar se NPC está dentro do bounding box
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });
};

/**
 * ✅ FASE 19.2: Emitir atualização de NPCs apenas para jogadores no viewport
 * Reduz payload de Socket.io de 1000+ objetos para apenas os visíveis
 */
export const emitNPCUpdates = async (npcs = null) => {
  try {
    const io = getIO();
    if (!io) {
      logger.debug('Socket.io não está inicializado');
      return;
    }

    // Buscar NPCs se não foram fornecidos
    let allNPCs = npcs;
    if (!allNPCs) {
      allNPCs = await npcRepository.find({});
    }

    if (!allNPCs || allNPCs.length === 0) {
      return;
    }

    // ✅ Enviar apenas NPCs visíveis para cada jogador (baseado no viewport)
    const sockets = await io.fetchSockets();
    
    for (const socket of sockets) {
      const viewport = playerViewports.get(socket.id);
      
      if (viewport && viewport.bounds) {
        // Filtrar NPCs dentro do viewport do jogador
        const visibleNPCs = filterNPCsInViewport(allNPCs, viewport.bounds);
        
        // ✅ Enviar apenas NPCs visíveis (reduz payload significativamente)
        socket.emit('npcs:update', {
          npcs: visibleNPCs.map(npc => ({
            npcId: npc.npcId,
            name: npc.name,
            position: {
              lat: npc.positionLat || npc.position?.lat,
              lng: npc.positionLng || npc.position?.lng
            },
            routineState: npc.routineState,
            status: npc.status,
            cityName: npc.cityName
          })),
          timestamp: new Date().toISOString(),
          totalNPCs: allNPCs.length,
          visibleNPCs: visibleNPCs.length
        });
      } else {
        // Se não tiver viewport, enviar NPCs vazios (jogador precisa atualizar viewport)
        socket.emit('npcs:update', {
          npcs: [],
          timestamp: new Date().toISOString(),
          totalNPCs: allNPCs.length,
          visibleNPCs: 0,
          message: 'Atualize o viewport para receber NPCs'
        });
      }
    }

    logger.debug(`✅ NPCs atualizados: ${allNPCs.length} total, enviados para ${sockets.length} jogadores`);
  } catch (error) {
    logger.error('Erro ao emitir atualizações de NPCs:', error);
  }
};

/**
 * ✅ FASE 19.2: Remover viewport quando jogador desconectar
 */
export const removePlayerViewport = (socketId) => {
  playerViewports.delete(socketId);
};

