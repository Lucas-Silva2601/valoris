/**
 * Serviço de Queima de Moeda (Currency Burn)
 * 
 * Regras:
 * - 100% das taxas de combustível são queimadas (removidas do sistema)
 * - 50% dos custos de reparo são queimados (removidos do sistema)
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('CurrencyBurn');

/**
 * Queimar moeda (remover do sistema permanentemente)
 * @param {number} amount - Quantidade a ser queimada
 * @param {string} reason - Motivo da queima
 * @returns {Object} Estatísticas da queima
 */
export const burnCurrency = async (amount, reason) => {
  if (amount <= 0) {
    return { burned: 0, reason };
  }

  // A moeda é simplesmente "deletada" - não vai para lugar nenhum
  // Em um sistema real, isso seria registrado em uma tabela de queima
  // Por enquanto, apenas logamos a queima

  logger.info(`🔥 Queima de moeda: ${amount.toFixed(2)} VAL - Motivo: ${reason}`);

  return {
    burned: amount,
    reason,
    timestamp: new Date()
  };
};

/**
 * Processar queima de combustível (100% das taxas)
 * @param {number} fuelCost - Custo do combustível
 * @returns {Object} Resultado da queima
 */
export const burnFuelCosts = async (fuelCost) => {
  if (fuelCost <= 0) {
    return { burned: 0 };
  }

  // 100% das taxas de combustível são queimadas
  const burned = fuelCost;
  
  return await burnCurrency(burned, 'Combustível (100% queimado)');
};

/**
 * Processar queima de custos de reparo (50% dos custos)
 * @param {number} repairCost - Custo total do reparo
 * @returns {Object} Resultado da queima
 */
export const burnRepairCosts = async (repairCost) => {
  if (repairCost <= 0) {
    return { burned: 0 };
  }

  // 50% dos custos de reparo são queimados
  const burned = repairCost * 0.5;
  
  return await burnCurrency(burned, 'Reparo de infraestrutura (50% queimado)');
};

/**
 * Obter total de moeda queimada (para estatísticas)
 * Nota: Em produção, isso seria armazenado em uma tabela de queima
 */
export const getTotalBurned = async () => {
  // Por enquanto retorna 0, mas em produção seria uma query ao banco
  // que soma todas as queimas registradas
  return {
    totalBurned: 0,
    fuelBurned: 0,
    repairBurned: 0
  };
};

