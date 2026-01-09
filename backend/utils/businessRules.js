/**
 * Regras de negócio centralizadas
 */

/**
 * Calcular preço mínimo de ações
 */
export const getMinimumSharePrice = (totalInvested, sharesSold) => {
  const basePrice = 1000;
  const demandMultiplier = 1 + (totalInvested / 100000);
  const scarcityMultiplier = 1 + ((100 - sharesSold) / 100);
  return Math.round(basePrice * demandMultiplier * scarcityMultiplier);
};

/**
 * Calcular custo de reparo
 */
export const getRepairCost = (damagePercentage) => {
  return damagePercentage * 10; // 10 VAL por ponto de dano
};

/**
 * Calcular poder de defesa base
 */
export const calculateBaseDefensePower = (defenseLevel, techLevel, infrastructureLevel, treasuryBalance) => {
  let power = 0;
  power += defenseLevel * 10;
  power += techLevel * 15;
  power += infrastructureLevel * 5;
  
  const treasuryBonus = Math.min(treasuryBalance / 10000, 0.2) * 100;
  power += treasuryBonus;
  
  return Math.round(power);
};

/**
 * Calcular dano de combate
 */
export const calculateCombatDamage = (attackPower, defensePower, unitType, terrain) => {
  let damage = attackPower;
  
  // Vantagens de tipo
  const typeAdvantages = {
    plane: { tank: 1.2, ship: 0.8 },
    ship: { plane: 0.8, tank: 1.1 },
    tank: { plane: 0.9, ship: 0.7 }
  };
  
  if (typeAdvantages[unitType]) {
    // Aplicar vantagens baseadas no tipo do defensor
    // Por enquanto, simplificado
  }
  
  // Reduzir dano pela defesa
  damage = damage * (1 - Math.min(defensePower / 1000, 0.5));
  
  return Math.round(Math.max(1, damage));
};

/**
 * Validar transferência de propriedade
 */
export const validateOwnershipTransfer = (currentOwnership, newOwnerId) => {
  // Verificar se há acionistas
  if (!currentOwnership.shareholders || currentOwnership.shareholders.length === 0) {
    return { valid: false, reason: 'País não possui acionistas' };
  }
  
  // Verificar se o novo dono já possui ações
  const existingShareholder = currentOwnership.shareholders.find(
    sh => sh.userId.toString() === newOwnerId.toString()
  );
  
  if (!existingShareholder) {
    return { valid: false, reason: 'Novo dono não possui ações do país' };
  }
  
  return { valid: true };
};

/**
 * Calcular porcentagem de propriedade necessária para controle
 */
export const getControlThreshold = () => {
  return 51; // 51% para ter controle
};

/**
 * Validar criação de missão
 */
export const validateMissionCreation = (creatorRole, rewardAmount) => {
  if (creatorRole !== 'investor') {
    return { valid: false, reason: 'Apenas investidores podem criar missões' };
  }
  
  if (rewardAmount < 10 || rewardAmount > 10000) {
    return { valid: false, reason: 'Recompensa deve estar entre 10 e 10000 VAL' };
  }
  
  return { valid: true };
};

