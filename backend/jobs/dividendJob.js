import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('DividendJob');
let isRunning = false;

/**
 * Processar dividendos para todos os países
 * TODO: Implementar quando countryOwnershipRepository estiver pronto
 */
const processAllDividends = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando processamento de dividendos.');
    return;
  }

  if (isRunning) {
    logger.warn('Job de dividendos já está em execução');
    return;
  }

  isRunning = true;
  logger.info('💰 Iniciando processamento de dividendos...');

  try {
    // TODO: Implementar quando countryOwnershipRepository estiver criado
    // const countryOwnershipRepository = await import('../repositories/countryOwnershipRepository.js');
    // const dividendService = await import('../services/dividendService.js');
    // 
    // const now = new Date();
    // const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // 
    // const countries = await countryOwnershipRepository.findWithShareholders();
    // logger.info(`📊 Processando dividendos para ${countries.length} países...`);
    // 
    // let processed = 0;
    // let totalDistributed = 0;
    // 
    // for (const ownership of countries) {
    //   try {
    //     const dividend = await dividendService.processDividends(
    //       ownership.country_id,
    //       yesterday,
    //       now
    //     );
    //     if (dividend) {
    //       processed++;
    //       totalDistributed += dividend.totalAmount;
    //     }
    //   } catch (error) {
    //     logger.error(`Erro ao processar dividendos para ${ownership.country_id}:`, error.message);
    //   }
    // }
    // 
    // logger.info(`✅ Dividendos processados: ${processed} países, ${totalDistributed.toFixed(2)} distribuídos`);
    
    logger.debug('Job de dividendos temporariamente desabilitado (aguardando migração)');
  } catch (error) {
    logger.error('Erro ao processar dividendos:', error.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Iniciar job de dividendos (executa a cada 24 horas)
 */
export const startDividendJob = () => {
  // Executar diariamente às 00:00
  cron.schedule('0 0 * * *', () => {
    processAllDividends();
  });

  logger.info('⏰ Job de dividendos agendado (diariamente às 00:00)');
};

/**
 * Processar dividendos manualmente (para testes)
 */
export const processDividendsManually = async () => {
  await processAllDividends();
};

