/**
 * ✅ FASE 19.2: Throttling de Socket.io para NPCs
 * Envia apenas NPCs dentro do campo de visão (Bounding Box) do jogador
 */

import { getIO } from './socketHandler.js';
import { createLogger } from '../utils/logger.js';
import * as turf from '@turf/turf';

const logger = createLogger('NPCBroadcast');

// Armazenar viewport de cada jogador (socketId -> boundingBox)
const playerViewports = new Map();

/**
 * Atualizar viewport de um jogador
 */
export const updatePlayerViewport = (socketId, bounds) => {
  // bounds deve ser { north, south, east, west } ou Leaflet bounds
  let boundingBox = null;
  
  if (bounds && typeof bounds.getNorth === 'function') {
    // Leaflet bounds object
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    boundingBox = {
      north: ne.lat,
      south: sw.lat,
      east: ne.lng,
      west: sw.lng
    };
  } else if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
    // Objeto bounds direto
    boundingBox = bounds;
  }
  
  if (boundingBox) {
    playerViewports.set(socketId, boundingBox);
    logger.debug(`Viewport atualizado para ${socketId}:`, boundingBox);
  }
};

/**
 * Remover viewport de um jogador (quando desconecta)
 */
export const removePlayerViewport = (socketId) => {
  playerViewports.delete(socketId);
};

/**
 * Verificar se NPC está dentro do bounding box
 */
const isNPCInBounds = (npc, boundingBox) => {
  if (!npc.positionLat || !npc.positionLng) {
    return false;
  }
  
  const lat = parseFloat(npc.positionLat);
  const lng = parseFloat(npc.positionLng);
  
  return (
    lat >= boundingBox.south &&
    lat <= boundingBox.north &&
    lng >= boundingBox.west &&
    lng <= boundingBox.east
  );
};

/**
 * Filtrar NPCs dentro do viewport de um jogador
 */
const filterNPCsInViewport = (npcs, socketId) => {
  const viewport = playerViewports.get(socketId);
  
  if (!viewport) {
    // Se não tem viewport, retornar array vazio (jogador não está no mapa)
    return [];
  }
  
  return npcs.filter(npc => isNPCInBounds(npc, viewport));
};

/**
 * Emitir atualização de NPCs apenas para jogadores com viewport definido
 * Envia apenas NPCs visíveis no campo de visão de cada jogador
 */
export const broadcastNPCUpdates = (npcs) => {
  const io = getIO();
  if (!io) {
    logger.warn('Socket.io não inicializado, não é possível enviar atualizações de NPCs');
    return;
  }
  
  // Agrupar NPCs por socketId (jogador)
  const npcsByPlayer = new Map();
  
  // Para cada jogador conectado, filtrar NPCs visíveis
  io.sockets.sockets.forEach((socket) => {
    const visibleNPCs = filterNPCsInViewport(npcs, socket.id);
    if (visibleNPCs.length > 0) {
      npcsByPlayer.set(socket.id, visibleNPCs);
    }
  });
  
  // Enviar apenas NPCs visíveis para cada jogador
  npcsByPlayer.forEach((visibleNPCs, socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('npc:updates', {
        npcs: visibleNPCs,
        count: visibleNPCs.length,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  const totalNPCs = npcs.length;
  const totalVisible = Array.from(npcsByPlayer.values()).reduce((sum, npcs) => sum + npcs.length, 0);
  
  logger.debug(`NPCs enviados: ${totalVisible} visíveis de ${totalNPCs} total`);
};

/**
 * Emitir atualização de NPC para um jogador específico
 */
export const emitNPCUpdateToPlayer = (socketId, npc) => {
  const io = getIO();
  if (!io) {
    return;
  }
  
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) {
    return;
  }
  
  const viewport = playerViewports.get(socketId);
  if (!viewport || !isNPCInBounds(npc, viewport)) {
    // NPC não está visível para este jogador
    return;
  }
  
  socket.emit('npc:update', {
    npc,
    timestamp: new Date().toISOString()
  });
};

