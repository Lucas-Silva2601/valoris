import * as economicMetricsService from '../services/economicMetricsService.js';

export const getEconomicMetrics = async (req, res) => {
  try {
    const { countryId } = req.params;
    const metrics = await economicMetricsService.calculateEconomicHealth(countryId);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRandomEvent = async (req, res) => {
  try {
    const { countryId } = req.params;
    const metrics = await economicMetricsService.createRandomEvent(countryId);
    
    res.json({
      success: true,
      metrics,
      message: 'Evento econômico criado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

