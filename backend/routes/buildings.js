import express from 'express';
import * as buildingController from '../controllers/buildingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rotas de yield (FASE 18.3)
// ✅ IMPORTANTE: Rotas específicas devem vir ANTES das rotas com parâmetros genéricos
router.post('/predict-yield', buildingController.predictYield); // ✅ FASE 18.6: Mudado para POST para aceitar body
router.get('/predict-yield', buildingController.predictYield); // Manter GET para compatibilidade

// Rotas existentes
router.post('/', buildingController.buildBuilding); // Usar buildBuilding (não createBuilding)
router.get('/user/:userId', buildingController.getMyBuildings);
router.get('/country/:countryId', buildingController.getBuildingsByCountry);
router.get('/cost', buildingController.getBuildingCost);
router.put('/:buildingId/upgrade', authenticate, buildingController.upgradeBuilding);
router.delete('/:buildingId', authenticate, buildingController.demolishBuilding);

// ✅ FASE 18.3: Rotas de yield (devem vir depois das rotas específicas)
router.get('/:buildingId/yield', buildingController.getBuildingYield);
router.get('/:buildingId', buildingController.getBuilding);

export default router;
