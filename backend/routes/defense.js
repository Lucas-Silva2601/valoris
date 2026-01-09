import express from 'express';
import * as defenseController from '../controllers/defenseController.js';

const router = express.Router();

router.get('/:countryId', defenseController.getDefenseInfo);
router.post('/:countryId/technology', defenseController.upgradeTechnology);
router.get('/:countryId/power', defenseController.getDefensePower);

export default router;

