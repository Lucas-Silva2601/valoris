import Combat from '../models/Combat.js';
import MilitaryUnit from '../models/MilitaryUnit.js';
import CountryDefense from '../models/CountryDefense.js';
import * as treasuryService from './treasuryService.js';
import * as economicMetricsService from './economicMetricsService.js';
import * as countryOwnershipService from './countryOwnershipService.js';

/**
 * Detectar invasão (unidade cruza fronteira)
 * Nota: Implementação simplificada - em produção usar Turf.js com dados GeoJSON
 */
export const detectInvasion = async (unit, countriesGeoJSON) => {
  // Por enquanto, verificar se currentCountry é diferente de countryId
  // Em produção, usar detectCountryByCoordinates com dados GeoJSON
  if (unit.currentCountry && unit.currentCountry !== unit.countryId) {
    return {
      isInvasion: true,
      targetCountry: unit.currentCountry,
      targetCountryName: unit.currentCountry
    };
  }

  return null;
};

/**
 * Iniciar combate
 */
export const initiateCombat = async (attackerUnits, defenderCountryId, countriesGeoJSON) => {
  // Obter defesa do país
  const defense = await CountryDefense.findOne({ countryId: defenderCountryId });
  
  if (!defense) {
    throw new Error('Defesa do país não encontrada');
  }

  // Obter unidades de defesa do país
  const defenderUnits = await MilitaryUnit.find({
    currentCountry: defenderCountryId,
    status: { $ne: 'destroyed' },
    ownerId: { $ne: attackerUnits[0].ownerId } // Não incluir unidades do atacante
  });

  // Criar registro de combate
  const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const combat = new Combat({
    combatId,
    attackerCountry: attackerUnits[0].countryId,
    defenderCountry: defenderCountryId,
    attackerUnits: attackerUnits.map(unit => ({
      unitId: unit.unitId,
      type: unit.type,
      healthBefore: unit.health.current
    })),
    defenderUnits: defenderUnits.map(unit => ({
      unitId: unit.unitId,
      type: unit.type,
      healthBefore: unit.health.current
    })),
    defenseSystem: {
      level: defense.defenseLevel,
      healthBefore: defense.defensePower
    },
    location: {
      lat: attackerUnits[0].position.lat,
      lng: attackerUnits[0].position.lng
    },
    result: 'ongoing'
  });

  await combat.save();

  return combat;
};

/**
 * Processar rodada de combate
 */
export const processCombatRound = async (combatId) => {
  const combat = await Combat.findOne({ combatId });

  if (!combat || combat.result !== 'ongoing') {
    return null;
  }

  // Obter unidades atacantes
  const attackerUnits = await MilitaryUnit.find({
    unitId: { $in: combat.attackerUnits.map(u => u.unitId) }
  });

  // Obter unidades defensoras
  const defenderUnits = await MilitaryUnit.find({
    unitId: { $in: combat.defenderUnits.map(u => u.unitId) }
  });

  // Obter sistema de defesa
  const defense = await CountryDefense.findOne({ 
    countryId: combat.defenderCountry 
  });

  // Calcular dano dos atacantes
  let attackerTotalDamage = 0;
  for (const unit of attackerUnits) {
    if (unit.health.current > 0) {
      const damage = calculateUnitDamage(unit, 'attack');
      attackerTotalDamage += damage;
    }
  }

  // Calcular dano dos defensores
  let defenderTotalDamage = 0;
  for (const unit of defenderUnits) {
    if (unit.health.current > 0) {
      const damage = calculateUnitDamage(unit, 'defense');
      defenderTotalDamage += damage;
    }
  }

  // Dano do sistema de defesa
  let defenseDamage = 0;
  if (defense && defense.defensePower > 0) {
    defenseDamage = defense.defenseLevel * 10 + defense.technologyLevel * 5;
  }

  // Aplicar dano aos atacantes
  for (const unit of attackerUnits) {
    if (unit.health.current > 0) {
      const damage = Math.min(
        (defenderTotalDamage / attackerUnits.length) + (defenseDamage / attackerUnits.length),
        unit.health.current
      );
      unit.health.current -= damage;
      unit.status = unit.health.current <= 0 ? 'destroyed' : 'attacking';
      
      // Atualizar no combate
      const combatUnit = combat.attackerUnits.find(u => u.unitId === unit.unitId);
      if (combatUnit) {
        combatUnit.healthAfter = unit.health.current;
        combatUnit.damageDealt = damage;
      }
    }
    await unit.save();
  }

  // Aplicar dano aos defensores
  for (const unit of defenderUnits) {
    if (unit.health.current > 0) {
      const damage = Math.min(
        attackerTotalDamage / defenderUnits.length,
        unit.health.current
      );
      unit.health.current -= damage;
      unit.status = unit.health.current <= 0 ? 'destroyed' : 'defending';
      
      // Atualizar no combate
      const combatUnit = combat.defenderUnits.find(u => u.unitId === unit.unitId);
      if (combatUnit) {
        combatUnit.healthAfter = unit.health.current;
        combatUnit.damageDealt = damage;
      }
    }
    await unit.save();
  }

  // Aplicar dano ao sistema de defesa
  if (defense && defense.defensePower > 0) {
    const damage = Math.min(attackerTotalDamage * 0.1, defense.defensePower);
    defense.defensePower -= damage;
    combat.defenseSystem.healthAfter = defense.defensePower;
    combat.defenseSystem.damageDealt = damage;
    await defense.save();
  }

  // Verificar resultado
  const attackerAlive = attackerUnits.some(u => u.health.current > 0);
  const defenderAlive = defenderUnits.some(u => u.health.current > 0) || 
                        (defense && defense.defensePower > 0);

  if (!attackerAlive) {
    combat.result = 'defender_victory';
    combat.endedAt = new Date();
  } else if (!defenderAlive) {
    combat.result = 'attacker_victory';
    combat.endedAt = new Date();
    
    // Aplicar consequências da vitória
    await handleVictory(combat);
  }

  await combat.save();

  // Registrar evento de fim de combate
  if (combat.result !== 'ongoing') {
    try {
      const { trackEvent } = await import('./analyticsService.js');
      await trackEvent('combat_ended', {
        countryId: combat.defenderCountry,
        metadata: {
          combatId: combat.combatId,
          result: combat.result,
          attackerCountry: combat.attackerCountry,
          defenderCountry: combat.defenderCountry,
          duration: combat.endedAt - combat.startedAt
        }
      });
    } catch (error) {
      console.warn('Erro ao registrar evento de fim de combate:', error);
    }
  }

  return combat;
};

/**
 * Calcular dano de uma unidade
 */
const calculateUnitDamage = (unit, role) => {
  let damage = unit.attack;
  
  // Bônus por tipo e terreno
  if (role === 'attack') {
    // Aviões têm vantagem no ataque
    if (unit.type === 'plane') {
      damage *= 1.2;
    }
    // Navios têm vantagem no mar
    if (unit.type === 'ship') {
      damage *= 1.1;
    }
  }
  
  // Reduzir dano baseado na saúde
  damage *= (unit.health.current / unit.health.max);
  
  return Math.round(damage);
};

/**
 * Lidar com vitória do atacante
 */
const handleVictory = async (combat) => {
  // Calcular dano à infraestrutura
  const infrastructureDamage = combat.attackerUnits.reduce((sum, unit) => {
    return sum + (unit.damageDealt || 0);
  }, 0) * 0.1;

  combat.damageToInfrastructure = infrastructureDamage;

  // Aplicar dano à economia
  await economicMetricsService.applyWarImpact(
    combat.defenderCountry,
    infrastructureDamage
  );

  // Verificar se o país foi totalmente conquistado
  const defenderUnits = await MilitaryUnit.find({
    currentCountry: combat.defenderCountry,
    status: { $ne: 'destroyed' }
  });

  if (defenderUnits.length === 0) {
    // País totalmente conquistado
    await handleCountryConquest(combat);
  }
};

/**
 * Lidar com conquista total de país
 */
const handleCountryConquest = async (combat) => {
  // Transferir propriedade para o atacante
  const ownership = await countryOwnershipService.getOrCreateCountryOwnership(
    combat.defenderCountry,
    combat.defenderCountry
  );

  // TODO: Implementar transferência de propriedade
  // Por enquanto, apenas registrar o evento
  console.log(`País ${combat.defenderCountry} conquistado por ${combat.attackerCountry}`);
};

/**
 * Obter histórico de combates
 */
export const getCombatHistory = async (countryId, limit = 50) => {
  return await Combat.find({
    $or: [
      { attackerCountry: countryId },
      { defenderCountry: countryId }
    ]
  })
  .sort({ startedAt: -1 })
  .limit(limit);
};

