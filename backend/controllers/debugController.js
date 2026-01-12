/**
 * ✅ FASE 19.4: Controller de Debug e Monitoramento
 * Fornece métricas em tempo real para administradores
 */

import { getDebugMetrics } from '../services/monitoringService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('DebugController');

/**
 * GET /api/admin/debug
 * Retorna todas as métricas de debug do sistema
 */
export const getDebugInfo = async (req, res) => {
  try {
    const metrics = await getDebugMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Erro ao obter métricas de debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

