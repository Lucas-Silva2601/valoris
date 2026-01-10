import walletRepository from '../repositories/walletRepository.js';
import transactionRepository from '../repositories/transactionRepository.js';
import { checkConnection } from '../config/supabase.js';
import { emitBalanceUpdate } from '../socket/socketHandler.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('WalletService');

/**
 * ✅ Criar ou obter carteira do usuário
 * Retorna saldo fictício de 100.000 VAL se banco não estiver disponível
 */
export const getOrCreateWallet = async (userId) => {
  try {
    if (!checkConnection()) {
      logger.warn('⚠️  Supabase não está conectado. Usando saldo fictício de 100.000 VAL.');
      return {
        user_id: String(userId),
        userId: String(userId),
        balance: 100000,
        total_earned: 100000,
        totalEarned: 100000,
        total_spent: 0,
        totalSpent: 0,
        _isOffline: true
      };
    }

    const userIdStr = String(userId);
    let wallet = await walletRepository.findOrCreate(userIdStr);
    
    // Garantir saldo mínimo de 100.000 VAL
    const balance = parseFloat(wallet.balance || 0);
    if (balance === 0 || balance < 1000) {
      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || 100000);
      const amountToAdd = initialBalance - balance;
      
      wallet = await walletRepository.update(wallet.id, {
        balance: initialBalance,
        total_earned: parseFloat(wallet.total_earned || 0) + amountToAdd
      });
    }
    
    // Converter para formato esperado pelo código existente
    return {
      ...wallet,
      userId: wallet.user_id || wallet.userId,
      balance: parseFloat(wallet.balance || 0),
      totalEarned: parseFloat(wallet.total_earned || wallet.totalEarned || 0),
      totalSpent: parseFloat(wallet.total_spent || wallet.totalSpent || 0)
    };
  } catch (error) {
    logger.error('⚠️  Erro ao criar/obter carteira (modo offline):', error.message || error);
    logger.warn('💰 Usando saldo fictício de 100.000 VAL para teste.');
    
    return {
      user_id: String(userId),
      userId: String(userId),
      balance: 100000,
      total_earned: 100000,
      totalEarned: 100000,
      total_spent: 0,
      totalSpent: 0,
      _isOffline: true
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
  if (!checkConnection()) {
    logger.warn('Supabase não conectado. Operação não será persistida.');
    return await getOrCreateWallet(userId);
  }

  const wallet = await getOrCreateWallet(userId);
  const balanceBefore = parseFloat(wallet.balance || 0);
  const newBalance = balanceBefore + parseFloat(amount);
  
  // Atualizar carteira
  const updatedWallet = await walletRepository.updateBalance(userId, amount);
  
  // Registrar transação
  try {
    await transactionRepository.create({
      wallet_id: updatedWallet.id,
      user_id: userId,
      type: 'dividend',
      amount: parseFloat(amount),
      description,
      metadata: {
        ...metadata,
        balanceBefore,
        balanceAfter: newBalance
      }
    });
  } catch (error) {
    logger.warn('Erro ao registrar transação:', error);
  }
  
  // Emitir atualização via Socket.io
  emitBalanceUpdate(userId, newBalance);
  
  return {
    ...updatedWallet,
    balance: newBalance,
    totalEarned: parseFloat(updatedWallet.total_earned || 0)
  };
};

/**
 * Subtrair saldo da carteira
 */
export const subtractBalance = async (userId, amount, description, metadata = {}) => {
  if (!checkConnection()) {
    logger.warn('Supabase não conectado. Operação não será persistida.');
    throw new Error('Banco de dados não disponível');
  }

  const wallet = await getOrCreateWallet(userId);
  const balance = parseFloat(wallet.balance || 0);
  const amountToSubtract = parseFloat(amount);
  
  if (balance < amountToSubtract) {
    throw new Error('Saldo insuficiente');
  }
  
  const balanceBefore = balance;
  const newBalance = balance - amountToSubtract;
  
  // Atualizar carteira
  const updatedWallet = await walletRepository.updateBalance(userId, -amountToSubtract);
  
  // Registrar transação
  try {
    await transactionRepository.create({
      wallet_id: updatedWallet.id,
      user_id: userId,
      type: 'purchase',
      amount: -amountToSubtract,
      description,
      metadata: {
        ...metadata,
        balanceBefore,
        balanceAfter: newBalance
      }
    });
  } catch (error) {
    logger.warn('Erro ao registrar transação:', error);
  }
  
  // Emitir atualização via Socket.io
  emitBalanceUpdate(userId, newBalance);
  
  return {
    ...updatedWallet,
    balance: newBalance,
    totalSpent: parseFloat(updatedWallet.total_spent || 0)
  };
};

/**
 * Obter histórico de transações
 */
export const getTransactionHistory = async (userId, limit = 50, skip = 0) => {
  if (!checkConnection()) {
    return [];
  }

  try {
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      return [];
    }

    const transactions = await transactionRepository.findByWalletId(wallet.id, {
      orderBy: { column: 'created_at', ascending: false },
      limit: limit + skip
    });

    // Aplicar skip manualmente (Supabase não tem skip direto)
    return transactions.slice(skip, skip + limit);
  } catch (error) {
    logger.error('Erro ao obter histórico de transações:', error);
    return [];
  }
};

