import cron from 'node-cron';
import * as economicMetricsService from '../services/economicMetricsService.js';
import CountryOwnership from '../models/CountryOwnership.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EconomicHealthJob');
let isRunning = false;

/**
 * Atualizar saúde econômica de todos os países
 */
const updateAllEconomicHealth = async () => {
  if (isRunning) {
    logger.warn('Job de saúde econômica já está em execução');
    return;
  }

  isRunning = true;
  logger.info('Iniciando atualização de saúde econômica...');

  try {
    // Obter todos os países com propriedade
    const countries = await CountryOwnership.find({});

    logger.info(`Processando saúde econômica para ${countries.length} países...`);

    let processed = 0;
    let errors = 0;

    for (const ownership of countries) {
      try {
        await economicMetricsService.calculateEconomicHealth(ownership.countryId);
        processed++;
      } catch (error) {
        errors++;
        logger.error(`Erro ao processar ${ownership.countryId}:`, error.message);
      }
    }

    logger.info(`✅ Saúde econômica atualizada: ${processed} países processados, ${errors} erros`);
  } catch (error) {
    logger.error('Erro ao atualizar saúde econômica:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Iniciar job de saúde econômica (executa a cada 6 horas)
 */
export const startEconomicHealthJob = () => {
  // Executar a cada 6 horas
  cron.schedule('0 */6 * * *', () => {
    updateAllEconomicHealth();
  });

  logger.info('⏰ Job de saúde econômica agendado (a cada 6 horas)');
};

/**
 * Atualizar saúde econômica manualmente
 */
export const updateEconomicHealthManually = async () => {
  await updateAllEconomicHealth();
};

