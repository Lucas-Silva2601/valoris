import express from 'express';
import * as buildingController from '../controllers/buildingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// FASE DE TESTE: Autenticação opcional
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      return authenticate(req, res, next);
    }
    req.user = { id: req.headers['user-id'] || 'test-user-id' };
    next();
  } catch (error) {
    req.user = { id: req.headers['user-id'] || 'test-user-id' };
    next();
  }
};

// Construir edifício (FASE DE TESTE: sem autenticação obrigatória)
router.post('/build', optionalAuth, buildingController.buildBuilding);

// Obter custo de construção (FASE DE TESTE: sem autenticação obrigatória)
router.get('/cost', optionalAuth, buildingController.getBuildingCost);

// Obter edifícios de um país (FASE DE TESTE: sem autenticação obrigatória)
router.get('/country/:countryId', optionalAuth, buildingController.getBuildingsByCountry);

// ✅ Obter edifícios do usuário (FASE DE TESTE: sem autenticação obrigatória)
router.get('/user/:userId', optionalAuth, buildingController.getMyBuildings);

// Outras rotas requerem autenticação
router.use(authenticate);

// Obter meus edifícios (com autenticação)
router.get('/my-buildings', buildingController.getMyBuildings);

// Melhorar edifício
router.post('/upgrade/:buildingId', buildingController.upgradeBuilding);

// Demolir edifício
router.delete('/demolish/:buildingId', buildingController.demolishBuilding);

export default router;

