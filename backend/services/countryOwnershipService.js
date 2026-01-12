import countryOwnershipRepository from '../repositories/countryOwnershipRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import { subtractBalance } from './walletService.js';
import { emitOwnershipUpdate } from '../socket/socketHandler.js';
import { calculateInvestmentPrice, getCountryEconomicData } from '../data/countryEconomicData.js';

/**
 * Obter ou criar propriedade de país
 */
export const getOrCreateCountryOwnership = async (countryId, countryName) => {
  let ownership = await countryOwnershipRepository.findByCountryId(countryId);
  
  if (!ownership) {
    // Calcular preço baseado na economia real do país
    const basePrice = 1000;
    const economicPrice = calculateInvestmentPrice(countryId, basePrice);
    
    ownership = await countryOwnershipRepository.create({
      countryId,
      countryName,
      totalShares: 100,
      availableShares: 100,
      currentSharePrice: economicPrice, // Preço baseado na economia real
      totalInvested: 0
    });
  }
  
  return ownership;
};

/**
 * Comprar ações de um país
 */
export const buyShares = async (userId, countryId, countryName, shares, sharePrice) => {
  const ownership = await getOrCreateCountryOwnership(countryId, countryName);
  const totalCost = shares * sharePrice;
  
  // Verificar se há ações disponíveis
  const soldShares = await countryOwnershipRepository.getSoldShares(countryId);
  const availableShares = ownership.totalShares - soldShares;
  
  if (shares > availableShares) {
    throw new Error(`Apenas ${availableShares.toFixed(1)}% de ações disponíveis`);
  }
  
  // Verificar saldo
  const wallet = await walletRepository.findByUserId(userId);
  if (!wallet || parseFloat(wallet.balance) < totalCost) {
    throw new Error('Saldo insuficiente');
  }
  
  // Subtrair saldo
  await subtractBalance(
    userId,
    totalCost,
    `Compra de ${shares}% de ações de ${countryName}`,
    { countryId, shares, sharePrice }
  );
  
  // Adicionar ou atualizar acionista
  await countryOwnershipRepository.upsertShareholder(
    countryId,
    userId,
    shares,
    sharePrice
  );
  
  // Atualizar total investido e preço das ações
  const newTotalInvested = parseFloat(ownership.totalInvested || 0) + totalCost;
  const newSoldShares = await countryOwnershipRepository.getSoldShares(countryId);
  const newPrice = await calculateNewSharePrice(newTotalInvested, newSoldShares);
  
  await countryOwnershipRepository.updateSharePriceAndAvailability(
    countryId,
    newPrice,
    newTotalInvested
  );
  
  // Emitir atualização via Socket.io
  const ownershipInfo = await getCountryOwnershipInfo(countryId);
  emitOwnershipUpdate(countryId, ownershipInfo);
  
  // Registrar evento de analytics
  try {
    const { trackEvent } = await import('./analyticsService.js');
    await trackEvent('investment_made', {
      userId: userId.toString(),
      countryId,
      metadata: {
        amount: totalCost,
        shares,
        countryName: ownership.countryName,
        sharePrice: newPrice
      }
    });
  } catch (error) {
    // Não quebrar o fluxo se analytics falhar
    console.warn('Erro ao registrar evento de analytics:', error);
  }
  
  // Retornar ownership atualizado
  return await countryOwnershipRepository.findByCountryId(countryId);
};

/**
 * Calcular novo preço das ações baseado na demanda
 */
const calculateNewSharePrice = async (totalInvested, sharesSold) => {
  const { getMinimumSharePrice } = await import('../utils/businessRules.js');
  return getMinimumSharePrice(totalInvested, sharesSold);
};

/**
 * Obter acionistas de um país
 */
export const getShareholders = async (countryId) => {
  const shareholders = await countryOwnershipRepository.getShareholders(countryId);
  
  if (!shareholders || shareholders.length === 0) {
    return [];
  }
  
  return shareholders.sort((a, b) => b.shares - a.shares);
};

/**
 * Calcular poder de decisão por investimento
 */
export const calculateVotingPower = async (countryId, userId) => {
  const ownership = await countryOwnershipRepository.findByCountryId(countryId);
  
  if (!ownership) {
    return 0;
  }
  
  const shareholders = await countryOwnershipRepository.getShareholders(countryId);
  const shareholder = shareholders.find(
    sh => sh.userId === userId || (sh.user && sh.user.id === userId)
  );
  
  if (!shareholder) {
    return 0;
  }
  
  // Poder de decisão = porcentagem de ações possuídas
  const totalShares = shareholders.reduce((sum, sh) => sum + parseFloat(sh.shares || 0), 0);
  return totalShares > 0 ? (parseFloat(shareholder.shares) / totalShares) * 100 : 0;
};

/**
 * Obter informações de propriedade de um país
 */
export const getCountryOwnershipInfo = async (countryId) => {
  const ownership = await countryOwnershipRepository.findByCountryId(countryId);
  
  if (!ownership) {
    return null;
  }
  
  const shareholders = await countryOwnershipRepository.getShareholders(countryId);
  const totalSharesSold = shareholders.reduce((sum, sh) => sum + parseFloat(sh.shares || 0), 0);
  const availableShares = ownership.totalShares - totalSharesSold;
  
  return {
    countryId: ownership.countryId,
    countryName: ownership.countryName,
    currentSharePrice: ownership.currentSharePrice,
    totalShares: ownership.totalShares,
    sharesSold: totalSharesSold,
    availableShares: availableShares,
    totalInvested: ownership.totalInvested,
    shareholders: shareholders.map(sh => ({
      userId: sh.userId || (sh.user ? sh.user.id : null),
      user: sh.user,
      shares: parseFloat(sh.shares || 0),
      percentage: (parseFloat(sh.shares || 0) / ownership.totalShares) * 100,
      purchasePrice: parseFloat(sh.purchasePrice || 0),
      purchasedAt: sh.purchasedAt
    }))
  };
};
