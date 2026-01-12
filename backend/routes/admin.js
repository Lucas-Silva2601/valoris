import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as debugController from '../controllers/debugController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * ROTAS ADMINISTRATIVAS - MODO DEUS PARA TESTES
 * 
 * IMPORTANTE: Estas rotas devem ser protegidas em produção!
 * Por enquanto, para fase de teste, usamos autenticação opcional.
 */

// Middleware para permitir acesso admin ou fase de teste
const adminOrTestMode = async (req, res, next) => {
  try {
    // Tentar autenticação normal primeiro
    if (req.headers.authorization) {
      return authenticate(req, res, (err) => {
        if (err) {
          // Se falhar, permitir em modo teste
          req.user = { id: req.headers['user-id'] || 'test-user-id', role: 'admin' };
          return next();
        }
        // Se autenticado, verificar se é admin
        if (req.user.role === 'admin') {
          return next();
        }
        // Senão, permitir em modo teste
        req.user = { ...req.user, role: 'admin' };
        next();
      });
    }
    // Se não tiver token, permitir em modo teste
    req.user = { 
      id: req.headers['user-id'] || req.body.userId || 'test-user-id', 
      role: 'admin' 
    };
    next();
  } catch (error) {
    // Em caso de erro, permitir em modo teste
    req.user = { 
      id: req.headers['user-id'] || req.body.userId || 'test-user-id', 
      role: 'admin' 
    };
    next();
  }
};

/**
 * POST /api/admin/wallet/set-balance
 * Define o saldo de um usuário (Modo Deus)
 * Body: { userId: string, balance: number, reason?: string }
 */
router.post('/wallet/set-balance', adminOrTestMode, adminController.setWalletBalance);

/**
 * POST /api/admin/wallet/add-balance
 * Adiciona saldo a um usuário (Modo Deus)
 * Body: { userId: string, amount: number, reason?: string }
 */
router.post('/wallet/add-balance', adminOrTestMode, adminController.addWalletBalance);

/**
 * GET /api/admin/users
 * Lista todos os usuários (com saldo)
 */
router.get('/users', adminOrTestMode, adminController.listUsers);

/**
 * ✅ FASE 19.4: GET /api/admin/debug
 * Retorna métricas de debug do sistema (NPCs, memória, banco, Socket.io, erros)
 */
router.get('/debug', adminOrTestMode, debugController.getDebugInfo);

export default router;

