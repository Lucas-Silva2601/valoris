import express from 'express';
import * as profileController from '../controllers/playerProfileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, profileController.getProfile);
router.get('/history', authenticate, profileController.getActionHistory);

export default router;

