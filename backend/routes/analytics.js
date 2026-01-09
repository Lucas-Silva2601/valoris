import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas de analytics requerem autenticação
router.use(authenticate);

// Apenas admins podem acessar analytics detalhados
router.get('/metrics/daily', requireRole('admin'), analyticsController.getDailyMetrics);
router.get('/metrics/period', requireRole('admin'), analyticsController.getMetricsByPeriod);
router.get('/heatmap', requireRole('admin'), analyticsController.getActivityHeatmap);
router.get('/stats', analyticsController.getGeneralStats); // Todos podem ver stats gerais
router.get('/events', requireRole('admin'), analyticsController.getEventsByType);

export default router;

