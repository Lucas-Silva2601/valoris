import * as propertyMarketplaceService from '../services/propertyMarketplaceService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('PropertyMarketplaceController');

/**
 * ✅ FASE 18.4: Controller para Marketplace Imobiliário
 */

/**
 * Criar listagem de imóvel à venda
 */
export const createListing = async (req, res) => {
  try {
    const sellerId = req.user?.id || req.headers['user-id'] || req.body.sellerId || 'test-user-id';
    const { buildingId, price, description } = req.body;

    if (!buildingId || !price) {
      return res.status(400).json({ error: 'buildingId e price são obrigatórios' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Preço deve ser maior que zero' });
    }

    const listing = await propertyMarketplaceService.createListing(
      buildingId,
      sellerId,
      price,
      description
    );

    res.json({
      success: true,
      listing,
      message: 'Imóvel listado para venda com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao criar listagem:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Listar imóveis à venda com filtros
 */
export const getActiveListings = async (req, res) => {
  try {
    const filters = {
      cityId: req.query.cityId,
      buildingType: req.query.buildingType,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      sellerId: req.query.sellerId,
      page: req.query.page,
      limit: req.query.limit
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await propertyMarketplaceService.getActiveListings(filters);

    // ✅ FASE 18.7: Retornar com paginação
    res.json({
      success: true,
      listings: result.listings || result,
      pagination: result.pagination,
      count: result.listings ? result.listings.length : (Array.isArray(result) ? result.length : 0)
    });
  } catch (error) {
    logger.error('Erro ao buscar listagens:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancelar listagem
 */
export const cancelListing = async (req, res) => {
  try {
    const sellerId = req.user?.id || req.headers['user-id'] || req.body.sellerId || 'test-user-id';
    const { listingId } = req.params;

    const result = await propertyMarketplaceService.cancelListing(listingId, sellerId);

    res.json(result);
  } catch (error) {
    logger.error('Erro ao cancelar listagem:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Comprar imóvel
 */
export const purchaseProperty = async (req, res) => {
  try {
    const buyerId = req.user?.id || req.headers['user-id'] || req.body.buyerId || 'test-user-id';
    const { listingId } = req.params;

    const result = await propertyMarketplaceService.purchaseProperty(listingId, buyerId);

    res.json(result);
  } catch (error) {
    logger.error('Erro ao comprar imóvel:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Obter histórico de transações
 */
export const getTransactionHistory = async (req, res) => {
  try {
    const filters = {
      buildingId: req.query.buildingId,
      cityId: req.query.cityId,
      buyerId: req.query.buyerId,
      sellerId: req.query.sellerId,
      limit: parseInt(req.query.limit) || 50
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const transactions = await propertyMarketplaceService.getTransactionHistory(filters);

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    logger.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obter estatísticas de valorização por cidade
 */
export const getCityPriceStats = async (req, res) => {
  try {
    const { cityId } = req.params;
    const days = parseInt(req.query.days) || 30;

    if (!cityId) {
      return res.status(400).json({ error: 'cityId é obrigatório' });
    }

    const stats = await propertyMarketplaceService.getCityPriceStats(cityId, days);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

