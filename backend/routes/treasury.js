import express from 'express';
import * as treasuryController from '../controllers/treasuryController.js';

const router = express.Router();

router.get('/:countryId', treasuryController.getTreasuryInfo);
router.post('/:countryId/infrastructure', treasuryController.upgradeInfrastructure);
router.post('/:countryId/defense', treasuryController.upgradeDefense);

export default router;

