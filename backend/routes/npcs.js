import express from 'express';
import * as npcController from '../controllers/npcController.js';

const router = express.Router();

// ✅ FASE 18.5: Rotas para NPCs
router.get('/', npcController.getAllNPCs);
router.get('/virtual-hour', npcController.getVirtualHour);
router.get('/bounding-box', npcController.getNPCsByBoundingBox); // ✅ FASE 19.2: NPCs por bounding box
router.get('/city/:cityId', npcController.getNPCsByCity);
router.get('/:npcId', npcController.getNPCById);
router.post('/', npcController.createNPC);

export default router;

