import { BaseRepository } from './baseRepository.js';

export class CountryOwnershipRepository extends BaseRepository {
  constructor() {
    super('country_ownership');
  }

  formatToSupabase(ownership) {
    const data = {};
    if (ownership.countryId !== undefined) data.country_id = ownership.countryId;
    if (ownership.country_id !== undefined) data.country_id = ownership.country_id;
    if (ownership.countryName !== undefined) data.country_name = ownership.countryName;
    if (ownership.country_name !== undefined) data.country_name = ownership.country_name;
    if (ownership.totalShares !== undefined) data.total_shares = parseInt(ownership.totalShares);
    if (ownership.total_shares !== undefined) data.total_shares = parseInt(ownership.total_shares);
    if (ownership.availableShares !== undefined) data.available_shares = parseInt(ownership.availableShares);
    if (ownership.available_shares !== undefined) data.available_shares = parseInt(ownership.available_shares);
    if (ownership.currentSharePrice !== undefined) data.current_share_price = parseFloat(ownership.currentSharePrice);
    if (ownership.current_share_price !== undefined) data.current_share_price = parseFloat(ownership.current_share_price);
    if (ownership.totalInvested !== undefined) data.total_invested = parseFloat(ownership.totalInvested);
    if (ownership.total_invested !== undefined) data.total_invested = parseFloat(ownership.total_invested);
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      countryId: record.country_id,
      countryName: record.country_name,
      totalShares: parseInt(record.total_shares || 100),
      availableShares: parseInt(record.available_shares || 100),
      currentSharePrice: parseFloat(record.current_share_price || 1000),
      totalInvested: parseFloat(record.total_invested || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(ownership) {
    const data = this.formatToSupabase(ownership);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByCountryId(countryId) {
    const record = await this.findOne({ country_id: countryId });
    if (!record) return null;
    return this.formatFromSupabase(record);
  }

  async update(id, ownership) {
    const data = this.formatToSupabase(ownership);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  async updateByCountryId(countryId, ownership) {
    const existing = await this.findByCountryId(countryId);
    if (!existing) {
      throw new Error(`Country ownership não encontrado para ${countryId}`);
    }
    return await this.update(existing.id, ownership);
  }

  /**
   * Obter shareholders de um país
   */
  async getShareholders(countryId) {
    const supabase = this.getClient();
    const ownership = await this.findByCountryId(countryId);
    
    if (!ownership) {
      return [];
    }

    const { data: shareholders, error } = await supabase
      .from('shareholders')
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .eq('country_ownership_id', ownership.id)
      .order('shares', { ascending: false });

    if (error) {
      console.error('Erro ao buscar shareholders:', error);
      return [];
    }

    return shareholders.map(sh => ({
      id: sh.id,
      userId: sh.user_id,
      user: sh.users,
      shares: parseFloat(sh.shares),
      purchasePrice: parseFloat(sh.purchase_price),
      purchasedAt: sh.purchased_at
    }));
  }

  /**
   * Adicionar ou atualizar shareholder
   */
  async upsertShareholder(countryId, userId, shares, purchasePrice) {
    const supabase = this.getClient();
    const ownership = await this.findByCountryId(countryId);
    
    if (!ownership) {
      throw new Error(`Country ownership não encontrado para ${countryId}`);
    }

    // Garantir que o usuário existe (cria se não existir)
    const { ensureTestUserExists } = await import('../utils/userUtils.js');
    const userUuid = await ensureTestUserExists(userId);

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('shareholders')
      .select('*')
      .eq('country_ownership_id', ownership.id)
      .eq('user_id', userUuid)
      .maybeSingle();

    if (existing) {
      // Atualizar shares existentes
      const newShares = parseFloat(existing.shares) + parseFloat(shares);
      const totalCost = (parseFloat(existing.shares) * parseFloat(existing.purchase_price)) + 
                       (parseFloat(shares) * parseFloat(purchasePrice));
      const newPurchasePrice = totalCost / newShares;

      const { data, error } = await supabase
        .from('shareholders')
        .update({
          shares: newShares,
          purchase_price: newPurchasePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.formatFromSupabase(data);
    } else {
      // Criar novo shareholder
      const { data, error } = await supabase
        .from('shareholders')
        .insert({
          country_ownership_id: ownership.id,
          user_id: userUuid,
          shares: parseFloat(shares),
          purchase_price: parseFloat(purchasePrice),
          purchased_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar shareholder:', error);
        throw new Error(`Erro ao criar shareholder: ${error.message}`);
      }
      return data;
    }
  }

  /**
   * Calcular shares vendidas
   */
  async getSoldShares(countryId) {
    const supabase = this.getClient();
    const ownership = await this.findByCountryId(countryId);
    
    if (!ownership) {
      return 0;
    }

    const { data, error } = await supabase
      .from('shareholders')
      .select('shares')
      .eq('country_ownership_id', ownership.id);

    if (error) {
      console.error('Erro ao calcular shares vendidas:', error);
      return 0;
    }

    return data.reduce((sum, sh) => sum + parseFloat(sh.shares || 0), 0);
  }

  /**
   * Atualizar preço e disponibilidade de shares
   */
  async updateSharePriceAndAvailability(countryId, newPrice, totalInvested) {
    const ownership = await this.findByCountryId(countryId);
    if (!ownership) {
      throw new Error(`Country ownership não encontrado para ${countryId}`);
    }

    const soldShares = await this.getSoldShares(countryId);
    const availableShares = ownership.totalShares - soldShares;

    return await this.update(ownership.id, {
      currentSharePrice: newPrice,
      totalInvested: totalInvested,
      availableShares: availableShares
    });
  }
}

export default new CountryOwnershipRepository();

