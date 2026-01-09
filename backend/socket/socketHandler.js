import { io } from '../server.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Salas/rooms por país
const countryRooms = new Map();
// Salas por usuário
const userRooms = new Map();

/**
 * Autenticar conexão Socket.io
 */
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    const userId = socket.handshake.auth.userId || socket.handshake.headers['user-id'];

    // Por enquanto, usar userId direto (em produção, validar JWT)
    if (userId) {
      socket.userId = userId;
      socket.username = socket.handshake.auth.username || 'user';
      return next();
    }

    // Se não tiver token, permitir conexão anônima para testes
    socket.userId = 'anonymous';
    socket.username = 'anonymous';
    next();
  } catch (error) {
    console.error('Erro na autenticação Socket:', error);
    next(new Error('Autenticação falhou'));
  }
};

/**
 * Configurar handlers de Socket.io
 */
export const setupSocketHandlers = () => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id} (User: ${socket.userId})`);

    // Criar sala para o usuário
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    userRooms.set(socket.userId, userRoom);

    // Enviar estado inicial
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });

    // Entrar em sala de país
    socket.on('join_country', (countryId) => {
      const countryRoom = `country:${countryId}`;
      socket.join(countryRoom);
      countryRooms.set(countryId, countryRoom);
      
      socket.emit('joined_country', {
        countryId,
        message: `Entrou na sala do país ${countryId}`
      });

      console.log(`📍 Usuário ${socket.userId} entrou na sala do país ${countryId}`);
    });

    // Sair de sala de país
    socket.on('leave_country', (countryId) => {
      const countryRoom = `country:${countryId}`;
      socket.leave(countryRoom);
      
      socket.emit('left_country', {
        countryId,
        message: `Saiu da sala do país ${countryId}`
      });
    });

    // Solicitar sincronização inicial
    socket.on('request_sync', async (data) => {
      try {
        const syncData = await getInitialSyncData(socket.userId, data);
        socket.emit('sync_data', syncData);
      } catch (error) {
        socket.emit('sync_error', { error: error.message });
      }
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Cliente desconectado: ${socket.id} (Razão: ${reason})`);
      
      // Remover das salas
      userRooms.delete(socket.userId);
    });

    // Reconexão
    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Cliente reconectado: ${socket.id} (Tentativa: ${attemptNumber})`);
      
      // Reentrar na sala do usuário
      const userRoom = `user:${socket.userId}`;
      socket.join(userRoom);
      
      socket.emit('reconnected', {
        socketId: socket.id,
        userId: socket.userId,
        attemptNumber
      });
    });
  });

  console.log('✅ Socket.io handlers configurados');
};

/**
 * Obter dados iniciais para sincronização
 */
const getInitialSyncData = async (userId, data = {}) => {
  // Por enquanto, retornar estrutura básica
  // Em produção, carregar dados reais do banco
  return {
    userId,
    wallet: {
      balance: 0
    },
    units: [],
    ownerships: [],
    timestamp: new Date().toISOString()
  };
};

/**
 * Emitir evento para um usuário específico
 */
export const emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emitir evento para um país específico
 */
export const emitToCountry = (countryId, event, data) => {
  io.to(`country:${countryId}`).emit(event, data);
};

/**
 * Broadcast global
 */
export const broadcast = (event, data) => {
  io.emit(event, data);
};

/**
 * Emitir atualização de posição de unidade
 */
export const emitUnitPositionUpdate = (unit) => {
  broadcast('unit_position_update', {
    unitId: unit.unitId,
    position: unit.position,
    targetPosition: unit.targetPosition,
    status: unit.status,
    health: unit.health,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de saldo
 */
export const emitBalanceUpdate = (userId, balance) => {
  emitToUser(userId, 'balance_update', {
    balance,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir notificação de dividendo
 */
export const emitDividendNotification = (userId, dividendData) => {
  emitToUser(userId, 'dividend_received', {
    ...dividendData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de combate
 */
export const emitCombatUpdate = (combat) => {
  // Emitir para ambos os países envolvidos
  emitToCountry(combat.attackerCountry, 'combat_update', {
    combatId: combat.combatId,
    result: combat.result,
    attackerCountry: combat.attackerCountry,
    defenderCountry: combat.defenderCountry,
    timestamp: new Date().toISOString()
  });

  emitToCountry(combat.defenderCountry, 'combat_update', {
    combatId: combat.combatId,
    result: combat.result,
    attackerCountry: combat.attackerCountry,
    defenderCountry: combat.defenderCountry,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de propriedade de país
 */
export const emitOwnershipUpdate = (countryId, ownershipData) => {
  emitToCountry(countryId, 'ownership_update', {
    countryId,
    ...ownershipData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de saúde econômica
 */
export const emitMarketOrderUpdate = (countryId, order) => {
  try {
    // Emitir para todos interessados no país
    io.to(`country:${countryId}`).emit('market_order_update', {
      countryId,
      order
    });

    // Emitir para o vendedor
    if (order.sellerId) {
      io.to(`user:${order.sellerId}`).emit('my_market_order_update', order);
    }

    // Emitir para o comprador (se houver)
    if (order.buyerId) {
      io.to(`user:${order.buyerId}`).emit('my_market_order_update', order);
    }
  } catch (error) {
    console.error('Erro ao emitir atualização de ordem de mercado:', error);
  }
};

export const emitEconomicHealthUpdate = (countryId, metrics) => {
  emitToCountry(countryId, 'economic_health_update', {
    countryId,
    healthScore: metrics.healthScore,
    investmentLevel: metrics.investmentLevel,
    politicalStability: metrics.politicalStability,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de posição de NPC (individual)
 */
export const emitNPCPositionUpdate = (npc) => {
  broadcast('npc:position-updated', {
    npcId: npc.npcId,
    position: npc.position,
    targetPosition: npc.targetPosition,
    status: npc.status,
    npcType: npc.npcType,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização em lote de NPCs (múltiplos NPCs)
 */
export const emitNPCsBatchUpdate = (npcs) => {
  broadcast('npc:batch-updated', {
    npcs: npcs.map(npc => ({
      npcId: npc.npcId,
      position: npc.position,
      targetPosition: npc.targetPosition,
      status: npc.status,
      npcType: npc.npcType,
      name: npc.name
    })),
    timestamp: new Date().toISOString()
  });
};

/**
 * Emitir atualização de NPC para um país específico
 */
export const emitNPCsForCountry = (countryId, npcs) => {
  emitToCountry(countryId, 'npc:country-updated', {
    countryId,
    npcs: npcs.map(npc => ({
      npcId: npc.npcId,
      position: npc.position,
      targetPosition: npc.targetPosition,
      status: npc.status,
      npcType: npc.npcType,
      name: npc.name
    })),
    timestamp: new Date().toISOString()
  });
};

export { io };

