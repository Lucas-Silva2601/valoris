import cron from 'node-cron';
import Treasury from '../models/Treasury.js';
import EconomicMetrics from '../models/EconomicMetrics.js';
import * as treasuryService from '../services/treasuryService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('RepairJob');
let isRunning = false;

/**
 * Processar reparos automáticos de infraestrutura
 */
const processAutomaticRepairs = async () => {
  if (isRunning) {
    logger.warn('Job de reparos já está em execução');
    return;
  }

  isRunning = true;
  logger.info('Iniciando processamento de reparos automáticos...');

  try {
    // Obter todos os países com infraestrutura danificada
    const metrics = await EconomicMetrics.find({
      'infrastructure.condition': { $lt: 100 }
    });

    logger.info(`Processando reparos para ${metrics.length} países...`);

    let repaired = 0;
    let totalSpent = 0;

    for (const metric of metrics) {
      try {
        const treasury = await Treasury.findOne({ countryId: metric.countryId });

        if (!treasury || treasury.balance <= 0) {
          continue; // Sem saldo para reparos
        }

        const damage = 100 - metric.infrastructure.condition;
        const repairCost = damage * 10; // Custo por ponto de dano

        if (treasury.balance >= repairCost) {
          // Reparar até 10% por vez
          const repairAmount = Math.min(repairCost, treasury.balance);
          const repairPercentage = Math.min(10, damage);

          await treasuryService.repairInfrastructure(metric.countryId, repairAmount);

          // Queimar 50% dos custos de reparo
          const { burnRepairCosts } = await import('../services/currencyBurnService.js');
          await burnRepairCosts(repairAmount);

          // Atualizar condição da infraestrutura
          metric.infrastructure.condition = Math.min(
            100,
            metric.infrastructure.condition + repairPercentage
          );
          await metric.save();

          repaired++;
          totalSpent += repairAmount;

          logger.info(`Reparado ${metric.countryId}: +${repairPercentage}% (${repairAmount} VAL, ${(repairAmount * 0.5).toFixed(2)} VAL queimados)`);
        }
      } catch (error) {
        logger.error(`Erro ao reparar ${metric.countryId}:`, error.message);
      }
    }

    logger.info(`✅ Reparos processados: ${repaired} países, ${totalSpent.toFixed(2)} VAL gastos`);
  } catch (error) {
    logger.error('Erro ao processar reparos:', error);
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

