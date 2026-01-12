import cityRepository from '../repositories/cityRepository.js';
import buildingRepository from '../repositories/buildingRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('UrbanLifeService');

/**
 * ✅ FASE 18.5: Serviço de Vida Urbana
 * Gerencia felicidade, qualidade de vida e rotinas urbanas
 */

/**
 * Calcular Qualidade de Vida de uma Cidade
 * Baseado em:
 * - Equilíbrio entre casas e empregos
 * - Diversidade de tipos de edifícios
 * - Satisfação de NPCs
 * - Atratividade da cidade
 */
export const calculateCityQualityOfLife = async (cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    const buildings = await buildingRepository.findByCityId(cityId);
    if (!buildings || buildings.length === 0) {
      return {
        cityId,
        cityName: city.name,
        qualityOfLife: 0,
        factors: {
          housingJobsBalance: 0,
          buildingDiversity: 0,
          totalBuildings: 0,
          population: city.population || 0
        }
      };
    }

    // Separar edifícios por tipo
    const residentialBuildings = buildings.filter(b => 
      ['house', 'apartment'].includes(b.type)
    );
    const commercialBuildings = buildings.filter(b => 
      ['office', 'skyscraper'].includes(b.type)
    );
    const industrialBuildings = buildings.filter(b => 
      ['factory'].includes(b.type)
    );
    const serviceBuildings = buildings.filter(b => 
      ['mall'].includes(b.type)
    );

    // Calcular equilíbrio casas/empregos
    const totalHousing = residentialBuildings.length;
    const totalJobs = commercialBuildings.length + industrialBuildings.length;
    
    let housingJobsBalance = 0;
    if (totalHousing > 0 && totalJobs > 0) {
      // Ideal: 1 casa para cada emprego (ou próximo disso)
      const ratio = Math.min(totalHousing / totalJobs, totalJobs / totalHousing);
      housingJobsBalance = ratio * 100; // 0-100
    } else if (totalHousing === 0 && totalJobs > 0) {
      housingJobsBalance = 20; // Penalidade: sem casas
    } else if (totalHousing > 0 && totalJobs === 0) {
      housingJobsBalance = 20; // Penalidade: sem empregos
    }

    // Calcular diversidade de edifícios
    const buildingTypes = new Set(buildings.map(b => b.type));
    const diversity = buildingTypes.size / 6; // 6 tipos possíveis

    // Calcular qualidade de vida (0-100)
    const balanceScore = housingJobsBalance * 0.5; // 50% do score
    const diversityScore = diversity * 30; // 30% do score
    const populationScore = Math.min((city.population || 0) / 50, 20); // 20% do score (até 20 pontos)

    const qualityOfLife = Math.min(
      balanceScore + diversityScore + populationScore,
      100
    );

    return {
      cityId,
      cityName: city.name,
      qualityOfLife: Math.round(qualityOfLife * 100) / 100,
      factors: {
        housingJobsBalance: Math.round(housingJobsBalance * 100) / 100,
        buildingDiversity: Math.round(diversity * 100) / 100,
        totalHousing,
        totalJobs,
        totalBuildings: buildings.length,
        residentialBuildings: residentialBuildings.length,
        commercialBuildings: commercialBuildings.length,
        industrialBuildings: industrialBuildings.length,
        serviceBuildings: serviceBuildings.length,
        population: city.population || 0
      }
    };
  } catch (error) {
    logger.error(`Erro ao calcular qualidade de vida da cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Calcular Felicidade de uma Cidade
 * Baseado em qualidade de vida e satisfação de NPCs
 */
export const calculateCityHappiness = async (cityId) => {
  try {
    const qualityOfLife = await calculateCityQualityOfLife(cityId);
    
    // Importar satisfação de NPCs
    const { calculateNPCSatisfaction } = await import('./npcConsumptionService.js');
    const npcSatisfaction = await calculateNPCSatisfaction(cityId);

    // Felicidade = média ponderada de qualidade de vida e satisfação
    const happiness = (qualityOfLife.qualityOfLife * 0.6) + (npcSatisfaction.satisfaction * 0.4);

    return {
      cityId,
      cityName: qualityOfLife.cityName,
      happiness: Math.round(happiness * 100) / 100,
      qualityOfLife: qualityOfLife.qualityOfLife,
      npcSatisfaction: npcSatisfaction.satisfaction,
      factors: {
        ...qualityOfLife.factors,
        ...npcSatisfaction.factors
      }
    };
  } catch (error) {
    logger.error(`Erro ao calcular felicidade da cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Calcular impacto da felicidade nos impostos
 * Cidades mais felizes geram mais impostos
 */
export const calculateHappinessTaxBonus = async (cityId) => {
  try {
    const happiness = await calculateCityHappiness(cityId);
    
    // Multiplicador de impostos baseado em felicidade
    // Felicidade >= 80: +20% de impostos
    // Felicidade >= 60: +10% de impostos
    // Felicidade < 40: -10% de impostos
    // Felicidade < 20: -20% de impostos
    
    let taxMultiplier = 1.0;
    if (happiness.happiness >= 80) {
      taxMultiplier = 1.2;
    } else if (happiness.happiness >= 60) {
      taxMultiplier = 1.1;
    } else if (happiness.happiness < 20) {
      taxMultiplier = 0.8;
    } else if (happiness.happiness < 40) {
      taxMultiplier = 0.9;
    }

    return {
      cityId,
      cityName: happiness.cityName,
      happiness: happiness.happiness,
      taxMultiplier: Math.round(taxMultiplier * 100) / 100,
      bonusPercent: Math.round((taxMultiplier - 1) * 100)
    };
  } catch (error) {
    logger.error(`Erro ao calcular bônus de impostos por felicidade:`, error);
    throw error;
  }
};

/**
 * Calcular impacto da felicidade nos lucros dos imóveis
 * Cidades mais felizes geram mais lucros
 */
export const calculateHappinessYieldBonus = async (cityId) => {
  try {
    const happiness = await calculateCityHappiness(cityId);
    
    // Multiplicador de yield baseado em felicidade
    // Similar ao multiplicador de impostos, mas aplicado aos yields
    
    let yieldMultiplier = 1.0;
    if (happiness.happiness >= 80) {
      yieldMultiplier = 1.15; // +15% de yield
    } else if (happiness.happiness >= 60) {
      yieldMultiplier = 1.08; // +8% de yield
    } else if (happiness.happiness < 20) {
      yieldMultiplier = 0.85; // -15% de yield
    } else if (happiness.happiness < 40) {
      yieldMultiplier = 0.92; // -8% de yield
    }

    return {
      cityId,
      cityName: happiness.cityName,
      happiness: happiness.happiness,
      yieldMultiplier: Math.round(yieldMultiplier * 100) / 100,
      bonusPercent: Math.round((yieldMultiplier - 1) * 100)
    };
  } catch (error) {
    logger.error(`Erro ao calcular bônus de yield por felicidade:`, error);
    throw error;
  }
};

/**
 * Obter métricas urbanas completas de uma cidade
 */
export const getCityUrbanMetrics = async (cityId) => {
  try {
    const [qualityOfLife, happiness, taxBonus, yieldBonus] = await Promise.all([
      calculateCityQualityOfLife(cityId),
      calculateCityHappiness(cityId),
      calculateHappinessTaxBonus(cityId),
      calculateHappinessYieldBonus(cityId)
    ]);

    return {
      cityId,
      cityName: qualityOfLife.cityName,
      qualityOfLife: qualityOfLife.qualityOfLife,
      happiness: happiness.happiness,
      taxMultiplier: taxBonus.taxMultiplier,
      yieldMultiplier: yieldBonus.yieldMultiplier,
      factors: qualityOfLife.factors,
      recommendations: generateCityRecommendations(qualityOfLife, happiness)
    };
  } catch (error) {
    logger.error(`Erro ao obter métricas urbanas da cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Gerar recomendações para melhorar a cidade
 */
const generateCityRecommendations = (qualityOfLife, happiness) => {
  const recommendations = [];

  if (qualityOfLife.factors.totalHousing === 0) {
    recommendations.push('Construa mais casas e apartamentos para aumentar a população');
  }

  if (qualityOfLife.factors.totalJobs === 0) {
    recommendations.push('Construa escritórios, fábricas ou shoppings para criar empregos');
  }

  if (qualityOfLife.factors.housingJobsBalance < 50) {
    if (qualityOfLife.factors.totalHousing > qualityOfLife.factors.totalJobs) {
      recommendations.push('Construa mais edifícios comerciais/industriais para equilibrar casas e empregos');
    } else {
      recommendations.push('Construa mais casas e apartamentos para equilibrar casas e empregos');
    }
  }

  if (qualityOfLife.factors.buildingDiversity < 0.5) {
    recommendations.push('Diversifique os tipos de edifícios para melhorar a qualidade de vida');
  }

  if (happiness.happiness < 40) {
    recommendations.push('A cidade precisa de melhorias urgentes para aumentar a felicidade');
  }

  return recommendations;
};

