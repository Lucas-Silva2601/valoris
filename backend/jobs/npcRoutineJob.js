import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';
import * as npcService from '../services/npcService.js';

const logger = createLogger('NPCRoutineJob');
let isRunning = false;
let lastExecutionTime = 0;
const MIN_EXECUTION_INTERVAL_MS = 4000; // Mínimo de 4 segundos entre execuções

/**
 * ✅ FASE 18.5: Processar rotinas e movimento de todos os NPCs
 */
const processAllNPCRoutines = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando processamento de rotinas de NPCs.');
    return;
  }

  // ✅ Verificar se já está rodando ou se executou muito recentemente
  const now = Date.now();
  if (isRunning) {
    logger.warn('Job de rotinas de NPCs já está em execução');
    return;
  }

  // ✅ Evitar execuções muito próximas (mínimo 4 segundos)
  if (now - lastExecutionTime < MIN_EXECUTION_INTERVAL_MS) {
    logger.debug(`Job de rotinas de NPCs ignorado (executado há ${(now - lastExecutionTime) / 1000}s)`);
    return;
  }

  isRunning = true;
  lastExecutionTime = now;
  logger.info('🔄 Iniciando processamento de rotinas e movimento de NPCs...');

  try {
    await npcService.processAllNPCs();
    
    // ✅ FASE 19.2: Emitir atualizações de NPCs via Socket.io (com throttling de bounding box)
    try {
      const { emitNPCUpdate } = await import('../socket/socketHandler.js');
      const npcRepository = (await import('../repositories/npcRepository.js')).default;
      
      // Buscar todos os NPCs e agrupar por país
      const allNPCs = await npcRepository.find({});
      const npcsByCountry = {};
      
      for (const npc of allNPCs) {
        const countryId = npc.countryId || 'UNK';
        if (!npcsByCountry[countryId]) {
          npcsByCountry[countryId] = [];
        }
        npcsByCountry[countryId].push(npc);
      }
      
      // Emitir atualizações por país (com filtragem de viewport)
      for (const [countryId, npcs] of Object.entries(npcsByCountry)) {
        emitNPCUpdate(npcs, countryId);
      }
    } catch (error) {
      logger.warn('Erro ao emitir atualizações de NPCs via Socket.io:', error);
      // Não bloquear o processamento se houver erro no Socket.io
    }
    
    logger.info('✅ Processamento de rotinas de NPCs concluído');
  } catch (error) {
    logger.error('Erro ao processar rotinas de NPCs:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * ✅ FASE 18.5: Iniciar job de rotinas de NPCs (executa a cada 5 segundos)
 */
export const startNPCRoutineJob = () => {
  // Executar a cada 5 segundos para movimento suave
  cron.schedule('*/5 * * * * *', () => {
    processAllNPCRoutines();
  });

  logger.info('⏰ Job de rotinas de NPCs agendado (a cada 5 segundos)');

  // Executar uma vez ao iniciar
  setTimeout(() => {
    processAllNPCRoutines();
  }, 5000);
};

/**
 * Processar rotinas manualmente (para testes)
 */
export const processNPCRoutinesManually = async () => {
  await processAllNPCRoutines();
};

