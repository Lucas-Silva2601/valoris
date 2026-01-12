import buildingRepository from '../repositories/buildingRepository.js';
import cityRepository from '../repositories/cityRepository.js';
import stateRepository from '../repositories/stateRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import { addBalance } from './walletService.js';
import { distributeTaxes } from './taxService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('UrbanEconomyService');

/**
 * ✅ FASE 18.3: Serviço de Economia Urbana
 * Gerencia yield, atratividade de cidades e economia de demanda
 */

// Valores base de yield por tipo de edifício
const BUILDING_TYPE_MULTIPLIERS = {
  house: 5,      // Casas geram menos yield
  apartment: 10,
  office: 20,
  skyscraper: 50,
  factory: 30,
  mall: 25
};

/**
 * Calcular Atratividade de uma Cidade
 * Fatores:
 * - Número de prédios comerciais/industriais
 * - Número de NPCs na cidade (população)
 * - Diversidade de tipos de edifícios
 * - Condição geral dos edifícios
 */
export const calculateCityAttractiveness = async (cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    // Buscar todos os edifícios da cidade
    const buildings = await buildingRepository.findByCityId(cityId);
    
    if (!buildings || buildings.length === 0) {
      return {
        cityId,
        cityName: city.name,
        attractiveness: 0,
        factors: {
          commercialBuildings: 0,
          industrialBuildings: 0,
          totalBuildings: 0,
          buildingDiversity: 0,
          averageCondition: 100,
          population: city.population || 0
        }
      };
    }

    // Contar tipos de edifícios
    const commercialBuildings = buildings.filter(b => 
      ['office', 'skyscraper', 'mall'].includes(b.type)
    ).length;
    
    const industrialBuildings = buildings.filter(b => 
      ['factory'].includes(b.type)
    ).length;

    const residentialBuildings = buildings.filter(b => 
      ['house', 'apartment'].includes(b.type)
    ).length;

    // Calcular diversidade (quanto mais tipos diferentes, melhor)
    const buildingTypes = new Set(buildings.map(b => b.type));
    const diversity = buildingTypes.size / 6; // 6 tipos possíveis

    // Calcular condição média dos edifícios
    const averageCondition = buildings.reduce((sum, b) => sum + (b.condition || 100), 0) / buildings.length;

    // Fórmula de atratividade (0-100)
    const commercialScore = commercialBuildings * 10; // Cada prédio comercial adiciona 10 pontos
    const industrialScore = industrialBuildings * 8;  // Cada fábrica adiciona 8 pontos
    const diversityScore = diversity * 20;             // Diversidade adiciona até 20 pontos
    const conditionScore = (averageCondition / 100) * 15; // Condição adiciona até 15 pontos
    const populationScore = Math.min((city.population || 0) / 100, 20); // População adiciona até 20 pontos

    const attractiveness = Math.min(
      commercialScore + industrialScore + diversityScore + conditionScore + populationScore,
      100
    );

    return {
      cityId,
      cityName: city.name,
      attractiveness: Math.round(attractiveness * 100) / 100,
      factors: {
        commercialBuildings,
        industrialBuildings,
        residentialBuildings,
        totalBuildings: buildings.length,
        buildingDiversity: Math.round(diversity * 100) / 100,
        averageCondition: Math.round(averageCondition * 100) / 100,
        population: city.population || 0
      }
    };
  } catch (error) {
    logger.error(`Erro ao calcular atratividade da cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Calcular Yield (Lucro) de um Edifício
 * Fórmula: (Tipo de Prédio * Nível) + (População de NPCs da Cidade / 100) * Atratividade
 */
export const calculateBuildingYield = async (buildingId) => {
  try {
    const building = await buildingRepository.findByBuildingId(buildingId);
    if (!building) {
      throw new Error(`Edifício ${buildingId} não encontrado`);
    }

    // Se não tem cidade, yield mínimo
    if (!building.cityId) {
      const baseYield = (BUILDING_TYPE_MULTIPLIERS[building.type] || 10) * building.level;
      return {
        buildingId,
        buildingType: building.type,
        baseYield: baseYield,
        yield: baseYield,
        cityAttractiveness: 0,
        populationBonus: 0
      };
    }

    // Calcular atratividade da cidade
    const attractiveness = await calculateCityAttractiveness(building.cityId);
    
    // Obter cidade para população
    const city = await cityRepository.findByCityId(building.cityId);
    const population = city?.population || 0;

    // Calcular yield base (Tipo * Nível)
    const baseYield = (BUILDING_TYPE_MULTIPLIERS[building.type] || 10) * building.level;

    // Bônus de população (População / 100)
    const populationBonus = population / 100;

    // ✅ FASE 18.3: Calcular impacto de NPCs (satisfação)
    const { calculateNPCImpactOnYields } = await import('./npcConsumptionService.js');
    const npcImpact = await calculateNPCImpactOnYields(building.cityId);

    // ✅ FASE 18.5: Calcular impacto da felicidade no yield
    const { calculateHappinessYieldBonus } = await import('./urbanLifeService.js');
    const happinessBonus = await calculateHappinessYieldBonus(building.cityId);

    // Bônus de atratividade (multiplicador baseado na atratividade da cidade)
    const attractivenessMultiplier = 1 + (attractiveness.attractiveness / 100);

    // Aplicar multiplicador de NPCs
    const npcMultiplier = npcImpact.totalMultiplier;
    
    // Aplicar multiplicador de felicidade
    const happinessMultiplier = happinessBonus.yieldMultiplier;

    // Yield final = (Base + Bônus de População) * Multiplicador de Atratividade * Multiplicador de NPCs * Multiplicador de Felicidade
    const calculatedYield = (baseYield + populationBonus) * attractivenessMultiplier * npcMultiplier * happinessMultiplier;

    // Aplicar condição do edifício (edifícios danificados geram menos)
    const conditionMultiplier = (building.condition || 100) / 100;
    const finalYield = calculatedYield * conditionMultiplier;

    return {
      buildingId,
      buildingType: building.type,
      level: building.level,
      baseYield: Math.round(baseYield * 100) / 100,
      populationBonus: Math.round(populationBonus * 100) / 100,
      attractivenessMultiplier: Math.round(attractivenessMultiplier * 100) / 100,
      npcMultiplier: Math.round(npcMultiplier * 100) / 100,
      happinessMultiplier: Math.round(happinessMultiplier * 100) / 100,
      conditionMultiplier: Math.round(conditionMultiplier * 100) / 100,
      yield: Math.round(finalYield * 100) / 100,
      cityId: building.cityId,
      cityName: building.cityName,
      cityAttractiveness: attractiveness.attractiveness,
      population: population,
      npcSatisfaction: npcImpact.satisfaction,
      npcImpact: npcImpact
    };
  } catch (error) {
    logger.error(`Erro ao calcular yield do edifício ${buildingId}:`, error);
    throw error;
  }
};

/**
 * Calcular Yield previsto para um edifício (antes de construir)
 */
export const calculatePredictedYield = async (buildingType, level, cityId) => {
  try {
    const baseYield = (BUILDING_TYPE_MULTIPLIERS[buildingType] || 10) * level;
    
    if (!cityId) {
      return {
        baseYield,
        predictedYield: baseYield,
        cityAttractiveness: 0
      };
    }

    const city = await cityRepository.findByCityId(cityId);
    const attractiveness = await calculateCityAttractiveness(cityId);
    const population = city?.population || 0;

    const populationBonus = population / 100;
    const attractivenessMultiplier = 1 + (attractiveness.attractiveness / 100);
    const predictedYield = (baseYield + populationBonus) * attractivenessMultiplier;

    return {
        baseYield: Math.round(baseYield * 100) / 100,
        populationBonus: Math.round(populationBonus * 100) / 100,
        attractivenessMultiplier: Math.round(attractivenessMultiplier * 100) / 100,
        predictedYield: Math.round(predictedYield * 100) / 100,
        cityAttractiveness: attractiveness.attractiveness,
        population: population
    };
  } catch (error) {
    logger.error(`Erro ao calcular yield previsto:`, error);
    throw error;
  }
};

/**
 * Distribuir lucros de todos os edifícios de uma cidade
 */
export const distributeCityYields = async (cityId) => {
  try {
    const buildings = await buildingRepository.findByCityId(cityId);
    
    if (!buildings || buildings.length === 0) {
      return { cityId, totalDistributed: 0, buildings: [] };
    }

    const distributions = [];
    let totalDistributed = 0;

    for (const building of buildings) {
      try {
        // Apenas edifícios com dono geram lucro
        if (!building.ownerId) {
          continue;
        }

        const yieldData = await calculateBuildingYield(building.buildingId);
        const yieldAmount = yieldData.yield;

        if (yieldAmount > 0) {
          // Distribuir impostos (10% total: 3% prefeitura, 2% estado, 5% nacional)
          const afterTaxes = yieldAmount * 0.9;
          const taxes = yieldAmount * 0.1;

          // Adicionar lucro ao dono
          await addBalance(
            building.ownerId,
            afterTaxes,
            `Lucro do edifício ${building.name || building.type} em ${building.cityName || building.cityId}`,
            { buildingId: building.buildingId, cityId, yieldAmount }
          );

          // Distribuir impostos
          await distributeTaxes(
            taxes,
            building.countryId,
            building.stateId,
            building.cityId
          );

          // Atualizar yield_rate no edifício
          await buildingRepository.update(building.id, {
            yieldRate: yieldAmount
          });

          totalDistributed += afterTaxes;
          distributions.push({
            buildingId: building.buildingId,
            ownerId: building.ownerId,
            yieldAmount: Math.round(yieldAmount * 100) / 100,
            afterTaxes: Math.round(afterTaxes * 100) / 100,
            taxes: Math.round(taxes * 100) / 100
          });
        }
      } catch (error) {
        logger.error(`Erro ao distribuir yield do edifício ${building.buildingId}:`, error);
        continue;
      }
    }

    return {
      cityId,
      totalDistributed: Math.round(totalDistributed * 100) / 100,
      buildings: distributions
    };
  } catch (error) {
    logger.error(`Erro ao distribuir yields da cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Atualizar Land Value de uma cidade baseado no número de prédios
 * Fórmula: land_value = base_value * (1 + (building_count / 100) * 0.1)
 */
export const updateCityLandValue = async (cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    const buildings = await buildingRepository.findByCityId(cityId);
    const buildingCount = buildings?.length || 0;

    // Usar método do repositório que já calcula baseado em building_count
    await cityRepository.updateLandValue(cityId, buildingCount);

    const updatedCity = await cityRepository.findByCityId(cityId);
    
    logger.info(`💰 Land value da cidade ${cityId} atualizado: ${updatedCity.landValue.toFixed(2)} VAL (${buildingCount} prédios)`);
    
    return {
      cityId,
      buildingCount,
      oldLandValue: city.landValue,
      newLandValue: updatedCity.landValue
    };
  } catch (error) {
    logger.error(`Erro ao atualizar land value da cidade ${cityId}:`, error);
    throw error;
  }
};

