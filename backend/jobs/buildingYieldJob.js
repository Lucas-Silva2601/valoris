import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';
import { checkConnection } from '../config/supabase.js';
import buildingRepository from '../repositories/buildingRepository.js';
import cityRepository from '../repositories/cityRepository.js';
import * as urbanEconomyService from '../services/urbanEconomyService.js';

const logger = createLogger('BuildingYieldJob');

/**
 * ✅ FASE 18.3: Job para distribuir yields (lucros) de edifícios
 * Executa a cada 1 hora para distribuir lucros aos donos dos edifícios
 */

let yieldJobInterval = null;

/**
 * Processar yields de todas as cidades com edifícios
 */
const processAllCityYields = async () => {
  if (!checkConnection()) {
    logger.warn('⚠️  Supabase não conectado. Job de yield não será executado.');
    return;
  }

  try {
    logger.info('💰 Iniciando distribuição de yields de edifícios...');

    // Buscar todas as cidades que têm edifícios
    const allBuildings = await buildingRepository.find({});
    
    // Agrupar por cidade
    const citiesWithBuildings = new Set();
    for (const building of allBuildings) {
      if (building.cityId) {
        citiesWithBuildings.add(building.cityId);
      }
    }

    logger.info(`📊 Processando yields para ${citiesWithBuildings.size} cidades...`);

    let totalDistributed = 0;
    let citiesProcessed = 0;

    // Processar cada cidade
    for (const cityId of citiesWithBuildings) {
      try {
        const result = await urbanEconomyService.distributeCityYields(cityId);
        totalDistributed += result.totalDistributed || 0;
        citiesProcessed++;

        if (result.totalDistributed > 0) {
          logger.info(`✅ ${result.totalDistributed.toFixed(2)} VAL distribuídos em ${cityId} (${result.buildings.length} edifícios)`);
        }

        // Atualizar land value da cidade
        await urbanEconomyService.updateCityLandValue(cityId);
        
        // ✅ FASE 18.3: Atualizar população baseada em satisfação de NPCs
        await npcConsumptionService.updateCityPopulation(cityId);
      } catch (error) {
        logger.error(`Erro ao processar yields da cidade ${cityId}:`, error);
        continue;
      }
    }

    logger.info(`✅ Distribuição de yields concluída: ${totalDistributed.toFixed(2)} VAL distribuídos em ${citiesProcessed} cidades`);
  } catch (error) {
    logger.error('Erro ao processar yields de edifícios:', error);
  }
};

/**
 * Iniciar job de distribuição de yields
 */
export const startBuildingYieldJob = () => {
  if (yieldJobInterval) {
    logger.warn('⚠️  Job de yield já está rodando');
    return;
  }

  logger.info('💰 Iniciando job de distribuição de yields de edifícios...');

  // Executar a cada 1 hora (3600 segundos)
  yieldJobInterval = cron.schedule('0 * * * *', async () => {
    await processAllCityYields();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  // Executar imediatamente na primeira vez
  processAllCityYields();

  logger.info('✅ Job de distribuição de yields agendado para executar a cada 1 hora');
};

/**
 * Parar job de distribuição de yields
 */
export const stopBuildingYieldJob = () => {
  if (yieldJobInterval) {
    yieldJobInterval.stop();
    yieldJobInterval = null;
    logger.info('⏹️  Job de distribuição de yields parado');
  }
};

