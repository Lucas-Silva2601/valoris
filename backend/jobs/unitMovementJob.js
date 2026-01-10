import cron from 'node-cron';
import { checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('UnitMovementJob');

/**
 * Atualizar posição de todas as unidades em movimento
 * TODO: Implementar quando militaryUnitRepository estiver pronto
 */
const updateMovingUnits = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando atualização de unidades.');
    return;
  }

  try {
    // TODO: Implementar quando militaryUnitRepository estiver criado
    // const militaryUnitRepository = await import('../repositories/militaryUnitRepository.js');
    // const movingUnits = await militaryUnitRepository.findByStatus('moving');
    // 
    // for (const unit of movingUnits) {
    //   const updatedUnit = await militaryUnitService.updateUnitPosition(unit.unitId);
    //   if (updatedUnit) {
    //     emitUnitPositionUpdate(updatedUnit);
    //   }
    // }
    logger.debug('Job de atualização de unidades temporariamente desabilitado (aguardando migração)');
  } catch (error) {
    logger.error('Erro ao atualizar unidades em movimento:', error.message);
  }
};

/**
 * Processar combates em andamento
 * TODO: Implementar quando combatRepository estiver pronto
 */
const processOngoingCombats = async () => {
  if (!checkConnection()) {
    logger.debug('Supabase não conectado. Pulando processamento de combates.');
    return;
  }

  try {
    // TODO: Implementar quando combatRepository estiver criado
    // const combatRepository = await import('../repositories/combatRepository.js');
    // const ongoingCombats = await combatRepository.findByResult('ongoing');
    // 
    // for (const combat of ongoingCombats) {
    //   const updatedCombat = await combatService.processCombatRound(combat.combatId);
    //   if (updatedCombat) {
    //     emitCombatUpdate(updatedCombat);
    //   }
    // }
    logger.debug('Job de processamento de combates temporariamente desabilitado (aguardando migração)');
  } catch (error) {
    logger.error('Erro ao processar combates:', error.message);
  }
};

/**
 * Iniciar jobs de movimento e combate
 * Nota: Jobs temporariamente desabilitados até que os repositórios sejam migrados para Supabase
 */
export const startMovementAndCombatJobs = () => {
  if (!checkConnection()) {
    logger.warn('Supabase não conectado. Jobs de movimento e combate não iniciados.');
    return;
  }

  // Desabilitado temporariamente até que militaryUnitRepository e combatRepository sejam criados
  // cron.schedule('*/5 * * * * *', () => {
  //   updateMovingUnits();
  // });

  // cron.schedule('*/10 * * * * *', () => {
  //   processOngoingCombats();
  // });

  logger.info('⚔️ Jobs de movimento e combate configurados (desabilitados até migração completa)');
};

