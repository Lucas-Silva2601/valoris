import express from 'express';
import * as propertyMarketplaceController from '../controllers/propertyMarketplaceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * ✅ FASE 18.4: Rotas do Marketplace Imobiliário
 */

// Listar imóveis à venda (público)
router.get('/listings', propertyMarketplaceController.getActiveListings);

// Criar listagem (requer autenticação)
router.post('/listings', propertyMarketplaceController.createListing);

// Cancelar listagem (requer autenticação)
router.delete('/listings/:listingId', propertyMarketplaceController.cancelListing);

// Comprar imóvel (requer autenticação)
router.post('/listings/:listingId/purchase', propertyMarketplaceController.purchaseProperty);

// Histórico de transações
router.get('/transactions', propertyMarketplaceController.getTransactionHistory);

// Estatísticas de valorização por cidade
router.get('/cities/:cityId/stats', propertyMarketplaceController.getCityPriceStats);

export default router;

