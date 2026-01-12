import * as npcService from '../services/npcService.js';
import npcRepository from '../repositories/npcRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCController');

/**
 * ✅ FASE 18.5: Obter todos os NPCs
 * ✅ FASE 19.2: Suporte para filtro por Bounding Box (viewport) para performance
 */
export const getAllNPCs = async (req, res) => {
  try {
    const { countryId, cityId, routineState, minLat, maxLat, minLng, maxLng } = req.query;
    
    let npcs = [];
    if (cityId) {
      npcs = await npcRepository.findByCityId(cityId);
    } else if (countryId) {
      npcs = await npcRepository.findByCountryId(countryId);
    } else if (routineState) {
      npcs = await npcRepository.findByRoutineState(routineState);
    } else {
      npcs = await npcRepository.find({});
    }

    // ✅ FASE 19.2: Filtrar NPCs dentro do Bounding Box (viewport) se fornecido
    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      const bboxMinLat = parseFloat(minLat);
      const bboxMaxLat = parseFloat(maxLat);
      const bboxMinLng = parseFloat(minLng);
      const bboxMaxLng = parseFloat(maxLng);

      npcs = npcs.filter(npc => {
        const lat = npc.positionLat || npc.position?.lat;
        const lng = npc.positionLng || npc.position?.lng;
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return false;
        }

        // Verificar se está dentro do bounding box
        return lat >= bboxMinLat && lat <= bboxMaxLat &&
               lng >= bboxMinLng && lng <= bboxMaxLng;
      });

      logger.debug(`Filtrados ${npcs.length} NPCs dentro do viewport (${bboxMinLat}, ${bboxMinLng}) - (${bboxMaxLat}, ${bboxMaxLng})`);
    }

    res.json({ npcs });
  } catch (error) {
    // ✅ FASE 19.1: Fallback - retornar array vazio se falhar
    logger.error('Erro ao obter NPCs:', error);
    res.status(500).json({ npcs: [], error: error.message });
  }
};

/**
 * ✅ FASE 18.5: Obter NPC por ID
 */
export const getNPCById = async (req, res) => {
  try {
    const { npcId } = req.params;
    const npc = await npcRepository.findByNPCId(npcId);
    
    if (!npc) {
      return res.status(404).json({ error: 'NPC não encontrado' });
    }

    res.json({ npc });
  } catch (error) {
    logger.error(`Erro ao obter NPC ${req.params.npcId}:`, error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ FASE 18.5: Criar NPC em uma cidade
 */
export const createNPC = async (req, res) => {
  try {
    const { cityId, name } = req.body;

    if (!cityId) {
      return res.status(400).json({ error: 'cityId é obrigatório' });
    }

    const npc = await npcService.createNPCInCity(cityId, name);
    res.status(201).json({ success: true, npc, message: 'NPC criado com sucesso!' });
  } catch (error) {
    logger.error('Erro ao criar NPC:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * ✅ FASE 18.5: Obter NPCs de uma cidade
 */
export const getNPCsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const npcs = await npcRepository.findByCityId(cityId);
    res.json({ npcs });
  } catch (error) {
    logger.error(`Erro ao obter NPCs da cidade ${req.params.cityId}:`, error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ FASE 18.5: Obter hora virtual atual
 */
export const getVirtualHour = async (req, res) => {
  try {
    const virtualHour = npcService.getVirtualHour();
    const isDay = npcService.isDayTime(virtualHour);
    const isWorkTime = npcService.isWorkTime(virtualHour);
    
    res.json({
      virtualHour,
      isDay,
      isWorkTime,
      workStartHour: 8,
      workEndHour: 18
    });
  } catch (error) {
    logger.error('Erro ao obter hora virtual:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ FASE 19.2: Obter NPCs dentro do bounding box (viewport do mapa)
 * Filtra NPCs visíveis no campo de visão do jogador para reduzir payload do Socket.io
 */
export const getNPCsByBoundingBox = async (req, res) => {
  try {
    const { minLat, minLng, maxLat, maxLng } = req.query;

    if (!minLat || !minLng || !maxLat || !maxLng) {
      return res.status(400).json({ error: 'Parâmetros de bounding box são obrigatórios (minLat, minLng, maxLat, maxLng)' });
    }

    const bbox = {
      minLat: parseFloat(minLat),
      minLng: parseFloat(minLng),
      maxLat: parseFloat(maxLat),
      maxLng: parseFloat(maxLng)
    };

    // Validar bounding box
    if (isNaN(bbox.minLat) || isNaN(bbox.minLng) || isNaN(bbox.maxLat) || isNaN(bbox.maxLng)) {
      return res.status(400).json({ error: 'Parâmetros de bounding box inválidos' });
    }

    // Buscar todos os NPCs (ou filtrar por cidade/país se fornecido)
    const { cityId, countryId } = req.query;
    let allNPCs = [];
    
    if (cityId) {
      allNPCs = await npcRepository.findByCityId(cityId);
    } else if (countryId) {
      allNPCs = await npcRepository.findByCountryId(countryId);
    } else {
      allNPCs = await npcRepository.find({});
    }

    // Filtrar NPCs dentro do bounding box
    const visibleNPCs = allNPCs.filter(npc => {
      const lat = npc.positionLat || npc.position?.lat;
      const lng = npc.positionLng || npc.position?.lng;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return false;
      }

      return lat >= bbox.minLat && lat <= bbox.maxLat &&
             lng >= bbox.minLng && lng <= bbox.maxLng;
    });

    logger.debug(`NPCs filtrados: ${visibleNPCs.length} de ${allNPCs.length} (bbox: ${bbox.minLat},${bbox.minLng} a ${bbox.maxLat},${bbox.maxLng})`);

    res.json({ npcs: visibleNPCs, total: allNPCs.length, visible: visibleNPCs.length });
  } catch (error) {
    logger.error('Erro ao obter NPCs por bounding box:', error);
    res.status(500).json({ error: error.message });
  }
};

