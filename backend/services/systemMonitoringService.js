/**
 * Serviço de Monitoramento de Sistema
 */

import os from 'os';
import { createLogger } from '../utils/logger.js';
import mongoose from 'mongoose';

const logger = createLogger('SystemMonitoring');

/**
 * Obter métricas do sistema
 */
export const getSystemMetrics = async () => {
  try {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Métricas do sistema operacional
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Métricas do Node.js
    const nodeMetrics = {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      memory: {
        rss: memUsage.rss, // Resident Set Size
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      uptime: uptime,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version
    };

    // Métricas do sistema
    const systemMetrics = {
      totalMemory: totalMem,
      freeMemory: freeMem,
      usedMemory: usedMem,
      memoryUsagePercent: (usedMem / totalMem) * 100,
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    };

    return {
      node: nodeMetrics,
      system: systemMetrics,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Erro ao obter métricas do sistema:', error);
    throw error;
  }
};

/**
 * Obter métricas do banco de dados
 */
export const getDatabaseMetrics = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Banco de dados não conectado');
    }

    // Estatísticas do servidor
    const serverStatus = await db.admin().serverStatus();
    
    // Estatísticas das coleções
    const collections = await db.listCollections().toArray();
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await db.collection(collection.name).stats();
        return {
          name: collection.name,
          count: stats.count,
          size: stats.size,
          storageSize: stats.storageSize,
          indexes: stats.nindexes,
          indexSize: stats.totalIndexSize
        };
      })
    );

    // Estatísticas de conexão
    const connectionStats = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };

    return {
      server: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available
        },
        memory: {
          resident: serverStatus.mem.resident,
          virtual: serverStatus.mem.virtual,
          mapped: serverStatus.mem.mapped
        },
        network: {
          bytesIn: serverStatus.network.bytesIn,
          bytesOut: serverStatus.network.bytesOut,
          numRequests: serverStatus.network.numRequests
        }
      },
      collections: collectionStats,
      connection: connectionStats,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Erro ao obter métricas do banco de dados:', error);
    throw error;
  }
};

/**
 * Verificar saúde do sistema
 */
export const checkSystemHealth = async () => {
  try {
    const health = {
      status: 'healthy',
      checks: {},
      timestamp: new Date()
    };

    // Verificar banco de dados
    try {
      const dbState = mongoose.connection.readyState;
      health.checks.database = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        readyState: dbState,
        message: dbState === 1 ? 'Conectado' : 'Desconectado'
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Verificar memória
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    health.checks.memory = {
      status: memPercent < 90 ? 'healthy' : 'warning',
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      percent: memPercent.toFixed(2)
    };

    // Verificar CPU (simplificado)
    const cpuUsage = process.cpuUsage();
    health.checks.cpu = {
      status: 'healthy',
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    // Determinar status geral
    const allHealthy = Object.values(health.checks).every(
      check => check.status === 'healthy'
    );
    health.status = allHealthy ? 'healthy' : 'degraded';

    return health;
  } catch (error) {
    logger.error('Erro ao verificar saúde do sistema:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Obter logs de erro recentes
 */
export const getRecentErrors = async (limit = 50) => {
  try {
    // Em produção, isso buscaria de um sistema de logging
    // Por enquanto, retornamos estrutura básica
    return {
      errors: [],
      count: 0,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Erro ao obter logs de erro:', error);
    throw error;
  }
};

