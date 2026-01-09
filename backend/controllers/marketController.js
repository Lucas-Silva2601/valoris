import * as marketService from '../services/marketService.js';

export const createSellOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { countryId, countryName, shares, pricePerShare } = req.body;

    if (!countryId || !countryName || !shares || !pricePerShare) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (shares <= 0 || shares > 100) {
      return res.status(400).json({ error: 'Quantidade de ações inválida' });
    }

    if (pricePerShare <= 0) {
      return res.status(400).json({ error: 'Preço por ação inválido' });
    }

    const order = await marketService.createSellOrder(
      userId,
      countryId,
      countryName,
      shares,
      pricePerShare
    );

    res.json({
      success: true,
      order,
      message: 'Ordem de venda criada com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const buyOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'ID da ordem necessário' });
    }

    const order = await marketService.buyMarketOrder(userId, orderId);

    res.json({
      success: true,
      order,
      message: 'Ordem comprada com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'ID da ordem necessário' });
    }

    const order = await marketService.cancelMarketOrder(userId, orderId);

    res.json({
      success: true,
      order,
      message: 'Ordem cancelada com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getActiveOrdersByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const orders = await marketService.getActiveOrdersByCountry(countryId);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllActiveOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const orders = await marketService.getAllActiveOrders(limit);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || 'active';
    const orders = await marketService.getSellerOrders(userId, status);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

