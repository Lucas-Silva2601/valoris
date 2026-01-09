import express from 'express';
import * as economicController from '../controllers/economicMetricsController.js';

const router = express.Router();

router.get('/:countryId', economicController.getEconomicMetrics);
router.post('/:countryId/event', economicController.createRandomEvent);

export default router;

