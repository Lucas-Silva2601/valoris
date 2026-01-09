import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { emitBalanceUpdate } from '../socket/socketHandler.js';

/**
 * ✅ Criar ou obter carteira do usuário
 * Retorna saldo fictício de 100.000 VAL se banco não estiver disponível
 */
export const getOrCreateWallet = async (userId) => {
  try {
    // ✅ Verificar se MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  MongoDB não está conectado. Usando saldo fictício de 100.000 VAL.');
      // Retornar objeto de carteira fictícia para modo offline
      return {
        userId: String(userId),
        balance: 100000,
        totalEarned: 100000,
        totalSpent: 0,
        _isOffline: true // Flag para indicar que é saldo fictício
      };
    }

    // Converter userId para string para garantir compatibilidade
    const userIdStr = String(userId);
    
    let wallet = await Wallet.findOne({ userId: userIdStr });
    
    if (!wallet) {
      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || 100000);
      wallet = new Wallet({
        userId: userIdStr,
        balance: initialBalance,
        totalEarned: initialBalance,
        totalSpent: 0
      });
      await wallet.save();
    } else if (wallet.balance === 0 || wallet.balance < 1000) {
      // Se o saldo estiver muito baixo ou zerado, adicionar saldo inicial
      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || 100000);
      const amountToAdd = initialBalance - wallet.balance;
      wallet.balance = initialBalance;
      wallet.totalEarned += amountToAdd;
      await wallet.save();
    }
    
    return wallet;
  } catch (error) {
    // ✅ FALLBACK: Retornar saldo fictício em vez de quebrar
    console.error('⚠️  Erro ao criar/obter carteira (modo offline):', error.message || error);
    console.warn('💰 Usando saldo fictício de 100.000 VAL para teste.');
    
    // Retornar objeto de carteira fictícia
    return {
      userId: String(userId),
      balance: 100000,
      totalEarned: 100000,
      totalSpent: 0,
      _isOffline: true // Flag para indicar que é saldo fictício
    };
  }
};

/**
 * Obter saldo da carteira
 */
export const getWalletBalance = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
};

/**
 * Adicionar saldo à carteira
 */
export const addBalance = async (userId, amount, description, metadata = {}) => {
  const wallet = await getOrCreateWallet(userId);
  const balanceBefore = wallet.balance;
  
  wallet.balance += amount;
  wallet.totalEarned += amount;
  await wallet.save();
  
  // Registrar transação
  await Transaction.create({
    userId,
    type: 'dividend',
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    metadata
  });
  
  // Emitir atualização via Socket.io
  emitBalanceUpdate(userId, wallet.balance);
  
  return wallet;
};

/**
 * Subtrair saldo da carteira
 */
export const subtractBalance = async (userId, amount, description, metadata = {}) => {
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < amount) {
    throw new Error('Saldo insuficiente');
  }
  
  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  wallet.totalSpent += amount;
  await wallet.save();
  
  // Registrar transação
  await Transaction.create({
    userId,
    type: 'purchase',
    amount: -amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    metadata
  });
  
  // Emitir atualização via Socket.io
  emitBalanceUpdate(userId, wallet.balance);
  
  return wallet;
};

/**
 * Obter histórico de transações
 */
export const getTransactionHistory = async (userId, limit = 50, skip = 0) => {
  return await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedCountryOwnership');
};

