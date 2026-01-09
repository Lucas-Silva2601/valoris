import express from 'express';
import * as marketController from '../controllers/marketController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Criar ordem de venda
router.post('/sell', marketController.createSellOrder);

// Comprar ordem
router.post('/buy/:orderId', marketController.buyOrder);

// Cancelar ordem
router.delete('/cancel/:orderId', marketController.cancelOrder);

// Obter ordens ativas de um país
router.get('/country/:countryId', marketController.getActiveOrdersByCountry);

// Obter todas as ordens ativas (Order Book)
router.get('/orders', marketController.getAllActiveOrders);

// Obter minhas ordens
router.get('/my-orders', marketController.getMyOrders);

export default router;

