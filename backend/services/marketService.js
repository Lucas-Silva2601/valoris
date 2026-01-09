import MarketOrder from '../models/MarketOrder.js';
import CountryOwnership from '../models/CountryOwnership.js';
import Wallet from '../models/Wallet.js';
import { subtractBalance, addBalance } from './walletService.js';
import { emitMarketOrderUpdate } from '../socket/socketHandler.js';

/**
 * Criar ordem de venda no mercado P2P
 */
export const createSellOrder = async (userId, countryId, countryName, shares, pricePerShare) => {
  // Verificar se o usuário possui as ações
  const ownership = await CountryOwnership.findOne({ countryId });
  
  if (!ownership) {
    throw new Error('País não encontrado');
  }

  const shareholder = ownership.shareholders.find(
    sh => sh.userId.toString() === userId.toString()
  );

  if (!shareholder || shareholder.shares < shares) {
    throw new Error('Você não possui ações suficientes para vender');
  }

  // Verificar se já existe ordem ativa do mesmo vendedor para o mesmo país
  const existingOrder = await MarketOrder.findOne({
    sellerId: userId,
    countryId,
    status: 'active'
  });

  if (existingOrder) {
    throw new Error('Você já tem uma ordem ativa para este país. Cancele a anterior primeiro.');
  }

  // Criar ordem e colocar ações em Escrow
  const totalPrice = shares * pricePerShare;

  const order = new MarketOrder({
    sellerId: userId,
    countryId,
    countryName,
    shares,
    pricePerShare,
    totalPrice,
    status: 'active',
    escrowShares: shares // Ações retidas pelo sistema
  });

  await order.save();

  // Remover ações do acionista (elas ficam em Escrow)
  shareholder.shares -= shares;
  
  // Se o acionista não tem mais ações, remover da lista
  if (shareholder.shares <= 0) {
    ownership.shareholders = ownership.shareholders.filter(
      sh => sh.userId.toString() !== userId.toString()
    );
  }

  await ownership.save();

  // Emitir atualização via Socket.io
  emitMarketOrderUpdate(countryId, order);

  return order;
};

/**
 * Comprar ordem do mercado P2P
 */
export const buyMarketOrder = async (buyerId, orderId) => {
  const order = await MarketOrder.findOne({ _id: orderId, status: 'active' });

  if (!order) {
    throw new Error('Ordem não encontrada ou não está ativa');
  }

  if (order.sellerId.toString() === buyerId.toString()) {
    throw new Error('Você não pode comprar sua própria ordem');
  }

  // Verificar saldo do comprador
  const buyerWallet = await Wallet.findOne({ userId: buyerId });
  if (!buyerWallet || buyerWallet.balance < order.totalPrice) {
    throw new Error('Saldo insuficiente para comprar esta ordem');
  }

  // Subtrair saldo do comprador
  await subtractBalance(
    buyerId,
    order.totalPrice,
    `Compra de ${order.shares}% de ações de ${order.countryName} (Mercado P2P)`,
    { orderId: order._id.toString(), countryId: order.countryId }
  );

  // Adicionar saldo ao vendedor
  await addBalance(
    order.sellerId,
    order.totalPrice,
    `Venda de ${order.shares}% de ações de ${order.countryName} (Mercado P2P)`,
    { orderId: order._id.toString(), countryId: order.countryId }
  );

  // Transferir ações do Escrow para o comprador
  const ownership = await CountryOwnership.findOne({ countryId: order.countryId });
  
  if (!ownership) {
    throw new Error('Erro: País não encontrado durante transferência');
  }

  // Adicionar ações ao comprador
  const existingBuyerShareholder = ownership.shareholders.find(
    sh => sh.userId.toString() === buyerId.toString()
  );

  if (existingBuyerShareholder) {
    existingBuyerShareholder.shares += order.shares;
  } else {
    ownership.shareholders.push({
      userId: buyerId,
      shares: order.shares,
      purchasePrice: order.pricePerShare,
      purchasedAt: new Date()
    });
  }

  // Atualizar total investido
  ownership.totalInvested += order.totalPrice;
  
  // Recalcular preço das ações
  const { getMinimumSharePrice } = await import('../utils/businessRules.js');
  const sharesSold = ownership.shareholders.reduce((sum, sh) => sum + sh.shares, 0);
  ownership.currentSharePrice = getMinimumSharePrice(ownership.totalInvested, sharesSold);

  await ownership.save();

  // Marcar ordem como completa
  order.status = 'completed';
  order.buyerId = buyerId;
  order.completedAt = new Date();
  order.escrowShares = 0; // Escrow liberado
  await order.save();

  // Emitir atualização via Socket.io
  emitMarketOrderUpdate(order.countryId, order);

  return order;
};

/**
 * Cancelar ordem de venda
 */
export const cancelMarketOrder = async (userId, orderId) => {
  const order = await MarketOrder.findOne({ 
    _id: orderId, 
    sellerId: userId,
    status: 'active'
  });

  if (!order) {
    throw new Error('Ordem não encontrada ou não pode ser cancelada');
  }

  // Devolver ações do Escrow para o vendedor
  const ownership = await CountryOwnership.findOne({ countryId: order.countryId });
  
  if (!ownership) {
    throw new Error('Erro: País não encontrado durante cancelamento');
  }

  // Restaurar ações ao vendedor
  const existingSellerShareholder = ownership.shareholders.find(
    sh => sh.userId.toString() === userId.toString()
  );

  if (existingSellerShareholder) {
    existingSellerShareholder.shares += order.escrowShares;
  } else {
    ownership.shareholders.push({
      userId: userId,
      shares: order.escrowShares,
      purchasePrice: order.pricePerShare,
      purchasedAt: new Date()
    });
  }

  await ownership.save();

  // Marcar ordem como cancelada
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.escrowShares = 0;
  await order.save();

  // Emitir atualização via Socket.io
  emitMarketOrderUpdate(order.countryId, order);

  return order;
};

/**
 * Obter ordens ativas de um país
 */
export const getActiveOrdersByCountry = async (countryId) => {
  return await MarketOrder.find({
    countryId,
    status: 'active'
  })
    .populate('sellerId', 'username')
    .sort({ pricePerShare: 1, createdAt: 1 }); // Mais baratas primeiro
};

/**
 * Obter todas as ordens ativas (Order Book)
 */
export const getAllActiveOrders = async (limit = 100) => {
  return await MarketOrder.find({
    status: 'active'
  })
    .populate('sellerId', 'username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Obter ordens de um vendedor
 */
export const getSellerOrders = async (userId, status = 'active') => {
  return await MarketOrder.find({
    sellerId: userId,
    status
  })
    .populate('buyerId', 'username')
    .sort({ createdAt: -1 });
};

