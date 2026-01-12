import cityRepository from '../repositories/cityRepository.js';
import stateRepository from '../repositories/stateRepository.js';
import * as treasuryService from './treasuryService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TaxService');

/**
 * ✅ FASE 18: Serviço de Divisão de Impostos
 * Calcula e distribui impostos entre níveis administrativos:
 * - Prefeitura (City): 3%
 * - Estado (State): 2%
 * - Tesouro Nacional (Country): 5%
 */

/**
 * Calcular e distribuir impostos de um lucro
 * @param {number} revenue - Receita/lucro total em Valions
 * @param {string} countryId - ID do país
 * @param {string} stateId - ID do estado (opcional)
 * @param {string} cityId - ID da cidade (opcional)
 * @returns {Object} Distribuição de impostos
 */
export const calculateTaxDistribution = (revenue, countryId, stateId = null, cityId = null) => {
  const cityTax = revenue * 0.03; // 3% para Prefeitura
  const stateTax = revenue * 0.02; // 2% para Estado
  const nationalTax = revenue * 0.05; // 5% para Tesouro Nacional
  const remaining = revenue - cityTax - stateTax - nationalTax; // 90% restante

  return {
    totalRevenue: revenue,
    cityTax: parseFloat(cityTax.toFixed(2)),
    stateTax: parseFloat(stateTax.toFixed(2)),
    nationalTax: parseFloat(nationalTax.toFixed(2)),
    remaining: parseFloat(remaining.toFixed(2)),
    countryId,
    stateId,
    cityId
  };
};

/**
 * Distribuir impostos aos tesouros correspondentes
 * @param {number} revenue - Receita/lucro total em Valions
 * @param {string} countryId - ID do país
 * @param {string} stateId - ID do estado (opcional)
 * @param {string} cityId - ID da cidade (opcional)
 */
export const distributeTaxes = async (revenue, countryId, stateId = null, cityId = null) => {
  try {
    // ✅ FASE 18.5: Aplicar bônus de felicidade nos impostos da cidade
    let happinessTaxMultiplier = 1.0;
    if (cityId) {
      try {
        const { calculateHappinessTaxBonus } = await import('./urbanLifeService.js');
        const happinessBonus = await calculateHappinessTaxBonus(cityId);
        happinessTaxMultiplier = happinessBonus.taxMultiplier;
        logger.info(`🏙️ Bônus de felicidade aplicado em ${cityId}: ${happinessBonus.bonusPercent > 0 ? '+' : ''}${happinessBonus.bonusPercent}%`);
      } catch (error) {
        logger.warn(`Erro ao calcular bônus de felicidade para impostos:`, error);
      }
    }

    const distribution = calculateTaxDistribution(revenue, countryId, stateId, cityId);

    // Aplicar multiplicador de felicidade aos impostos municipais e estaduais
    const adjustedCityTax = distribution.cityTax * happinessTaxMultiplier;
    const adjustedStateTax = distribution.stateTax * happinessTaxMultiplier;

    // Depositar na cidade (se tiver treasury_balance)
    if (cityId) {
      const city = await cityRepository.findByCityId(cityId);
      if (city) {
        const currentBalance = parseFloat(city.treasury_balance || 0);
        await cityRepository.update(city.id, { 
          treasury_balance: currentBalance + adjustedCityTax 
        });
        logger.info(`💰 ${adjustedCityTax.toFixed(2)} VAL depositados na prefeitura de ${city.name}`);
      }
    }

    // Depositar no estado (se tiver treasury_balance)
    if (stateId) {
      const state = await stateRepository.findByStateId(stateId);
      if (state) {
        const currentBalance = parseFloat(state.treasury_balance || 0);
        await stateRepository.update(state.id, { 
          treasury_balance: currentBalance + adjustedStateTax 
        });
        logger.info(`💰 ${adjustedStateTax.toFixed(2)} VAL depositados no tesouro do estado`);
      }
    }

    // Adicionar ao Tesouro Nacional
    const treasury = await treasuryService.getOrCreateTreasury(countryId, '');
    treasury.balance += distribution.nationalTax;
    treasury.totalDeposited = (treasury.totalDeposited || 0) + distribution.nationalTax;
    await treasury.save();
    logger.info(`💰 ${distribution.nationalTax.toFixed(2)} VAL adicionados ao Tesouro Nacional de ${countryId}`);

    return {
      ...distribution,
      cityTax: Math.round(adjustedCityTax * 100) / 100,
      stateTax: Math.round(adjustedStateTax * 100) / 100,
      happinessMultiplier: Math.round(happinessTaxMultiplier * 100) / 100
    };
  } catch (error) {
    logger.error('Erro ao distribuir impostos:', error);
    throw error;
  }
};

/**
 * Obter resumo de impostos por nível administrativo
 * @param {string} countryId - ID do país
 * @param {string} stateId - ID do estado (opcional)
 * @param {string} cityId - ID da cidade (opcional)
 */
export const getTaxSummary = async (countryId, stateId = null, cityId = null) => {
  try {
    const treasury = await treasuryService.getOrCreateTreasury(countryId, '');
    
    return {
      national: {
        countryId,
        balance: parseFloat(treasury.balance || 0),
        taxRate: 0.05 // 5%
      },
      state: {
        stateId,
        balance: 0, // TODO: Implementar quando criar treasury_state
        taxRate: 0.02 // 2%
      },
      city: {
        cityId,
        balance: 0, // TODO: Implementar quando criar treasury_city
        taxRate: 0.03 // 3%
      }
    };
  } catch (error) {
    console.error('Erro ao obter resumo de impostos:', error);
    throw error;
  }
};

