import express from 'express';
import * as combatController from '../controllers/combatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/initiate', authenticate, combatController.initiateCombat);
router.post('/:combatId/round', combatController.processCombatRound);
router.get('/history/:countryId', combatController.getCombatHistory);

export default router;

