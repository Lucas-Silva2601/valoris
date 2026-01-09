import * as walletService from '../services/walletService.js';
import { getOrCreateWallet } from '../services/walletService.js';

export const getBalance = async (req, res) => {
  try {
    // FASE DE TESTE: Permitir userId de teste
    const userId = req.user?.id || req.headers['user-id'] || 'test-user-id';
    const wallet = await getOrCreateWallet(userId);
    
    res.json({
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addInitialBalance = async (req, res) => {
  try {
    // FASE DE TESTE: Permitir userId de teste
    const userId = req.user?.id || req.headers['user-id'] || 'test-user-id';
    const wallet = await getOrCreateWallet(userId);
    
    // Sempre garantir saldo mínimo de 100.000 VAL para fase de teste
    const initialBalance = parseFloat(process.env.INITIAL_BALANCE || 100000);
    
    if (wallet.balance < initialBalance) {
      const amountToAdd = initialBalance - wallet.balance;
      
      await walletService.addBalance(
        userId,
        amountToAdd,
        'Saldo inicial garantido (fase de teste)',
        { type: 'initial_balance' }
      );
      
      const updatedWallet = await getOrCreateWallet(userId);
      res.json({
        success: true,
        balance: updatedWallet.balance,
        added: amountToAdd,
        message: `Saldo garantido! Você agora tem ${updatedWallet.balance.toLocaleString('pt-BR')} VAL`
      });
    } else {
      res.json({
        success: true,
        balance: wallet.balance,
        message: `Você já possui saldo suficiente: ${wallet.balance.toLocaleString('pt-BR')} VAL`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    // FASE DE TESTE: Permitir userId de teste
    const userId = req.user?.id || req.headers['user-id'] || 'test-user-id';
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    const transactions = await walletService.getTransactionHistory(userId, limit, skip);
    
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ FAUCET - Adicionar 100.000 VAL para testes
 * POST /api/wallet/faucet
 */
export const addFaucetBalance = async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'] || 'test-user-id';
    const faucetAmount = 100000; // 100.000 VAL
    
    const wallet = await getOrCreateWallet(userId);
    
    // Adicionar saldo
    await walletService.addBalance(
      userId,
      faucetAmount,
      'Faucet - Saldo de teste',
      { type: 'faucet', source: 'test' }
    );
    
    const updatedWallet = await getOrCreateWallet(userId);
    
    // Emitir atualização via Socket.io
    const { emitBalanceUpdate } = await import('../socket/socketHandler.js');
    emitBalanceUpdate(userId, updatedWallet.balance);
    
    res.json({
      success: true,
      balance: updatedWallet.balance,
      added: faucetAmount,
      message: `💰 ${faucetAmount.toLocaleString('pt-BR')} VAL adicionados! Novo saldo: ${updatedWallet.balance.toLocaleString('pt-BR')} VAL`
    });
  } catch (error) {
    console.error('Erro no faucet:', error);
    res.status(500).json({ error: error.message });
  }
};
