import cron from 'node-cron';
import MilitaryUnit from '../models/MilitaryUnit.js';
import * as militaryUnitService from '../services/militaryUnitService.js';
import * as combatService from '../services/combatService.js';
import { emitUnitPositionUpdate, emitCombatUpdate } from '../socket/socketHandler.js';

/**
 * Atualizar posição de todas as unidades em movimento
 */
const updateMovingUnits = async () => {
  try {
    const movingUnits = await MilitaryUnit.find({
      status: 'moving'
    });

    for (const unit of movingUnits) {
      const updatedUnit = await militaryUnitService.updateUnitPosition(unit.unitId);

      if (updatedUnit) {
        // Emitir atualização via Socket.io
        emitUnitPositionUpdate(updatedUnit);

        // Verificar se entrou em território inimigo
        // TODO: Carregar dados GeoJSON quando necessário
        // const invasion = await combatService.detectInvasion(updatedUnit, countriesGeoJSON);
        // if (invasion) {
        //   // Iniciar combate
        // }
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar unidades em movimento:', error);
  }
};

/**
 * Processar combates em andamento
 */
const processOngoingCombats = async () => {
  try {
    const Combat = (await import('../models/Combat.js')).default;
    const ongoingCombats = await Combat.find({ result: 'ongoing' });

    for (const combat of ongoingCombats) {
      const updatedCombat = await combatService.processCombatRound(combat.combatId);
      
      if (updatedCombat) {
        // Emitir atualização via Socket.io
        emitCombatUpdate(updatedCombat);
      }
    }
  } catch (error) {
    console.error('Erro ao processar combates:', error);
  }
};

/**
 * Iniciar jobs de movimento e combate
 */
export const startMovementAndCombatJobs = () => {
  // Atualizar posições a cada 5 segundos
  cron.schedule('*/5 * * * * *', () => {
    updateMovingUnits();
  });

  // Processar combates a cada 10 segundos
  cron.schedule('*/10 * * * * *', () => {
    processOngoingCombats();
  });

  console.log('⚔️ Jobs de movimento e combate iniciados');
};

