import CountryOwnership from '../models/CountryOwnership.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { subtractBalance } from './walletService.js';
import { emitOwnershipUpdate } from '../socket/socketHandler.js';
import { calculateInvestmentPrice, getCountryEconomicData } from '../data/countryEconomicData.js';

/**
 * Obter ou criar propriedade de país
 */
export const getOrCreateCountryOwnership = async (countryId, countryName) => {
  let ownership = await CountryOwnership.findOne({ countryId });
  
  if (!ownership) {
    // Calcular preço baseado na economia real do país
    const basePrice = 1000;
    const economicPrice = calculateInvestmentPrice(countryId, basePrice);
    
    ownership = new CountryOwnership({
      countryId,
      countryName,
      totalShares: 100,
      currentSharePrice: economicPrice, // Preço baseado na economia real
      shareholders: []
    });
    await ownership.save();
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
  const availableShares = ownership.totalShares - 
    ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  
  if (shares > availableShares) {
    throw new Error(`Apenas ${availableShares}% de ações disponíveis`);
  }
  
  // Verificar saldo
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < totalCost) {
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
  const existingShareholder = ownership.shareholders.find(
    sh => sh.userId.toString() === userId.toString()
  );
  
  if (existingShareholder) {
    existingShareholder.shares += shares;
    existingShareholder.purchasePrice = 
      (existingShareholder.purchasePrice * (existingShareholder.shares - shares) + totalCost) / 
      existingShareholder.shares;
  } else {
    ownership.shareholders.push({
      userId,
      shares,
      purchasePrice: sharePrice,
      purchasedAt: new Date()
    });
  }
  
  ownership.totalInvested += totalCost;
  ownership.currentSharePrice = await calculateNewSharePrice(ownership);
  
  await ownership.save();
  
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
        sharePrice: ownership.currentSharePrice
      }
    });
  } catch (error) {
    // Não quebrar o fluxo se analytics falhar
    console.warn('Erro ao registrar evento de analytics:', error);
  }
  
  return ownership;
};

/**
 * Calcular novo preço das ações baseado na demanda
 */
const calculateNewSharePrice = async (ownership) => {
  const { getMinimumSharePrice } = await import('../utils/businessRules.js');
  const sharesSold = ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  return getMinimumSharePrice(ownership.totalInvested, sharesSold);
};

/**
 * Obter acionistas de um país
 */
export const getShareholders = async (countryId) => {
  const ownership = await CountryOwnership.findOne({ countryId })
    .populate('shareholders.userId', 'username email');
  
  if (!ownership) {
    return [];
  }
  
  return ownership.shareholders.sort((a, b) => b.shares - a.shares);
};

/**
 * Calcular poder de decisão por investimento
 */
export const calculateVotingPower = async (countryId, userId) => {
  const ownership = await CountryOwnership.findOne({ countryId });
  
  if (!ownership) {
    return 0;
  }
  
  const shareholder = ownership.shareholders.find(
    sh => sh.userId.toString() === userId.toString()
  );
  
  if (!shareholder) {
    return 0;
  }
  
  // Poder de decisão = porcentagem de ações possuídas
  const totalShares = ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  return totalShares > 0 ? (shareholder.shares / totalShares) * 100 : 0;
};

/**
 * Obter informações de propriedade de um país
 */
export const getCountryOwnershipInfo = async (countryId) => {
  const ownership = await CountryOwnership.findOne({ countryId })
    .populate('shareholders.userId', 'username email');
  
  if (!ownership) {
    return null;
  }
  
  const totalSharesSold = ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  const availableShares = ownership.totalShares - totalSharesSold;
  
  return {
    countryId: ownership.countryId,
    countryName: ownership.countryName,
    currentSharePrice: ownership.currentSharePrice,
    totalShares: ownership.totalShares,
    sharesSold: totalSharesSold,
    availableShares: availableShares,
    totalInvested: ownership.totalInvested,
    shareholders: ownership.shareholders.map(sh => ({
      userId: sh.userId,
      shares: sh.shares,
      percentage: (sh.shares / ownership.totalShares) * 100,
      purchasePrice: sh.purchasePrice,
      purchasedAt: sh.purchasedAt
    }))
  };
};

