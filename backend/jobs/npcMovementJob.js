import cron from 'node-cron';
import * as npcService from '../services/npcService.js';
import { createLogger } from '../utils/logger.js';
import { emitNPCsBatchUpdate } from '../socket/socketHandler.js';

const logger = createLogger('NPCMovementJob');
let isRunning = false;

/**
 * Processar movimento de NPCs
 */
const processNPCsMovement = async () => {
  if (isRunning) {
    logger.warn('Job de movimento de NPCs já está em execução');
    return;
  }

  isRunning = true;
  logger.info('Iniciando processamento de movimento de NPCs...');

  try {
    const result = await npcService.processAllNPCsMovement();
    logger.info(`✅ Movimento processado: ${result.updated} NPCs atualizados, ${result.idleProcessed} novos destinos escolhidos`);
    
    // Emitir atualizações via Socket.io se houver NPCs atualizados
    if (result.npcs && result.npcs.length > 0) {
      // Emitir em lote para melhor performance
      emitNPCsBatchUpdate(result.npcs);
      logger.debug(`📡 Emitidas atualizações Socket.io para ${result.npcs.length} NPCs`);
    }
  } catch (error) {
    logger.error('Erro ao processar movimento de NPCs:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Iniciar job de movimento de NPCs (executa a cada 5 segundos)
 */
export const startNPCMovementJob = () => {
  // Executar a cada 5 segundos para movimento suave
  cron.schedule('*/5 * * * * *', () => {
    processNPCsMovement();
  });

  logger.info('⏰ Job de movimento de NPCs agendado (a cada 5 segundos)');
};

/**
 * Processar movimento manualmente
 */
export const processNPCsMovementManually = async () => {
  await processNPCsMovement();
};

