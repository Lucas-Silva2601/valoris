/**
 * ✅ FASE 19.3: Script de Integridade Referencial
 * Limpa edifícios e NPCs "órfãos" (sem cidade válida)
 */

import { getSupabase, checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';
import buildingRepository from '../repositories/buildingRepository.js';
import npcRepository from '../repositories/npcRepository.js';
import { identifyHierarchy } from '../services/geoHierarchyService.js';

const logger = createLogger('IntegrityCleanup');

/**
 * Identificar e limpar edifícios órfãos (sem cidade válida)
 */
export const cleanupOrphanBuildings = async (dryRun = true) => {
  try {
    if (!checkConnection()) {
      throw new Error('Banco de dados não está conectado');
    }

    logger.info(`🔍 Iniciando limpeza de edifícios órfãos (dryRun: ${dryRun})...`);

    // Buscar todos os edifícios
    const supabase = getSupabase();
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*');

    if (buildingsError) throw buildingsError;

    const orphanBuildings = [];
    const fixedBuildings = [];

    for (const building of buildings || []) {
      // Verificar se o edifício tem cidade válida
      const hasValidCity = building.city_id && building.city_id.trim() !== '';

      if (!hasValidCity && building.position_lat && building.position_lng) {
        // Tentar identificar a cidade a partir das coordenadas
        try {
          const hierarchy = await identifyHierarchy(
            building.position_lat,
            building.position_lng
          );

          if (hierarchy.cityId) {
            // Atualizar o edifício com a cidade identificada
            if (!dryRun) {
              await buildingRepository.update(building.id, {
                cityId: hierarchy.cityId,
                cityName: hierarchy.cityName || null,
                stateId: hierarchy.stateId || null,
                stateName: hierarchy.stateName || null,
                countryId: hierarchy.countryId || building.country_id,
                countryName: hierarchy.countryName || building.country_name
              });
              fixedBuildings.push({
                id: building.id,
                buildingId: building.building_id,
                hierarchy
              });
              logger.info(`✅ Edifício ${building.building_id} corrigido: ${hierarchy.cityName || 'N/A'}`);
            } else {
              fixedBuildings.push({
                id: building.id,
                buildingId: building.building_id,
                hierarchy
              });
              logger.info(`[DRY RUN] ✅ Edifício ${building.building_id} seria corrigido: ${hierarchy.cityName || 'N/A'}`);
            }
          } else {
            // Não foi possível identificar a cidade
            orphanBuildings.push({
              id: building.id,
              buildingId: building.building_id,
              position: {
                lat: building.position_lat,
                lng: building.position_lng
              }
            });
          }
        } catch (error) {
          logger.warn(`⚠️ Erro ao identificar cidade para edifício ${building.building_id}:`, error.message);
          orphanBuildings.push({
            id: building.id,
            buildingId: building.building_id,
            error: error.message
          });
        }
      } else if (!hasValidCity) {
        // Edifício sem cidade e sem coordenadas válidas
        orphanBuildings.push({
          id: building.id,
          buildingId: building.building_id,
          reason: 'Sem cidade e sem coordenadas válidas'
        });
      }
    }

    logger.info(`📊 Resultados:`);
    logger.info(`   - Edifícios corrigidos: ${fixedBuildings.length}`);
    logger.info(`   - Edifícios órfãos: ${orphanBuildings.length}`);

    if (orphanBuildings.length > 0) {
      logger.warn(`⚠️ Edifícios órfãos encontrados:`);
      orphanBuildings.slice(0, 10).forEach(building => {
        logger.warn(`   - ${building.buildingId} (${building.reason || 'Sem cidade válida'})`);
      });
      if (orphanBuildings.length > 10) {
        logger.warn(`   ... e mais ${orphanBuildings.length - 10} edifícios`);
      }

      if (!dryRun) {
        logger.warn(`⚠️ AVISO: Edifícios órfãos NÃO foram deletados automaticamente.`);
        logger.warn(`   Execute manualmente se desejar remover: DELETE FROM buildings WHERE id IN (...)`);
      }
    }

    return {
      success: true,
      dryRun,
      fixed: fixedBuildings.length,
      orphans: orphanBuildings.length,
      orphanBuildings,
      fixedBuildings: fixedBuildings.slice(0, 10) // Limitar saída
    };
  } catch (error) {
    logger.error(`❌ Erro ao limpar edifícios órfãos:`, error);
    throw error;
  }
};

/**
 * Identificar e limpar NPCs órfãos (sem cidade válida)
 */
export const cleanupOrphanNPCs = async (dryRun = true) => {
  try {
    if (!checkConnection()) {
      throw new Error('Banco de dados não está conectado');
    }

    logger.info(`🔍 Iniciando limpeza de NPCs órfãos (dryRun: ${dryRun})...`);

    // Buscar todos os NPCs
    const supabase = getSupabase();
    const { data: npcs, error: npcsError } = await supabase
      .from('npcs')
      .select('*');

    if (npcsError) throw npcsError;

    const orphanNPCs = [];
    const fixedNPCs = [];

    for (const npc of npcs || []) {
      // Verificar se o NPC tem cidade válida
      const hasValidCity = npc.city_id && npc.city_id.trim() !== '';

      if (!hasValidCity && npc.position_lat && npc.position_lng) {
        // Tentar identificar a cidade a partir das coordenadas
        try {
          const hierarchy = await identifyHierarchy(
            npc.position_lat,
            npc.position_lng
          );

          if (hierarchy.cityId) {
            // Atualizar o NPC com a cidade identificada
            if (!dryRun) {
              await npcRepository.update(npc.id, {
                cityId: hierarchy.cityId,
                cityName: hierarchy.cityName || null,
                stateId: hierarchy.stateId || null,
                stateName: hierarchy.stateName || null,
                countryId: hierarchy.countryId || npc.country_id,
                countryName: hierarchy.countryName || npc.country_name
              });
              fixedNPCs.push({
                id: npc.id,
                npcId: npc.npc_id,
                hierarchy
              });
              logger.info(`✅ NPC ${npc.npc_id} corrigido: ${hierarchy.cityName || 'N/A'}`);
            } else {
              fixedNPCs.push({
                id: npc.id,
                npcId: npc.npc_id,
                hierarchy
              });
              logger.info(`[DRY RUN] ✅ NPC ${npc.npc_id} seria corrigido: ${hierarchy.cityName || 'N/A'}`);
            }
          } else {
            // Não foi possível identificar a cidade
            orphanNPCs.push({
              id: npc.id,
              npcId: npc.npc_id,
              position: {
                lat: npc.position_lat,
                lng: npc.position_lng
              }
            });
          }
        } catch (error) {
          logger.warn(`⚠️ Erro ao identificar cidade para NPC ${npc.npc_id}:`, error.message);
          orphanNPCs.push({
            id: npc.id,
            npcId: npc.npc_id,
            error: error.message
          });
        }
      } else if (!hasValidCity) {
        // NPC sem cidade e sem coordenadas válidas
        orphanNPCs.push({
          id: npc.id,
          npcId: npc.npc_id,
          reason: 'Sem cidade e sem coordenadas válidas'
        });
      }
    }

    logger.info(`📊 Resultados:`);
    logger.info(`   - NPCs corrigidos: ${fixedNPCs.length}`);
    logger.info(`   - NPCs órfãos: ${orphanNPCs.length}`);

    if (orphanNPCs.length > 0) {
      logger.warn(`⚠️ NPCs órfãos encontrados:`);
      orphanNPCs.slice(0, 10).forEach(npc => {
        logger.warn(`   - ${npc.npcId} (${npc.reason || 'Sem cidade válida'})`);
      });
      if (orphanNPCs.length > 10) {
        logger.warn(`   ... e mais ${orphanNPCs.length - 10} NPCs`);
      }

      if (!dryRun) {
        logger.warn(`⚠️ AVISO: NPCs órfãos NÃO foram deletados automaticamente.`);
        logger.warn(`   Execute manualmente se desejar remover: DELETE FROM npcs WHERE id IN (...)`);
      }
    }

    return {
      success: true,
      dryRun,
      fixed: fixedNPCs.length,
      orphans: orphanNPCs.length,
      orphanNPCs,
      fixedNPCs: fixedNPCs.slice(0, 10) // Limitar saída
    };
  } catch (error) {
    logger.error(`❌ Erro ao limpar NPCs órfãos:`, error);
    throw error;
  }
};

/**
 * Executar limpeza completa de integridade referencial
 */
export const runIntegrityCleanup = async (dryRun = true, options = {}) => {
  try {
    logger.info(`🚀 Iniciando limpeza de integridade referencial...`);
    logger.info(`   Modo: ${dryRun ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}`);

    const results = {
      buildings: null,
      npcs: null
    };

    if (options.cleanBuildings !== false) {
      results.buildings = await cleanupOrphanBuildings(dryRun);
    }

    if (options.cleanNPCs !== false) {
      results.npcs = await cleanupOrphanNPCs(dryRun);
    }

    logger.info(`✅ Limpeza de integridade referencial concluída!`);
    logger.info(`   Edifícios corrigidos: ${results.buildings?.fixed || 0}`);
    logger.info(`   NPCs corrigidos: ${results.npcs?.fixed || 0}`);

    return results;
  } catch (error) {
    logger.error(`❌ Erro ao executar limpeza de integridade:`, error);
    throw error;
  }
};

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv[2] !== '--execute';
  runIntegrityCleanup(dryRun)
    .then(results => {
      console.log('\n📊 Resultados:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

