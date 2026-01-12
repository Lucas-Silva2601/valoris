/**
 * ✅ FASE 19.3: Job Periódico de Limpeza de Integridade Referencial
 * Executa limpeza automática de edifícios e NPCs órfãos
 */

import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';
import { runIntegrityCleanup } from '../scripts/integrityCleanup.js';

const logger = createLogger('IntegrityCleanupJob');

/**
 * Executar limpeza de integridade referencial
 */
const executeCleanup = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando limpeza de integridade.');
    return;
  }

  logger.info('🧹 Iniciando limpeza automática de integridade referencial...');

  try {
    const results = await runIntegrityCleanup(false, {
      cleanBuildings: true,
      cleanNPCs: true
    });

    logger.info('✅ Limpeza de integridade concluída:');
    logger.info(`   - Edifícios corrigidos: ${results.buildings?.fixed || 0}`);
    logger.info(`   - NPCs corrigidos: ${results.npcs?.fixed || 0}`);
    logger.info(`   - Edifícios órfãos restantes: ${results.buildings?.orphans || 0}`);
    logger.info(`   - NPCs órfãos restantes: ${results.npcs?.orphans || 0}`);

    if (results.buildings?.orphans > 0 || results.npcs?.orphans > 0) {
      logger.warn(`⚠️ Ainda existem ${(results.buildings?.orphans || 0) + (results.npcs?.orphans || 0)} registros órfãos que não puderam ser corrigidos automaticamente.`);
      logger.warn(`   Execute manualmente: node backend/scripts/integrityCleanup.js --execute`);
    }
  } catch (error) {
    logger.error('❌ Erro ao executar limpeza de integridade:', error);
  }
};

/**
 * Iniciar job de limpeza periódica
 * Por padrão, executa toda segunda-feira às 2h da manhã
 */
export const startIntegrityCleanupJob = (schedule = '0 2 * * 1') => {
  // Executar limpeza no agendamento especificado
  cron.schedule(schedule, () => {
    executeCleanup();
  });

  logger.info(`⏰ Job de limpeza de integridade referencial agendado: ${schedule}`);
  logger.info(`   (Executa automaticamente toda segunda-feira às 2h da manhã)`);

  // Executar uma vez ao iniciar (opcional - descomente se desejar)
  // setTimeout(() => {
  //   executeCleanup();
  // }, 10000); // 10 segundos após iniciar
};

/**
 * Executar limpeza manualmente (para testes)
 */
export const runCleanupManually = async () => {
  await executeCleanup();
};

