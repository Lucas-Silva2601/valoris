import cityRepository from '../repositories/cityRepository.js';
import buildingRepository from '../repositories/buildingRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCConsumptionService');

/**
 * ✅ FASE 18.3: Serviço de Consumo de NPCs
 * Gerencia como NPCs consomem recursos das cidades e impactam a economia
 */

/**
 * Calcular Satisfação de NPCs em uma Cidade
 * Fatores:
 * - Disponibilidade de comércio (mall, shopping)
 * - Disponibilidade de trabalho (factory, office)
 * - Disponibilidade de moradia (house, apartment)
 * - Atratividade da cidade
 */
export const calculateNPCSatisfaction = async (cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    const buildings = await buildingRepository.findByCityId(cityId);
    if (!buildings || buildings.length === 0) {
      return {
        cityId,
        satisfaction: 0,
        factors: {
          hasCommerce: false,
          hasIndustry: false,
          hasResidential: false,
          buildingCount: 0,
          population: city.population || 0
        }
      };
    }

    // Verificar disponibilidade de serviços
    const hasCommerce = buildings.some(b => ['mall', 'skyscraper'].includes(b.type));
    const hasIndustry = buildings.some(b => ['factory'].includes(b.type));
    const hasResidential = buildings.some(b => ['house', 'apartment'].includes(b.type));

    // Calcular satisfação (0-100)
    let satisfaction = 50; // Base

    if (hasCommerce) satisfaction += 20;
    if (hasIndustry) satisfaction += 15;
    if (hasResidential) satisfaction += 15;

    // Bônus por diversidade (ter todos os tipos)
    if (hasCommerce && hasIndustry && hasResidential) {
      satisfaction += 20;
    }

    // Penalidade se cidade muito pequena
    if (buildings.length < 3) {
      satisfaction -= 10;
    }

    // Limitar entre 0 e 100
    satisfaction = Math.max(0, Math.min(100, satisfaction));

    return {
      cityId,
      cityName: city.name,
      satisfaction: Math.round(satisfaction * 100) / 100,
      factors: {
        hasCommerce,
        hasIndustry,
        hasResidential,
        buildingCount: buildings.length,
        population: city.population || 0,
        diversity: hasCommerce && hasIndustry && hasResidential
      }
    };
  } catch (error) {
    logger.error(`Erro ao calcular satisfação de NPCs na cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Calcular impacto de NPCs no lucro dos imóveis
 * NPCs aumentam a demanda, o que aumenta os lucros
 */
export const calculateNPCImpactOnYields = async (cityId) => {
  try {
    const satisfaction = await calculateNPCSatisfaction(cityId);
    const city = await cityRepository.findByCityId(cityId);

    // Multiplicador baseado em satisfação
    // Cidades com alta satisfação (>= 80) têm bônus de 20%
    // Cidades com baixa satisfação (< 40) têm penalidade de 20%
    let multiplier = 1.0;
    
    if (satisfaction.satisfaction >= 80) {
      multiplier = 1.2; // +20% de lucro
    } else if (satisfaction.satisfaction >= 60) {
      multiplier = 1.1; // +10% de lucro
    } else if (satisfaction.satisfaction < 40) {
      multiplier = 0.8; // -20% de lucro
    } else if (satisfaction.satisfaction < 50) {
      multiplier = 0.9; // -10% de lucro
    }

    // Bônus adicional baseado em população
    const population = city?.population || 0;
    const populationMultiplier = 1 + Math.min(population / 1000, 0.3); // Até +30% para cidades populosas

    return {
      cityId,
      satisfactionMultiplier: Math.round(multiplier * 100) / 100,
      populationMultiplier: Math.round(populationMultiplier * 100) / 100,
      totalMultiplier: Math.round((multiplier * populationMultiplier) * 100) / 100,
      satisfaction: satisfaction.satisfaction,
      population: population
    };
  } catch (error) {
    logger.error(`Erro ao calcular impacto de NPCs no yield:`, error);
    throw error;
  }
};

/**
 * Atualizar população de uma cidade baseado em NPCs satisfeitos
 * NPCs migram para cidades mais atrativas
 */
export const updateCityPopulation = async (cityId) => {
  try {
    const satisfaction = await calculateNPCSatisfaction(cityId);
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    // Calcular nova população baseada em satisfação
    // Cidades com alta satisfação atraem mais NPCs
    let newPopulation = city.population || 0;
    
    // Se satisfação alta, aumentar população gradualmente
    if (satisfaction.satisfaction >= 70) {
      newPopulation += Math.floor(satisfaction.satisfaction / 10); // +7 a +10 por ciclo
    } else if (satisfaction.satisfaction < 40) {
      // Se satisfação baixa, NPCs migram
      newPopulation = Math.max(0, newPopulation - Math.floor((40 - satisfaction.satisfaction) / 5));
    }

    // Atualizar população na cidade
    await cityRepository.update(city.id, { population: newPopulation });

    // Se houve migração significativa, logar alerta
    const populationChange = newPopulation - (city.population || 0);
    if (Math.abs(populationChange) > 10) {
      logger.warn(`⚠️ Migração de NPCs em ${city.name} (${cityId}): ${populationChange > 0 ? '+' : ''}${populationChange} NPCs (Satisfação: ${satisfaction.satisfaction.toFixed(1)})`);
    }

    return {
      cityId,
      oldPopulation: city.population || 0,
      newPopulation,
      populationChange,
      satisfaction: satisfaction.satisfaction
    };
  } catch (error) {
    logger.error(`Erro ao atualizar população da cidade ${cityId}:`, error);
    throw error;
  }
};

