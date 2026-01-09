import express from 'express';
import * as militaryController from '../controllers/militaryUnitController.js';
import { authenticate } from '../middleware/auth.js';
import { validateCreateUnit, validateMoveUnit } from '../middleware/validation.js';
import { validateResources, validateUnitOwnership } from '../middleware/antiCheat.js';

const router = express.Router();

router.post('/units', authenticate, validateCreateUnit, validateResources, militaryController.createUnit);
router.get('/units', authenticate, militaryController.getUserUnits);
router.get('/units/country/:countryId', militaryController.getUnitsInCountry);
router.post('/units/:unitId/move', authenticate, validateUnitOwnership, validateMoveUnit, militaryController.moveUnit);
router.get('/units/stats', militaryController.getUnitStats);

export default router;

