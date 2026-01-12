import * as urbanLifeService from '../services/urbanLifeService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('UrbanLifeController');

/**
 * ✅ FASE 18.5: Controller para Vida Urbana
 */

/**
 * Obter qualidade de vida de uma cidade
 */
export const getCityQualityOfLife = async (req, res) => {
  try {
    const { cityId } = req.params;
    
    if (!cityId) {
      return res.status(400).json({ error: 'cityId é obrigatório' });
    }

    const qualityOfLife = await urbanLifeService.calculateCityQualityOfLife(cityId);
    
    res.json({
      success: true,
      qualityOfLife
    });
  } catch (error) {
    logger.error('Erro ao obter qualidade de vida:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obter felicidade de uma cidade
 */
export const getCityHappiness = async (req, res) => {
  try {
    const { cityId } = req.params;
    
    if (!cityId) {
      return res.status(400).json({ error: 'cityId é obrigatório' });
    }

    const happiness = await urbanLifeService.calculateCityHappiness(cityId);
    
    res.json({
      success: true,
      happiness
    });
  } catch (error) {
    logger.error('Erro ao obter felicidade:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obter métricas urbanas completas de uma cidade
 */
export const getCityUrbanMetrics = async (req, res) => {
  try {
    const { cityId } = req.params;
    
    if (!cityId) {
      return res.status(400).json({ error: 'cityId é obrigatório' });
    }

    const metrics = await urbanLifeService.getCityUrbanMetrics(cityId);
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Erro ao obter métricas urbanas:', error);
    res.status(500).json({ error: error.message });
  }
};

