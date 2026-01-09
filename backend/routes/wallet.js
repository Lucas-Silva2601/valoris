import express from 'express';
import * as walletController from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { paginationMiddleware } from '../utils/pagination.js';

const router = express.Router();

// FASE DE TESTE: Middleware que permite autenticação opcional
const optionalAuth = async (req, res, next) => {
  try {
    // Tentar autenticação normal primeiro
    if (req.headers.authorization) {
      return authenticate(req, res, next);
    }
    // Se não tiver token, usar userId de teste
    req.user = { id: req.headers['user-id'] || 'test-user-id' };
    next();
  } catch (error) {
    // Se autenticação falhar, usar userId de teste
    req.user = { id: req.headers['user-id'] || 'test-user-id' };
    next();
  }
};

router.get('/balance', optionalAuth, walletController.getBalance);
router.post('/ensure-initial-balance', optionalAuth, walletController.addInitialBalance);
router.post('/faucet', optionalAuth, walletController.addFaucetBalance); // ✅ NOVA ROTA FAUCET
router.get('/transactions', optionalAuth, paginationMiddleware, walletController.getTransactionHistory);

export default router;

