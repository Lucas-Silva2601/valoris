import Treasury from '../models/Treasury.js';

/**
 * Obter ou criar tesouro de um país
 */
export const getOrCreateTreasury = async (countryId, countryName) => {
  let treasury = await Treasury.findOne({ countryId });
  
  if (!treasury) {
    treasury = new Treasury({
      countryId,
      countryName,
      balance: 0,
      infrastructureLevel: 1,
      defenseLevel: 1
    });
    await treasury.save();
  }
  
  return treasury;
};

/**
 * Obter saldo do tesouro
 */
export const getTreasuryBalance = async (countryId) => {
  const treasury = await getOrCreateTreasury(countryId, '');
  return treasury.balance;
};

/**
 * Gastar do tesouro
 */
export const spendFromTreasury = async (countryId, amount, type, description) => {
  const treasury = await getOrCreateTreasury(countryId, '');
  
  if (treasury.balance < amount) {
    throw new Error('Saldo do tesouro insuficiente');
  }
  
  treasury.balance -= amount;
  treasury.totalSpent += amount;
  treasury.expenses.push({
    type,
    amount,
    description,
    date: new Date()
  });
  
  await treasury.save();
  
  return treasury;
};

/**
 * Melhorar infraestrutura
 */
export const upgradeInfrastructure = async (countryId, level) => {
  const treasury = await getOrCreateTreasury(countryId, '');
  const cost = level * 1000; // Custo por nível
  
  if (treasury.balance < cost) {
    throw new Error('Saldo insuficiente para melhorar infraestrutura');
  }
  
  if (treasury.infrastructureLevel >= 10) {
    throw new Error('Infraestrutura já está no nível máximo');
  }
  
  await spendFromTreasury(
    countryId,
    cost,
    'infrastructure',
    `Melhoria de infraestrutura para nível ${treasury.infrastructureLevel + 1}`
  );
  
  treasury.infrastructureLevel = Math.min(treasury.infrastructureLevel + level, 10);
  await treasury.save();
  
  return treasury;
};

/**
 * Melhorar defesa
 */
export const upgradeDefense = async (countryId, level) => {
  const treasury = await getOrCreateTreasury(countryId, '');
  const cost = level * 1500; // Custo por nível
  
  if (treasury.balance < cost) {
    throw new Error('Saldo insuficiente para melhorar defesa');
  }
  
  if (treasury.defenseLevel >= 10) {
    throw new Error('Defesa já está no nível máximo');
  }
  
  await spendFromTreasury(
    countryId,
    cost,
    'defense',
    `Melhoria de defesa para nível ${treasury.defenseLevel + 1}`
  );
  
  treasury.defenseLevel = Math.min(treasury.defenseLevel + level, 10);
  await treasury.save();
  
  return treasury;
};

/**
 * Reparar infraestrutura
 */
export const repairInfrastructure = async (countryId, amount) => {
  const treasury = await getOrCreateTreasury(countryId, '');
  
  if (treasury.balance < amount) {
    throw new Error('Saldo insuficiente para reparos');
  }
  
  await spendFromTreasury(
    countryId,
    amount,
    'maintenance',
    'Reparo de infraestrutura'
  );
  
  return treasury;
};

