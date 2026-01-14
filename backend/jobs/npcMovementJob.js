import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';
import { processAllNPCMovement } from '../services/npcMovementService.js';

const logger = createLogger('NPCMovementJob');

/**
 * 🚶 FASE 20: Job de Movimento dos NPCs (Wander AI)
 * 
 * Executa a cada 10 segundos para atualizar posições dos NPCs
 * NPCs andam livremente pelo território, criando vida urbana realista
 */

let isRunning = false;

export const startNPCMovementJob = () => {
  // Executar a cada 10 segundos
  cron.schedule('*/10 * * * * *', async () => {
    if (isRunning) {
      logger.debug('Job de movimento ainda em execução, pulando...');
      return;
    }

    isRunning = true;

    try {
      await processAllNPCMovement();
    } catch (error) {
      logger.error('Erro no job de movimento de NPCs:', error);
    } finally {
      isRunning = false;
    }
  });

  logger.info('✅ Job de movimento de NPCs iniciado (a cada 10 segundos)');
};

export default { startNPCMovementJob };

