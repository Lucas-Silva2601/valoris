import express from 'express';
import * as npcController from '../controllers/npcController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Obter NPCs de um país (público)
router.get('/country/:countryId', npcController.getNPCsByCountry);

// Obter TODOS os NPCs (público - para mostrar no mapa)
// FASE DE TESTE: Sem autenticação obrigatória
router.get('/all', npcController.getAllNPCs);

// Processar movimento de NPCs (pode ser chamado por job)
router.post('/process-movement', npcController.processNPCsMovement);

// Criar NPCs iniciais para um país (requer autenticação)
router.post('/create-initial', authenticate, npcController.createInitialNPCs);

export default router;

