import express from 'express';
import * as geoHierarchyService from '../services/geoHierarchyService.js';
import cityRepository from '../repositories/cityRepository.js';
import stateRepository from '../repositories/stateRepository.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('GeographyRoutes');

/**
 * ✅ FASE 18.2: Endpoint para obter estados de um país (LAZY LOADING)
 * GET /api/geography/states/:countryId
 */
router.get('/states/:countryId', async (req, res) => {
  try {
    const { countryId } = req.params;
    
    // ✅ Validar countryId antes de processar
    if (!countryId || countryId === 'undefined' || countryId === 'null') {
      return res.status(400).json({ 
        error: 'countryId inválido',
        message: 'countryId é obrigatório e deve ser um valor válido'
      });
    }
    
    const statesGeoJSON = await geoHierarchyService.loadStatesGeoJSON(countryId);
    
    res.json(statesGeoJSON);
  } catch (error) {
    logger.error('Erro ao buscar estados:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estados',
      message: error.message 
    });
  }
});

/**
 * ✅ FASE 18.2: Endpoint para obter cidades de um estado (LAZY LOADING)
 * GET /api/geography/cities/:stateId
 */
router.get('/cities/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params;
    
    // ✅ Validar stateId antes de processar
    if (!stateId || stateId === 'undefined' || stateId === 'null') {
      return res.status(400).json({ 
        error: 'stateId inválido',
        message: 'stateId é obrigatório e deve ser um valor válido'
      });
    }
    
    const citiesGeoJSON = await geoHierarchyService.loadCitiesGeoJSON(stateId);
    
    res.json(citiesGeoJSON);
  } catch (error) {
    logger.error('Erro ao buscar cidades:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar cidades',
      message: error.message 
    });
  }
});

/**
 * ✅ FASE 18.2: Endpoint para identificar hierarquia completa (País > Estado > Cidade)
 * POST /api/geography/identify
 * Body: { lat: number, lng: number }
 */
router.post('/identify', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas',
        message: 'lat e lng são obrigatórios e devem ser números válidos'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        error: 'Coordenadas fora do range válido',
        message: 'lat deve estar entre -90 e 90, lng entre -180 e 180'
      });
    }

    const hierarchy = await geoHierarchyService.identifyHierarchy(lat, lng);
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Erro ao identificar hierarquia:', error);
    res.status(500).json({ 
      error: 'Erro ao identificar hierarquia geográfica',
      message: error.message 
    });
  }
});

/**
 * Limpar cache de GeoJSON (útil para desenvolvimento)
 * POST /api/geography/clear-cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    geoHierarchyService.clearGeoJSONCache();
    res.json({ success: true, message: 'Cache de GeoJSON limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({ 
      error: 'Erro ao limpar cache',
      message: error.message 
    });
  }
});

// ✅ FASE 18.6: Rota para obter informações de uma cidade por ID
router.get('/cities/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }
    res.json(city);
  } catch (error) {
    logger.error(`Erro ao obter cidade ${req.params.cityId}:`, error);
    res.status(500).json({ error: 'Erro ao obter dados da cidade' });
  }
});

// ✅ FASE 18.6: Rota para obter informações de um estado por ID
router.get('/states/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params;
    const state = await stateRepository.findByStateId(stateId);
    if (!state) {
      return res.status(404).json({ error: 'Estado não encontrado' });
    }
    res.json(state);
  } catch (error) {
    logger.error(`Erro ao obter estado ${req.params.stateId}:`, error);
    res.status(500).json({ error: 'Erro ao obter dados do estado' });
  }
});

// ✅ FASE 18.6: Rota para obter lotes de uma cidade
router.get('/cities/:cityId/lots', async (req, res) => {
  try {
    const { cityId } = req.params;
    const lotRepository = (await import('../repositories/lotRepository.js')).default;
    const lots = await lotRepository.findByCityId(cityId);
    res.json({ lots: lots || [] });
  } catch (error) {
    logger.error(`Erro ao obter lotes da cidade ${req.params.cityId}:`, error);
    res.status(500).json({ error: 'Erro ao obter lotes da cidade' });
  }
});

export default router;

