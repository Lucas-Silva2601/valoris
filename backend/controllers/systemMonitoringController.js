/**
 * Controller de Monitoramento de Sistema
 */

import * as systemMonitoringService from '../services/systemMonitoringService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SystemMonitoringController');

/**
 * Obter métricas do sistema
 */
export const getSystemMetrics = async (req, res) => {
  try {
    const metrics = await systemMonitoringService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas do sistema:', error);
    res.status(500).json({ error: 'Erro ao obter métricas do sistema' });
  }
};

/**
 * Obter métricas do banco de dados
 */
export const getDatabaseMetrics = async (req, res) => {
  try {
    const metrics = await systemMonitoringService.getDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas do banco:', error);
    res.status(500).json({ error: 'Erro ao obter métricas do banco de dados' });
  }
};

/**
 * Verificar saúde do sistema
 */
export const getSystemHealth = async (req, res) => {
  try {
    const health = await systemMonitoringService.checkSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Erro ao verificar saúde:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};

/**
 * Obter logs de erro recentes
 */
export const getRecentErrors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = await systemMonitoringService.getRecentErrors(limit);
    res.json(errors);
  } catch (error) {
    logger.error('Erro ao obter logs de erro:', error);
    res.status(500).json({ error: 'Erro ao obter logs de erro' });
  }
};

