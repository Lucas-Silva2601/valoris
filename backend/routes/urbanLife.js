import express from 'express';
import * as urbanLifeController from '../controllers/urbanLifeController.js';

const router = express.Router();

/**
 * ✅ FASE 18.5: Rotas de Vida Urbana
 */

// Obter qualidade de vida de uma cidade
router.get('/cities/:cityId/quality-of-life', urbanLifeController.getCityQualityOfLife);

// Obter felicidade de uma cidade
router.get('/cities/:cityId/happiness', urbanLifeController.getCityHappiness);

// Obter métricas urbanas completas
router.get('/cities/:cityId/metrics', urbanLifeController.getCityUrbanMetrics);

export default router;

