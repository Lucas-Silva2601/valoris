import express from 'express';
import * as systemMonitoringController from '../controllers/systemMonitoringController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação e role de admin
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/system', systemMonitoringController.getSystemMetrics);
router.get('/database', systemMonitoringController.getDatabaseMetrics);
router.get('/health', systemMonitoringController.getSystemHealth);
router.get('/errors', systemMonitoringController.getRecentErrors);

export default router;

