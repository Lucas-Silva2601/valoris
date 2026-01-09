import express from 'express';
import * as missionController from '../controllers/missionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, requireRole('investor'), missionController.createMission);
router.post('/:missionId/accept', authenticate, missionController.acceptMission);
router.post('/:missionId/progress', authenticate, missionController.updateProgress);
router.get('/available', missionController.getAvailableMissions);
router.get('/my', authenticate, missionController.getUserMissions);

export default router;

