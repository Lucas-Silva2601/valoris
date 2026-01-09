/**
 * Controller de Analytics
 */

import * as analyticsService from '../services/analyticsService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AnalyticsController');

/**
 * Obter métricas do dia atual
 */
export const getDailyMetrics = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const metrics = await analyticsService.calculateDailyMetrics(date);
    res.json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas diárias:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
};

/**
 * Obter métricas por período
 */
export const getMetricsByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate e endDate são obrigatórios' 
      });
    }

    const metrics = await analyticsService.getMetricsByPeriod(
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas por período:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
};

/**
 * Obter heatmap de atividade
 */
export const getActivityHeatmap = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const heatmap = await analyticsService.getActivityHeatmap(start, end);
    res.json(heatmap);
  } catch (error) {
    logger.error('Erro ao obter heatmap:', error);
    res.status(500).json({ error: 'Erro ao obter heatmap' });
  }
};

/**
 * Obter estatísticas gerais
 */
export const getGeneralStats = async (req, res) => {
  try {
    const stats = await analyticsService.getGeneralStats();
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

/**
 * Obter eventos por tipo
 */
export const getEventsByType = async (req, res) => {
  try {
    const { eventType, startDate, endDate, limit } = req.query;
    
    if (!eventType) {
      return res.status(400).json({ error: 'eventType é obrigatório' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const limitNum = limit ? parseInt(limit) : 100;

    const events = await analyticsService.getEventsByType(
      eventType,
      start,
      end,
      limitNum
    );

    res.json(events);
  } catch (error) {
    logger.error('Erro ao obter eventos:', error);
    res.status(500).json({ error: 'Erro ao obter eventos' });
  }
};

