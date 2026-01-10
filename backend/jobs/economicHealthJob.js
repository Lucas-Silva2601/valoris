import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EconomicHealthJob');
let isRunning = false;

/**
 * Atualizar saúde econômica de todos os países
 * TODO: Implementar quando countryOwnershipRepository estiver pronto
 */
const updateAllEconomicHealth = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando atualização de saúde econômica.');
    return;
  }

  if (isRunning) {
    logger.warn('Job de saúde econômica já está em execução');
    return;
  }

  isRunning = true;
  logger.info('Iniciando atualização de saúde econômica...');

  try {
    // TODO: Implementar quando countryOwnershipRepository estiver criado
    // const countryOwnershipRepository = await import('../repositories/countryOwnershipRepository.js');
    // const economicMetricsService = await import('../services/economicMetricsService.js');
    // const countries = await countryOwnershipRepository.findAll();
    // 
    // logger.info(`Processando saúde econômica para ${countries.length} países...`);
    // 
    // let processed = 0;
    // let errors = 0;
    // 
    // for (const ownership of countries) {
    //   try {
    //     await economicMetricsService.calculateEconomicHealth(ownership.country_id);
    //     processed++;
    //   } catch (error) {
    //     errors++;
    //     logger.error(`Erro ao processar ${ownership.country_id}:`, error.message);
    //   }
    // }
    // 
    // logger.info(`✅ Saúde econômica atualizada: ${processed} países processados, ${errors} erros`);
    
    logger.debug('Job de saúde econômica temporariamente desabilitado (aguardando migração)');
  } catch (error) {
    logger.error('Erro ao atualizar saúde econômica:', error.message);
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

