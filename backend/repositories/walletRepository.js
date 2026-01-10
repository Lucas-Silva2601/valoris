import { BaseRepository } from './baseRepository.js';

export class WalletRepository extends BaseRepository {
  constructor() {
    super('wallets');
  }

  formatToSupabase(wallet) {
    const data = {};
    if (wallet.userId !== undefined) data.user_id = wallet.userId;
    if (wallet.user_id !== undefined) data.user_id = wallet.user_id;
    if (wallet.balance !== undefined) data.balance = parseFloat(wallet.balance);
    if (wallet.totalEarned !== undefined) data.total_earned = parseFloat(wallet.totalEarned);
    if (wallet.total_earned !== undefined) data.total_earned = parseFloat(wallet.total_earned);
    if (wallet.totalSpent !== undefined) data.total_spent = parseFloat(wallet.totalSpent);
    if (wallet.total_spent !== undefined) data.total_spent = parseFloat(wallet.total_spent);
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      userId: record.user_id,
      totalEarned: parseFloat(record.total_earned || 0),
      totalSpent: parseFloat(record.total_spent || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(wallet) {
    const data = this.formatToSupabase(wallet);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByUserId(userId) {
    const record = await this.findOne({ user_id: userId });
    if (!record) return null;
    return this.formatFromSupabase(record);
  }

  async update(id, wallet) {
    const data = this.formatToSupabase(wallet);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  /**
   * Atualizar saldo da carteira
   */
  async updateBalance(userId, amount) {
    const wallet = await this.findByUserId(userId);
    if (!wallet) {
      throw new Error('Carteira não encontrada');
    }

    const newBalance = parseFloat(wallet.balance || 0) + parseFloat(amount);
    if (newBalance < 0) {
      throw new Error('Saldo insuficiente');
    }

    const updateData = {
      balance: newBalance,
      updated_at: new Date().toISOString()
    };

    if (amount > 0) {
      updateData.total_earned = parseFloat(wallet.total_earned || wallet.totalEarned || 0) + parseFloat(amount);
    } else {
      updateData.total_spent = parseFloat(wallet.total_spent || wallet.totalSpent || 0) + Math.abs(parseFloat(amount));
    }

    return await this.update(wallet.id, updateData);
  }

  /**
   * Criar ou obter carteira para usuário
   */
  async findOrCreate(userId, initialBalance = 100000) {
    let wallet = await this.findByUserId(userId);
    
    if (!wallet) {
      const initialBalanceValue = parseFloat(initialBalance || process.env.INITIAL_BALANCE || 100000);
      wallet = await this.create({
        userId: userId,
        balance: initialBalanceValue,
        totalEarned: initialBalanceValue,
        totalSpent: 0
      });
    }
    
    return this.formatFromSupabase(wallet);
  }
}

export default new WalletRepository();

