/**
 * Job para calcular métricas de analytics diariamente
 */

import cron from 'node-cron';
import * as analyticsService from '../services/analyticsService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AnalyticsJob');

/**
 * Iniciar job de analytics
 */
export const startAnalyticsJob = () => {
  // Executar diariamente às 23:59 para calcular métricas do dia
  cron.schedule('59 23 * * *', async () => {
    try {
      logger.info('🔄 Iniciando cálculo de métricas diárias...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await analyticsService.calculateDailyMetrics(yesterday);
      logger.info('✅ Métricas diárias calculadas com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao calcular métricas diárias:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  logger.info('✅ Job de analytics agendado (diariamente às 23:59)');
};

