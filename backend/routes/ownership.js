import express from 'express';
import * as ownershipController from '../controllers/countryOwnershipController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBuyShares } from '../middleware/validation.js';
import { validateResources } from '../middleware/antiCheat.js';

const router = express.Router();

router.post('/buy', authenticate, validateBuyShares, validateResources, ownershipController.buyShares);
router.get('/:countryId/shareholders', ownershipController.getShareholders);
router.get('/:countryId/info', ownershipController.getCountryOwnershipInfo);
router.get('/:countryId/voting-power', authenticate, ownershipController.getVotingPower);

export default router;

