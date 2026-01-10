import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('RepairJob');
let isRunning = false;

/**
 * Processar reparos automáticos de infraestrutura
 * TODO: Implementar quando economicMetricsRepository e treasuryRepository estiverem prontos
 */
const processAutomaticRepairs = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando processamento de reparos.');
    return;
  }

  if (isRunning) {
    logger.warn('Job de reparos já está em execução');
    return;
  }

  isRunning = true;
  logger.info('Iniciando processamento de reparos automáticos...');

  try {
    // TODO: Implementar quando repositórios estiverem criados
    // const economicMetricsRepository = await import('../repositories/economicMetricsRepository.js');
    // const treasuryRepository = await import('../repositories/treasuryRepository.js');
    // const metrics = await economicMetricsRepository.find({ infrastructure_condition: { $lt: 100 } });
    
    logger.debug('Job de reparos temporariamente desabilitado (aguardando migração)');

    // logger.info(`Processando reparos para ${metrics.length} países...`);
    // 
    // let repaired = 0;
    // let totalSpent = 0;
    // 
    // for (const metric of metrics) {
    //   try {
    //     const treasury = await treasuryRepository.findByCountryId(metric.country_id);
    //     if (!treasury || treasury.balance <= 0) continue;
    //     
    //     const damage = 100 - metric.infrastructure_condition;
    //     const repairCost = damage * 10;
    //     
    //     if (treasury.balance >= repairCost) {
    //       const repairAmount = Math.min(repairCost, treasury.balance);
    //       const repairPercentage = Math.min(10, damage);
    //       
    //       await treasuryService.repairInfrastructure(metric.country_id, repairAmount);
    //       const { burnRepairCosts } = await import('../services/currencyBurnService.js');
    //       await burnRepairCosts(repairAmount);
    //       
    //       await economicMetricsRepository.update(metric.id, {
    //         infrastructure_condition: Math.min(100, metric.infrastructure_condition + repairPercentage)
    //       });
    //       
    //       repaired++;
    //       totalSpent += repairAmount;
    //     }
    //   } catch (error) {
    //     logger.error(`Erro ao reparar ${metric.country_id}:`, error.message);
    //   }
    // }
    // 
    // logger.info(`✅ Reparos processados: ${repaired} países, ${totalSpent.toFixed(2)} VAL gastos`);
  } catch (error) {
    logger.error('Erro ao processar reparos:', error.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Iniciar job de reparos (executa a cada 12 horas)
 */
export const startRepairJob = () => {
  // Executar a cada 12 horas
  cron.schedule('0 */12 * * *', () => {
    processAutomaticRepairs();
  });

  logger.info('⏰ Job de reparos automáticos agendado (a cada 12 horas)');
};

/**
 * Processar reparos manualmente
 */
export const processRepairsManually = async () => {
  await processAutomaticRepairs();
};

