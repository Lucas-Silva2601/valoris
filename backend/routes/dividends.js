import express from 'express';
import * as dividendController from '../controllers/dividendController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/country/:countryId', dividendController.getDividendHistory);
router.get('/user', authenticate, dividendController.getUserDividends);

export default router;

