import { BaseRepository } from './baseRepository.js';

export class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  /**
   * Converter formato do Mongoose para formato do Supabase
   */
  formatToSupabase(transaction) {
    const data = {};
    
    if (transaction.walletId !== undefined) data.wallet_id = transaction.walletId;
    if (transaction.wallet_id !== undefined) data.wallet_id = transaction.wallet_id;
    if (transaction.userId !== undefined) data.user_id = transaction.userId; // Se houver userId direto
    if (transaction.type !== undefined) data.type = transaction.type;
    if (transaction.amount !== undefined) data.amount = transaction.amount;
    if (transaction.description !== undefined) data.description = transaction.description;
    if (transaction.metadata !== undefined) data.metadata = transaction.metadata || {};
    if (transaction.balanceBefore !== undefined) {
      if (!data.metadata) data.metadata = {};
      data.metadata.balanceBefore = transaction.balanceBefore;
    }
    if (transaction.balanceAfter !== undefined) {
      if (!data.metadata) data.metadata = {};
      data.metadata.balanceAfter = transaction.balanceAfter;
    }
    
    return data;
  }

  /**
   * Converter formato do Supabase para formato do Mongoose
   */
  formatFromSupabase(record) {
    if (!record) return null;
    
    return {
      ...record,
      _id: record.id,
      walletId: record.wallet_id,
      userId: record.user_id,
      balanceBefore: record.metadata?.balanceBefore,
      balanceAfter: record.metadata?.balanceAfter
    };
  }

  /**
   * Criar transação
   */
  async create(transaction) {
    const data = this.formatToSupabase(transaction);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  /**
   * Buscar transações de uma carteira
   */
  async findByWalletId(walletId, options = {}) {
    const records = await this.find({ wallet_id: walletId }, options);
    return records.map(record => this.formatFromSupabase(record));
  }

  /**
   * Buscar transações por tipo
   */
  async findByType(type, options = {}) {
    const records = await this.find({ type }, options);
    return records.map(record => this.formatFromSupabase(record));
  }
}

export default new TransactionRepository();

