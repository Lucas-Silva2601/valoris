/**
 * Serviço de Risco Geopolítico
 * 
 * Regra: Se um país estiver em "Estado de Guerra" (tropas inimigas no território),
 * reduzir a geração de dividendos em 30% devido à instabilidade.
 */

import Combat from '../models/Combat.js';
import MilitaryUnit from '../models/MilitaryUnit.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('GeopoliticalRisk');

/**
 * Verificar se um país está em estado de guerra
 * @param {string} countryId - Código ISO_A3 do país
 * @returns {Object} Status de guerra
 */
export const checkWarStatus = async (countryId) => {
  // Verificar se há combates ativos onde o país é defensor
  const activeCombats = await Combat.find({
    defenderCountry: countryId,
    result: 'ongoing'
  });

  if (activeCombats.length > 0) {
    return {
      isAtWar: true,
      reason: 'combat_active',
      activeCombats: activeCombats.length,
      riskMultiplier: 0.7 // Reduz dividendos em 30% (70% do valor original)
    };
  }

  // Verificar se há unidades inimigas no território
  // Unidade inimiga = unidade de outro país (countryId diferente) no território
  const allUnitsInCountry = await MilitaryUnit.find({
    currentCountry: countryId,
    status: { $ne: 'destroyed' }
  });

  // Verificar se há unidades de países diferentes (invasão)
  const countryUnits = allUnitsInCountry.filter(
    unit => unit.countryId === countryId
  );
  const foreignUnits = allUnitsInCountry.filter(
    unit => unit.countryId !== countryId
  );

  if (foreignUnits.length > 0) {
    return {
      isAtWar: true,
      reason: 'enemy_troops_in_territory',
      enemyUnitsCount: foreignUnits.length,
      riskMultiplier: 0.7 // Reduz dividendos em 30%
    };
  }

  return {
    isAtWar: false,
    riskMultiplier: 1.0 // Sem redução
  };
};

/**
 * Aplicar taxa de risco geopolítico aos dividendos
 * @param {string} countryId - Código ISO_A3 do país
 * @param {number} dividendAmount - Valor original dos dividendos
 * @returns {Object} Dividendos ajustados
 */
export const applyGeopoliticalRisk = async (countryId, dividendAmount) => {
  const warStatus = await checkWarStatus(countryId);

  if (warStatus.isAtWar) {
    const adjustedAmount = dividendAmount * warStatus.riskMultiplier;
    const reduction = dividendAmount - adjustedAmount;

    logger.info(
      `⚠️ Risco geopolítico aplicado a ${countryId}: ` +
      `Dividendos reduzidos em ${(reduction / dividendAmount * 100).toFixed(1)}% ` +
      `(${dividendAmount.toFixed(2)} → ${adjustedAmount.toFixed(2)} VAL) ` +
      `Motivo: ${warStatus.reason}`
    );

    return {
      originalAmount: dividendAmount,
      adjustedAmount,
      reduction,
      riskMultiplier: warStatus.riskMultiplier,
      isAtWar: true,
      reason: warStatus.reason
    };
  }

  return {
    originalAmount: dividendAmount,
    adjustedAmount: dividendAmount,
    reduction: 0,
    riskMultiplier: 1.0,
    isAtWar: false
  };
};

