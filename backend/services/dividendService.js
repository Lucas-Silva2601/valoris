import Dividend from '../models/Dividend.js';
import CountryOwnership from '../models/CountryOwnership.js';
import Treasury from '../models/Treasury.js';
import EconomicMetrics from '../models/EconomicMetrics.js';
import { addBalance } from './walletService.js';
import { getOrCreateTreasury } from './treasuryService.js';
import { emitDividendNotification } from '../socket/socketHandler.js';

/**
 * Calcular dividendos de um país
 */
export const calculateDividends = async (countryId) => {
  const ownership = await CountryOwnership.findOne({ countryId });
  const metrics = await EconomicMetrics.findOne({ countryId });
  
  if (!ownership || ownership.shareholders.length === 0) {
    return null;
  }
  
  // Calcular fontes de receita
  const transactionFees = calculateTransactionFees(ownership);
  const resourceExploitation = calculateResourceExploitation(metrics);
  const taxes = calculateTaxes(ownership, metrics);
  
  let totalAmount = transactionFees + resourceExploitation + taxes;
  
  if (totalAmount <= 0) {
    return null;
  }
  
  // Aplicar taxa de risco geopolítico (redução de 30% se em guerra)
  const { applyGeopoliticalRisk } = await import('./geopoliticalRiskService.js');
  const riskAdjustment = await applyGeopoliticalRisk(countryId, totalAmount);
  totalAmount = riskAdjustment.adjustedAmount;
  
  if (totalAmount <= 0) {
    return null;
  }
  
  // Reservar 5% para tesouro
  const treasuryReserve = totalAmount * (parseFloat(process.env.TREASURY_PERCENTAGE || 5) / 100);
  const distributionAmount = totalAmount - treasuryReserve;
  
  // Distribuir entre acionistas
  const distributions = [];
  const totalShares = ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  
  for (const shareholder of ownership.shareholders) {
    const sharePercentage = shareholder.shares / totalShares;
    const dividendAmount = distributionAmount * sharePercentage;
    
    distributions.push({
      userId: shareholder.userId,
      shares: shareholder.shares,
      amount: dividendAmount
    });
  }
  
  return {
    countryId: ownership.countryId,
    countryName: ownership.countryName,
    totalAmount,
    transactionFees,
    resourceExploitation,
    taxes,
    treasuryReserve,
    distributions,
    geopoliticalRisk: riskAdjustment
  };
};

/**
 * Calcular taxas de transações
 */
const calculateTransactionFees = (ownership) => {
  // Baseado no total investido e número de transações
  const baseFee = ownership.totalInvested * 0.001; // 0.1% do investimento total
  return Math.max(baseFee, 10); // Mínimo de 10
};

/**
 * Calcular exploração de recursos
 */
const calculateResourceExploitation = (metrics) => {
  if (!metrics) {
    return 50; // Valor padrão
  }
  
  const baseResource = metrics.resources.virtual || 100;
  const exploitationRate = metrics.resources.exploitationRate || 1;
  
  return baseResource * exploitationRate * 0.5;
};

/**
 * Calcular impostos
 */
const calculateTaxes = (ownership, metrics) => {
  if (!metrics) {
    return ownership.totalInvested * 0.002; // 0.2% padrão
  }
  
  // Impostos baseados na saúde econômica
  const healthMultiplier = metrics.healthScore / 100;
  return ownership.totalInvested * 0.002 * healthMultiplier;
};

/**
 * Processar e distribuir dividendos para um país
 */
export const processDividends = async (countryId, periodStart, periodEnd) => {
  const dividendData = await calculateDividends(countryId);
  
  if (!dividendData) {
    return null;
  }
  
  // Criar registro de dividendos
  const dividend = new Dividend({
    countryId: dividendData.countryId,
    countryName: dividendData.countryName,
    totalAmount: dividendData.totalAmount,
    distributionDate: new Date(),
    period: {
      start: periodStart,
      end: periodEnd
    },
    sources: {
      transactionFees: dividendData.transactionFees,
      resourceExploitation: dividendData.resourceExploitation,
      taxes: dividendData.taxes
    },
    treasuryReserve: dividendData.treasuryReserve,
    distributions: dividendData.distributions
  });
  
  // Distribuir para acionistas
  for (const distribution of dividendData.distributions) {
    await addBalance(
      distribution.userId,
      distribution.amount,
      `Dividendo de ${dividendData.countryName}`,
      { countryId, shares: distribution.shares }
    );

    // Emitir notificação via Socket.io
    emitDividendNotification(distribution.userId, {
      countryId: dividendData.countryId,
      countryName: dividendData.countryName,
      amount: distribution.amount,
      shares: distribution.shares
    });
  }
  
  // Adicionar ao tesouro
  if (dividendData.treasuryReserve > 0) {
    await getOrCreateTreasury(dividendData.countryId, dividendData.countryName);
    const treasury = await Treasury.findOne({ countryId: dividendData.countryId });
    treasury.balance += dividendData.treasuryReserve;
    treasury.totalDeposited += dividendData.treasuryReserve;
    await treasury.save();
  }
  
  await dividend.save();
  
  return dividend;
};

/**
 * Obter histórico de dividendos
 */
export const getDividendHistory = async (countryId, limit = 50) => {
  return await Dividend.find({ countryId })
    .sort({ distributionDate: -1 })
    .limit(limit)
    .populate('distributions.userId', 'username');
};

/**
 * Obter dividendos recebidos por um usuário
 */
export const getUserDividends = async (userId, limit = 50) => {
  return await Dividend.find({ 'distributions.userId': userId })
    .sort({ distributionDate: -1 })
    .limit(limit)
    .select('countryId countryName distributionDate distributions');
};

