import CountryDefense from '../models/CountryDefense.js';
import Treasury from '../models/Treasury.js';
import EconomicMetrics from '../models/EconomicMetrics.js';

/**
 * Obter ou criar defesa de país
 */
export const getOrCreateDefense = async (countryId, countryName) => {
  let defense = await CountryDefense.findOne({ countryId });

  if (!defense) {
    // Obter dados do tesouro e infraestrutura
    const treasury = await Treasury.findOne({ countryId });
    const metrics = await EconomicMetrics.findOne({ countryId });

    defense = new CountryDefense({
      countryId,
      countryName,
      defenseLevel: treasury?.defenseLevel || 1,
      technologyLevel: 1,
      treasuryBalance: treasury?.balance || 0,
      infrastructureLevel: treasury?.infrastructureLevel || 1,
      autoDefenseEnabled: true
    });

    await defense.save();
  }

  return defense;
};

/**
 * Atualizar defesa baseado em mudanças no tesouro/infraestrutura
 */
export const updateDefenseFromTreasury = async (countryId) => {
  const defense = await getOrCreateDefense(countryId, '');
  const treasury = await Treasury.findOne({ countryId });

  if (treasury) {
    defense.defenseLevel = treasury.defenseLevel;
    defense.infrastructureLevel = treasury.infrastructureLevel;
    defense.treasuryBalance = treasury.balance;
    await defense.save();
  }

  return defense;
};

/**
 * Melhorar nível tecnológico
 */
export const upgradeTechnology = async (countryId, level) => {
  const defense = await getOrCreateDefense(countryId, '');
  const treasury = await Treasury.findOne({ countryId });

  if (!treasury || treasury.balance < level * 2000) {
    throw new Error('Saldo insuficiente para melhorar tecnologia');
  }

  if (defense.technologyLevel >= 10) {
    throw new Error('Tecnologia já está no nível máximo');
  }

  // Gastar do tesouro
  await treasuryService.spendFromTreasury(
    countryId,
    level * 2000,
    'defense',
    `Melhoria de tecnologia para nível ${defense.technologyLevel + level}`
  );

  defense.technologyLevel = Math.min(defense.technologyLevel + level, 10);
  await defense.save();

  return defense;
};

/**
 * Adicionar unidades de defesa automática
 */
export const addDefenseUnits = async (countryId, type, count) => {
  const defense = await getOrCreateDefense(countryId, '');

  const unitIndex = defense.defenseUnits.findIndex(u => u.type === type);

  if (unitIndex >= 0) {
    defense.defenseUnits[unitIndex].count += count;
  } else {
    defense.defenseUnits.push({
      type,
      count,
      level: 1
    });
  }

  await defense.save();

  return defense;
};

/**
 * Obter poder de defesa
 */
export const getDefensePower = async (countryId) => {
  const defense = await getOrCreateDefense(countryId, '');
  return defense.defensePower;
};

