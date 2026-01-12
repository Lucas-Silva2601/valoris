// Salas/rooms por país
const countryRooms = new Map();
// Salas por usuário
const userRooms = new Map();

// Variável para armazenar a instância do io
let ioInstance = null;

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
export const setupSocketHandlers = (io) => {
  ioInstance = io;
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

    // ✅ FASE 19.2: Handler para atualizar viewport bounds do cliente
    socket.on('viewport:update', async (bounds) => {
      try {
        const { updateSocketViewport } = await import('./npcUpdateHandler.js');
        updateSocketViewport(socket.id, bounds);
      } catch (error) {
        console.error('Erro ao atualizar viewport:', error);
      }
    });
    
    socket.on('update_viewport', async (bounds) => {
      // Compatibilidade com handler antigo
      try {
        const { updateSocketViewport } = await import('./npcUpdateHandler.js');
        updateSocketViewport(socket.id, bounds);
      } catch (error) {
        console.error('Erro ao atualizar viewport:', error);
      }
    });

    // Desconexão
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Cliente desconectado: ${socket.id} (Razão: ${reason})`);
      
      // Remover das salas
      userRooms.delete(socket.userId);
      
      // ✅ FASE 19.2: Limpar viewport do socket
      try {
        const { removeSocketViewport } = await import('./npcUpdateHandler.js');
        removeSocketViewport(socket.id);
      } catch (error) {
        console.error('Erro ao limpar viewport:', error);
      }
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
  if (!ioInstance) {
    console.error('Socket.io não foi inicializado');
    return;
  }
  ioInstance.to(`user:${userId}`).emit(event, data);
};

/**
 * Emitir evento para um país específico
 */
export const emitToCountry = (countryId, event, data) => {
  if (!ioInstance) {
    console.error('Socket.io não foi inicializado');
    return;
  }
  ioInstance.to(`country:${countryId}`).emit(event, data);
};

/**
 * Broadcast global
 */
export const broadcast = (event, data) => {
  if (!ioInstance) {
    console.error('Socket.io não foi inicializado');
    return;
  }
  ioInstance.emit(event, data);
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
    if (!ioInstance) {
      console.error('Socket.io não foi inicializado');
      return;
    }
    // Emitir para todos interessados no país
    ioInstance.to(`country:${countryId}`).emit('market_order_update', {
      countryId,
      order
    });

    // Emitir para o vendedor
    if (order.sellerId) {
      ioInstance.to(`user:${order.sellerId}`).emit('my_market_order_update', order);
    }

    // Emitir para o comprador (se houver)
    if (order.buyerId) {
      ioInstance.to(`user:${order.buyerId}`).emit('my_market_order_update', order);
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
 * ✅ FASE 19.2: Emitir atualização de NPCs apenas para jogadores com viewport definido
 * Filtra NPCs dentro do campo de visão (Bounding Box) do jogador
 */
export const emitNPCUpdate = async (npcs) => {
  if (!ioInstance) {
    console.error('Socket.io não foi inicializado');
    return;
  }

  try {
    // Obter todos os sockets conectados
    const sockets = await ioInstance.fetchSockets();
    
    for (const socket of sockets) {
      // Se o socket tem viewport definido, filtrar NPCs visíveis
      if (socket.viewport && socket.viewport.bounds) {
        const { bounds } = socket.viewport;
        const { north, south, east, west } = bounds;

        // Filtrar NPCs dentro do viewport
        const visibleNPCs = npcs.filter(npc => {
          if (!npc.positionLat || !npc.positionLng) return false;
          
          const lat = npc.positionLat;
          const lng = npc.positionLng;

          // Verificar se está dentro do bounding box
          return lat >= south && lat <= north && lng >= west && lng <= east;
        });

        // Enviar apenas NPCs visíveis
        socket.emit('npc_update', {
          npcs: visibleNPCs,
          count: visibleNPCs.length,
          total: npcs.length,
          timestamp: new Date().toISOString()
        });
      } else {
        // Se não tem viewport, enviar array vazio ou todos (para compatibilidade)
        socket.emit('npc_update', {
          npcs: [],
          count: 0,
          total: npcs.length,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Erro ao emitir atualização de NPCs:', error);
  }
};

// Exportar função para obter a instância do io (para compatibilidade)
export const getIO = () => ioInstance;

