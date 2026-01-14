import npcRepository from '../repositories/npcRepository.js';
import buildingRepository from '../repositories/buildingRepository.js';
import cityRepository from '../repositories/cityRepository.js';
import * as geoHierarchyService from './geoHierarchyService.js';
import * as turf from '@turf/turf';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('NPCService');

// ✅ FASE 18.5: Horários virtuais (ciclo de 24 horas em 2 horas reais)
const VIRTUAL_DAY_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas reais = 24 horas virtuais
const WORK_START_HOUR = 8; // NPCs começam a trabalhar às 8h
const WORK_END_HOUR = 18; // NPCs terminam de trabalhar às 18h
const REST_START_HOUR = 22; // NPCs começam a descansar às 22h
const REST_END_HOUR = 6; // NPCs acordam às 6h

/**
 * ✅ FASE 18.5: Obter hora virtual atual (0-23)
 */
export const getVirtualHour = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msSinceStartOfDay = now.getTime() - startOfDay.getTime();
  const virtualHour = Math.floor((msSinceStartOfDay % VIRTUAL_DAY_DURATION_MS) / (VIRTUAL_DAY_DURATION_MS / 24));
  return virtualHour;
};

/**
 * ✅ FASE 18.5: Verificar se é dia ou noite
 */
export const isDayTime = (virtualHour) => {
  return virtualHour >= 6 && virtualHour < 22;
};

/**
 * ✅ FASE 18.5: Verificar se é horário de trabalho
 */
export const isWorkTime = (virtualHour) => {
  return virtualHour >= WORK_START_HOUR && virtualHour < WORK_END_HOUR;
};

/**
 * ✅ FASE 18.5: Criar rota urbana otimizada entre dois pontos dentro de uma cidade
 */
export const createUrbanRoute = async (startLat, startLng, endLat, endLng, cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city || !city.geometry) {
      logger.warn(`Cidade ${cityId} não encontrada ou sem geometria para criar rota`);
      return null;
    }

    const startPoint = turf.point([startLng, startLat]);
    const endPoint = turf.point([endLng, endLat]);

    // Verificar se ambos os pontos estão dentro da cidade
    if (!turf.booleanPointInPolygon(startPoint, city.geometry) ||
        !turf.booleanPointInPolygon(endPoint, city.geometry)) {
      logger.warn(`Pontos fora da cidade ${cityId} para criar rota`);
      return null;
    }

    // Criar rota simples com pontos intermediários (simulação de ruas)
    // Em uma implementação real, isso usaria um sistema de rotas mais sofisticado
    const distance = turf.distance(startPoint, endPoint, { units: 'kilometers' });
    const numPoints = Math.max(3, Math.min(10, Math.ceil(distance * 5))); // 5 pontos por km, mínimo 3, máximo 10

    const route = [];
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const intermediatePoint = turf.point([
        startLng + (endLng - startLng) * fraction,
        startLat + (endLat - startLat) * fraction
      ]);

      // Verificar se o ponto intermediário está dentro da cidade
      if (turf.booleanPointInPolygon(intermediatePoint, city.geometry)) {
        route.push({
          lat: intermediatePoint.coordinates[1],
          lng: intermediatePoint.coordinates[0]
        });
      }
    }

    // Garantir que o último ponto seja o destino
    route[route.length - 1] = { lat: endLat, lng: endLng };

    return route;
  } catch (error) {
    logger.error(`Erro ao criar rota urbana:`, error);
    return null;
  }
};

/**
 * ✅ FASE 18.5: Atribuir casa e trabalho a um NPC baseado na cidade
 */
export const assignHomeAndWork = async (npc, cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    // Buscar edifícios na cidade
    const buildings = await buildingRepository.findByCityId(cityId);

    // Separar edifícios por tipo
    const housingBuildings = buildings.filter(b => 
      ['house', 'apartment', 'skyscraper'].includes(b.type)
    );
    const workBuildings = buildings.filter(b => 
      ['office', 'factory', 'skyscraper'].includes(b.type)
    );

    if (housingBuildings.length === 0 || workBuildings.length === 0) {
      logger.warn(`Cidade ${cityId} não tem edifícios suficientes para atribuir casa/trabalho`);
      return null;
    }

    // Escolher casa aleatória
    const homeBuilding = housingBuildings[Math.floor(Math.random() * housingBuildings.length)];

    // Escolher trabalho aleatório (preferencialmente na mesma cidade)
    const workBuilding = workBuildings[Math.floor(Math.random() * workBuildings.length)];

    // Atualizar NPC
    await npcRepository.update(npc.id, {
      homeBuildingId: homeBuilding.id,
      workBuildingId: workBuilding.id,
      cityId: cityId,
      cityName: city.name,
      stateId: city.stateId,
      stateName: city.stateName,
      positionLat: homeBuilding.positionLat || homeBuilding.position.lat,
      positionLng: homeBuilding.positionLng || homeBuilding.position.lng
    });

    logger.info(`✅ Casa e trabalho atribuídos ao NPC ${npc.npcId}: casa=${homeBuilding.name}, trabalho=${workBuilding.name}`);

    return {
      homeBuilding,
      workBuilding
    };
  } catch (error) {
    logger.error(`Erro ao atribuir casa e trabalho ao NPC ${npc.npcId}:`, error);
    throw error;
  }
};

/**
 * ✅ FASE 18.5: Processar rotina de um NPC (Casa → Trabalho → Casa)
 */
export const processNPCRoutine = async (npc) => {
  try {
    const virtualHour = getVirtualHour();
    const currentRoutineState = npc.routineState || 'resting';

    // ✅ Atualizar hora virtual do NPC apenas se necessário
    // (virtual_hour pode não existir no schema ainda)

    // Se NPC não tem casa ou trabalho, atribuir
    if (!npc.homeBuildingId || !npc.workBuildingId) {
      let cityIdToUse = npc.cityId;
      
      // ✅ Se NPC não tem cityId, tentar identificar usando coordenadas
      if (!cityIdToUse && npc.positionLat && npc.positionLng) {
        try {
          const { identifyHierarchy } = await import('./geoHierarchyService.js');
          const hierarchy = await identifyHierarchy(npc.positionLat, npc.positionLng);
          
          if (hierarchy.valid && hierarchy.city) {
            cityIdToUse = hierarchy.city.id;
            
            // ✅ Atualizar NPC com cidade identificada
            await npcRepository.update(npc.id, {
              cityId: hierarchy.city.id,
              cityName: hierarchy.city.name,
              stateId: hierarchy.state?.id || null,
              stateName: hierarchy.state?.name || null,
              countryId: hierarchy.country?.id || npc.countryId,
              countryName: hierarchy.country?.name || npc.countryName
            });
            
            logger.info(`✅ Cidade identificada para NPC ${npc.npcId || npc.id}: ${hierarchy.city.name}`);
          }
        } catch (error) {
          logger.debug(`Não foi possível identificar cidade para NPC ${npc.npcId || npc.id}: ${error.message}`);
        }
      }
      
      if (cityIdToUse) {
        await assignHomeAndWork(npc, cityIdToUse);
        // Recarregar NPC
        const updatedNPC = await npcRepository.findByNPCId(npc.npcId);
        return await processNPCRoutine(updatedNPC);
      } else {
        // ✅ Apenas logar em debug, não em warn (para não poluir logs)
        logger.debug(`NPC ${npc.npcId || npc.id || 'desconhecido'} não tem cidade atribuída e não foi possível identificar`);
        return npc;
      }
    }

    // Buscar edifícios por ID
    const homeBuilding = await buildingRepository.findById(npc.homeBuildingId);
    const workBuilding = await buildingRepository.findById(npc.workBuildingId);

    if (!homeBuilding || !workBuilding) {
      logger.warn(`NPC ${npc.npcId} tem edifícios inválidos`);
      return npc;
    }

    const homePosition = {
      lat: homeBuilding.positionLat || homeBuilding.position.lat,
      lng: homeBuilding.positionLng || homeBuilding.position.lng
    };
    const workPosition = {
      lat: workBuilding.positionLat || workBuilding.position.lat,
      lng: workBuilding.positionLng || workBuilding.position.lng
    };

    const currentPosition = {
      lat: npc.positionLat,
      lng: npc.positionLng
    };

    // Lógica de rotina baseada na hora virtual
    let newRoutineState = currentRoutineState;
    let targetPosition = null;
    let newRoute = null;

    if (isWorkTime(virtualHour)) {
      // Horário de trabalho
      if (currentRoutineState === 'resting' || currentRoutineState === 'going_home') {
        // Ir para o trabalho
        newRoutineState = 'going_to_work';
        targetPosition = workPosition;
        newRoute = await createUrbanRoute(
          currentPosition.lat, currentPosition.lng,
          workPosition.lat, workPosition.lng,
          npc.cityId
        );
      } else if (currentRoutineState === 'going_to_work') {
        // Verificar se chegou ao trabalho
        const distanceToWork = turf.distance(
          turf.point([currentPosition.lng, currentPosition.lat]),
          turf.point([workPosition.lng, workPosition.lat]),
          { units: 'kilometers' }
        );
        if (distanceToWork < 0.01) { // 10 metros
          newRoutineState = 'working';
          targetPosition = workPosition;
        } else {
          // Continuar indo para o trabalho
          newRoutineState = 'going_to_work';
          targetPosition = workPosition;
        }
      } else if (currentRoutineState === 'working') {
        // Trabalhando
        newRoutineState = 'working';
        targetPosition = workPosition;
      }
    } else {
      // Fora do horário de trabalho
      if (currentRoutineState === 'working' || currentRoutineState === 'going_to_work') {
        // Voltar para casa
        newRoutineState = 'going_home';
        targetPosition = homePosition;
        newRoute = await createUrbanRoute(
          currentPosition.lat, currentPosition.lng,
          homePosition.lat, homePosition.lng,
          npc.cityId
        );
      } else if (currentRoutineState === 'going_home') {
        // Verificar se chegou em casa
        const distanceToHome = turf.distance(
          turf.point([currentPosition.lng, currentPosition.lat]),
          turf.point([homePosition.lng, homePosition.lat]),
          { units: 'kilometers' }
        );
        if (distanceToHome < 0.01) { // 10 metros
          newRoutineState = 'resting';
          targetPosition = homePosition;
        } else {
          // Continuar indo para casa
          newRoutineState = 'going_home';
          targetPosition = homePosition;
        }
      } else {
        // Descansando em casa
        newRoutineState = 'resting';
        targetPosition = homePosition;
      }
    }

    // Atualizar NPC
    const updateData = {
      routineState: newRoutineState,
      // ✅ Não incluir virtualHour se não for necessário (pode não existir no schema)
      // virtualHour será removido automaticamente pelo BaseRepository se a coluna não existir
      status: newRoutineState === 'working' || newRoutineState === 'resting' ? 'idle' : 'walking',
      targetPositionLat: targetPosition ? targetPosition.lat : null,
      targetPositionLng: targetPosition ? targetPosition.lng : null
    };

    if (newRoute) {
      updateData.currentRoute = newRoute;
      updateData.routeIndex = 0;
    }

    await npcRepository.update(npc.id, updateData);

    return await npcRepository.findByNPCId(npc.npcId);
  } catch (error) {
    logger.error(`Erro ao processar rotina do NPC ${npc.npcId}:`, error);
    throw error;
  }
};

/**
 * ✅ FASE 18.5: Mover NPC ao longo da rota urbana
 */
export const moveNPCAlongRoute = async (npc) => {
  try {
    if (!npc.currentRoute || npc.currentRoute.length === 0) {
      return npc;
    }

    const route = npc.currentRoute;
    const routeIndex = npc.routeIndex || 0;

    if (routeIndex >= route.length) {
      // Rota concluída
      await npcRepository.update(npc.id, {
        currentRoute: [],
        routeIndex: 0,
        status: 'idle'
      });
      return await npcRepository.findByNPCId(npc.npcId);
    }

    const targetPoint = route[routeIndex];
    const currentPosition = {
      lat: npc.positionLat,
      lng: npc.positionLng
    };

    // Calcular distância até o próximo ponto
    const distance = turf.distance(
      turf.point([currentPosition.lng, currentPosition.lat]),
      turf.point([targetPoint.lng, targetPoint.lat]),
      { units: 'kilometers' }
    );

    const speedKmPerSecond = (npc.speed || 5.0) / 3600; // Converter km/h para km/s
    const movementDistance = speedKmPerSecond * 5; // Movimento a cada 5 segundos

    if (distance < 0.001 || distance <= movementDistance) {
      // Chegou ao ponto, ir para o próximo
      await npcRepository.update(npc.id, {
        positionLat: targetPoint.lat,
        positionLng: targetPoint.lng,
        routeIndex: routeIndex + 1
      });
    } else {
      // Mover em direção ao ponto
      const bearing = turf.bearing(
        turf.point([currentPosition.lng, currentPosition.lat]),
        turf.point([targetPoint.lng, targetPoint.lat])
      );
      const destination = turf.destination(
        turf.point([currentPosition.lng, currentPosition.lat]),
        movementDistance,
        bearing,
        { units: 'kilometers' }
      );

      // Verificar se o novo ponto está dentro da cidade
      const city = await cityRepository.findByCityId(npc.cityId);
      if (city && city.geometry) {
        const newPoint = turf.point([destination.geometry.coordinates[0], destination.geometry.coordinates[1]]);
        if (turf.booleanPointInPolygon(newPoint, city.geometry)) {
          await npcRepository.update(npc.id, {
            positionLat: destination.geometry.coordinates[1],
            positionLng: destination.geometry.coordinates[0],
            direction: bearing
          });
        } else {
          // Fora da cidade, recalcular rota
          logger.warn(`NPC ${npc.npcId} tentou sair da cidade, recalculando rota`);
          const newRoute = await createUrbanRoute(
            currentPosition.lat, currentPosition.lng,
            targetPoint.lat, targetPoint.lng,
            npc.cityId
          );
          if (newRoute) {
            await npcRepository.update(npc.id, {
              currentRoute: newRoute,
              routeIndex: 0
            });
          }
        }
      } else {
        // Sem geometria da cidade, permitir movimento
        await npcRepository.update(npc.id, {
          positionLat: destination.geometry.coordinates[1],
          positionLng: destination.geometry.coordinates[0],
          direction: bearing
        });
      }
    }

    return await npcRepository.findByNPCId(npc.npcId);
  } catch (error) {
    logger.error(`Erro ao mover NPC ${npc.npcId} ao longo da rota:`, error);
    throw error;
  }
};

/**
 * ✅ FASE 18.5: Criar NPC em uma cidade
 */
export const createNPCInCity = async (cityId, name = null) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    const npcId = `npc_${uuidv4()}`;
    const names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Lucas', 'Fernanda', 'Rafael', 'Beatriz'];
    const npcName = name || names[Math.floor(Math.random() * names.length)];

    // Gerar posição inicial dentro da cidade
    let position = null;
    if (city.geometry) {
      const randomPoint = turf.randomPoint(1, { bbox: turf.bbox(city.geometry) });
      const point = randomPoint.features[0];
      if (turf.booleanPointInPolygon(point, city.geometry)) {
        position = {
          lat: point.geometry.coordinates[1],
          lng: point.geometry.coordinates[0]
        };
      }
    }

    if (!position) {
      // Fallback: usar centroide da cidade
      const centroid = turf.centroid(city.geometry || turf.point([0, 0]));
      position = {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0]
      };
    }

    const npc = await npcRepository.create({
      npcId,
      name: npcName,
      countryId: city.countryId,
      countryName: city.countryName,
      stateId: city.stateId,
      stateName: city.stateName,
      cityId: cityId,
      cityName: city.name,
      positionLat: position.lat,
      positionLng: position.lng,
      routineState: 'resting',
      // ✅ Não incluir virtualHour até que a coluna seja adicionada ao schema
      // virtualHour: getVirtualHour(),
      status: 'idle',
      npcType: 'resident'
    });

    // Atribuir casa e trabalho
    await assignHomeAndWork(npc, cityId);

    logger.info(`✅ NPC ${npcId} criado na cidade ${city.name}`);

    return await npcRepository.findByNPCId(npcId);
  } catch (error) {
    logger.error(`Erro ao criar NPC na cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * ✅ FASE 18.5: Processar todos os NPCs (rotinas e movimento)
 */
export const processAllNPCs = async () => {
  try {
    const allNPCs = await npcRepository.find({});
    logger.info(`🔄 Processando ${allNPCs.length} NPCs...`);

    // 🔍 DEBUG: Mostrar exemplo de NPC para diagnóstico
    if (allNPCs.length > 0) {
      const exemploNPC = allNPCs[0];
      logger.debug(`🔍 Exemplo de NPC (primeiro da lista):`);
      logger.debug(`   ID: ${exemploNPC.id}`);
      logger.debug(`   Nome: ${exemploNPC.name}`);
      logger.debug(`   cityId: ${exemploNPC.cityId} (tipo: ${typeof exemploNPC.cityId})`);
      logger.debug(`   positionLat: ${exemploNPC.positionLat} (tipo: ${typeof exemploNPC.positionLat})`);
      logger.debug(`   positionLng: ${exemploNPC.positionLng} (tipo: ${typeof exemploNPC.positionLng})`);
      logger.debug(`   Campos disponíveis: ${Object.keys(exemploNPC).join(', ')}`);
    }

    let processed = 0;
    let skippedNoCity = 0;
    let errors = 0;

    for (const npc of allNPCs) {
      try {
        // ✅ Pular NPCs sem cidade e sem coordenadas (não há como identificar)
        if (!npc.cityId && (!npc.positionLat || !npc.positionLng)) {
          skippedNoCity++;
          continue; // Pular silenciosamente
        }

        // Processar rotina
        const updatedNPC = await processNPCRoutine(npc);

        // Se está caminhando, mover ao longo da rota
        if (updatedNPC.status === 'walking' && updatedNPC.currentRoute && updatedNPC.currentRoute.length > 0) {
          await moveNPCAlongRoute(updatedNPC);
        }
        
        processed++;
      } catch (error) {
        errors++;
        logger.error(`Erro ao processar NPC ${npc.npcId || npc.id}:`, error);
      }
    }
    
    if (skippedNoCity > 0) {
      logger.debug(`⏭️  ${skippedNoCity} NPCs pulados (sem cidade e sem coordenadas)`);
    }
    logger.info(`✅ Processamento concluído: ${processed} processados, ${skippedNoCity} pulados, ${errors} erros`);

    logger.info(`✅ Processamento de NPCs concluído`);
  } catch (error) {
    logger.error(`Erro ao processar todos os NPCs:`, error);
    throw error;
  }
};


