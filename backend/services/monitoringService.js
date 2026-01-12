/**
 * ✅ FASE 19.4: Serviço de Monitoramento em Tempo Real
 * Coleta métricas do sistema para debug e monitoramento
 */

import { getSupabase, checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';
import npcRepository from '../repositories/npcRepository.js';
import { getIO } from '../socket/socketHandler.js';
import os from 'os';

const logger = createLogger('MonitoringService');

// Armazenar métricas de tempo de resposta do banco
const dbResponseTimes = [];
const MAX_DB_RESPONSE_TIMES = 1000; // Manter últimas 1000 medições

// Armazenar erros por endpoint
const endpointErrors = new Map(); // Map<endpoint, {count, lastError, errors: []}>
const MAX_ERRORS_PER_ENDPOINT = 100;

/**
 * Registrar tempo de resposta do banco de dados
 */
export const recordDatabaseResponseTime = (endpoint, responseTime) => {
  dbResponseTimes.push({
    endpoint,
    responseTime,
    timestamp: Date.now()
  });

  // Manter apenas as últimas N medições
  if (dbResponseTimes.length > MAX_DB_RESPONSE_TIMES) {
    dbResponseTimes.shift();
  }
};

/**
 * Registrar erro de endpoint
 */
export const recordEndpointError = (endpoint, error) => {
  if (!endpointErrors.has(endpoint)) {
    endpointErrors.set(endpoint, {
      count: 0,
      lastError: null,
      errors: []
    });
  }

  const errorData = endpointErrors.get(endpoint);
  errorData.count++;
  errorData.lastError = {
    message: error.message || String(error),
    timestamp: Date.now(),
    stack: error.stack
  };

  // Adicionar ao histórico (últimas N)
  errorData.errors.push({
    message: error.message || String(error),
    timestamp: Date.now()
  });

  if (errorData.errors.length > MAX_ERRORS_PER_ENDPOINT) {
    errorData.errors.shift();
  }
};

/**
 * Obter estatísticas de NPCs
 */
export const getNPCStats = async () => {
  try {
    if (!checkConnection()) {
      return {
        total: 0,
        byStatus: {},
        byCountry: {},
        byCity: {},
        error: 'Banco de dados não conectado'
      };
    }

    const npcs = await npcRepository.find({});
    
    const stats = {
      total: npcs.length,
      byStatus: {},
      byCountry: {},
      byCity: {},
      withCity: 0,
      withoutCity: 0
    };

    for (const npc of npcs) {
      // Por status
      const status = npc.status || 'idle';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Por país
      const countryId = npc.countryId || 'UNK';
      stats.byCountry[countryId] = (stats.byCountry[countryId] || 0) + 1;

      // Por cidade
      if (npc.cityId) {
        stats.withCity++;
        stats.byCity[npc.cityId] = (stats.byCity[npc.cityId] || 0) + 1;
      } else {
        stats.withoutCity++;
      }
    }

    return stats;
  } catch (error) {
    logger.error('Erro ao obter estatísticas de NPCs:', error);
    return {
      total: 0,
      error: error.message
    };
  }
};

/**
 * Obter uso de memória do servidor
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    process: {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    },
    system: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      usagePercent: Math.round((usedMemory / totalMemory) * 100)
    },
    uptime: Math.round(process.uptime()) // segundos
  };
};

/**
 * Obter tempo de resposta médio do banco de dados
 */
export const getDatabaseResponseTime = (hours = 24) => {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const recentTimes = dbResponseTimes.filter(rt => rt.timestamp >= cutoffTime);

  if (recentTimes.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      count: 0,
      p50: 0,
      p95: 0,
      p99: 0
    };
  }

  const times = recentTimes.map(rt => rt.responseTime).sort((a, b) => a - b);
  const sum = times.reduce((acc, t) => acc + t, 0);

  return {
    average: Math.round(sum / times.length),
    min: times[0],
    max: times[times.length - 1],
    count: times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)]
  };
};

/**
 * Obter estatísticas de Socket.io
 */
export const getSocketIOStats = () => {
  try {
    const io = getIO();
    if (!io) {
      return {
        connected: false,
        sockets: 0,
        rooms: 0
      };
    }

    const sockets = io.sockets.sockets;
    const rooms = io.sockets.adapter.rooms;

    return {
      connected: true,
      sockets: sockets.size,
      rooms: rooms.size,
      namespaces: Object.keys(io.nsps).length
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas de Socket.io:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};

/**
 * Obter taxa de erros por endpoint
 */
export const getEndpointErrorStats = (hours = 24) => {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const stats = [];

  for (const [endpoint, errorData] of endpointErrors.entries()) {
    // Filtrar erros das últimas N horas
    const recentErrors = errorData.errors.filter(e => e.timestamp >= cutoffTime);

    if (recentErrors.length > 0 || errorData.count > 0) {
      stats.push({
        endpoint,
        totalErrors: errorData.count,
        recentErrors: recentErrors.length,
        lastError: errorData.lastError,
        errorRate: recentErrors.length / hours // erros por hora
      });
    }
  }

  // Ordenar por número de erros (maior primeiro)
  stats.sort((a, b) => b.recentErrors - a.recentErrors);

  return stats;
};

/**
 * Obter todas as métricas de debug
 */
export const getDebugMetrics = async () => {
  try {
    const [npcStats, memoryUsage, dbResponseTime, socketStats, endpointErrors] = await Promise.all([
      getNPCStats(),
      Promise.resolve(getMemoryUsage()),
      Promise.resolve(getDatabaseResponseTime(24)),
      Promise.resolve(getSocketIOStats()),
      Promise.resolve(getEndpointErrorStats(24))
    ]);

    return {
      timestamp: new Date().toISOString(),
      npcs: npcStats,
      memory: memoryUsage,
      database: {
        connected: checkConnection(),
        responseTime: dbResponseTime
      },
      socketio: socketStats,
      errors: {
        endpoints: endpointErrors,
        totalEndpoints: endpointErrors.length
      }
    };
  } catch (error) {
    logger.error('Erro ao obter métricas de debug:', error);
    throw error;
  }
};

/**
 * Limpar métricas antigas (chamado periodicamente)
 */
export const cleanupOldMetrics = () => {
  const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 dias

  // Limpar tempos de resposta antigos
  while (dbResponseTimes.length > 0 && dbResponseTimes[0].timestamp < cutoffTime) {
    dbResponseTimes.shift();
  }

  // Limpar erros antigos
  for (const [endpoint, errorData] of endpointErrors.entries()) {
    errorData.errors = errorData.errors.filter(e => e.timestamp >= cutoffTime);
    
    // Remover endpoint se não tiver mais erros
    if (errorData.errors.length === 0 && errorData.count === 0) {
      endpointErrors.delete(endpoint);
    }
  }
};

