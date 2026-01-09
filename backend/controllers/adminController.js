import * as walletService from '../services/walletService.js';
import Wallet from '../models/Wallet.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AdminController');

/**
 * Define o saldo de um usuário (Modo Deus)
 * POST /api/admin/wallet/set-balance
 */
export const setWalletBalance = async (req, res) => {
  try {
    const { userId, balance, reason } = req.body;

    // Validação
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'balance deve ser um número positivo' });
    }

    // Obter ou criar carteira
    const wallet = await walletService.getOrCreateWallet(userId);

    const oldBalance = wallet.balance;
    wallet.balance = balance;
    
    // Ajustar totalEarned/totalSpent baseado na diferença
    const difference = balance - oldBalance;
    if (difference > 0) {
      wallet.totalEarned += difference;
    } else {
      wallet.totalSpent += Math.abs(difference);
    }

    await wallet.save();

    logger.info(`🔧 [MODO DEUS] Saldo definido para usuário ${userId}: ${oldBalance} → ${balance} VAL`);
    if (reason) {
      logger.info(`   Motivo: ${reason}`);
    }

    // Registrar transação
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.create({
      userId,
      type: 'admin_adjustment',
      amount: difference,
      balanceBefore: oldBalance,
      balanceAfter: balance,
      description: reason || `Ajuste administrativo (Modo Deus)`,
      metadata: { 
        admin: req.user.id,
        reason: reason || 'Modo Deus - Ajuste de saldo',
        mode: 'set_balance'
      }
    });

    // Emitir atualização via Socket.io
    const { emitBalanceUpdate } = await import('../socket/socketHandler.js');
    emitBalanceUpdate(userId, wallet.balance);

    res.json({
      success: true,
      message: `Saldo definido com sucesso: ${balance.toLocaleString('pt-BR')} VAL`,
      wallet: {
        userId: wallet.userId,
        balance: wallet.balance,
        oldBalance,
        difference
      }
    });
  } catch (error) {
    logger.error('Erro ao definir saldo (Modo Deus):', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Adiciona saldo a um usuário (Modo Deus)
 * POST /api/admin/wallet/add-balance
 */
export const addWalletBalance = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    // Validação
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'amount deve ser um número' });
    }

    // Adicionar saldo usando o serviço
    await walletService.addBalance(
      userId,
      amount,
      reason || 'Ajuste administrativo (Modo Deus)',
      { 
        admin: req.user.id,
        reason: reason || 'Modo Deus - Adição de saldo',
        mode: 'add_balance'
      }
    );

    const wallet = await walletService.getOrCreateWallet(userId);

    logger.info(`🔧 [MODO DEUS] Adicionado ${amount} VAL ao usuário ${userId}. Novo saldo: ${wallet.balance} VAL`);

    res.json({
      success: true,
      message: `${amount > 0 ? 'Adicionado' : 'Subtraído'} ${Math.abs(amount).toLocaleString('pt-BR')} VAL com sucesso`,
      wallet: {
        userId: wallet.userId,
        balance: wallet.balance
      }
    });
  } catch (error) {
    logger.error('Erro ao adicionar saldo (Modo Deus):', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Lista todos os usuários com suas carteiras
 * GET /api/admin/users
 */
export const listUsers = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .sort({ balance: -1 })
      .limit(100)
      .lean();

    const users = wallets.map(wallet => ({
      userId: wallet.userId,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      updatedAt: wallet.updatedAt
    }));

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: error.message });
  }
};

