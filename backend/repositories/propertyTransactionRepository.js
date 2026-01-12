import { BaseRepository } from './baseRepository.js';
import { ensureUUID } from '../utils/uuidUtils.js';

export class PropertyTransactionRepository extends BaseRepository {
  constructor() {
    super('property_transactions');
  }

  formatToSupabase(transaction) {
    const data = {};
    if (transaction.transactionId !== undefined) data.transaction_id = transaction.transactionId;
    if (transaction.transaction_id !== undefined) data.transaction_id = transaction.transaction_id;
    if (transaction.buildingId !== undefined) data.building_id = ensureUUID(transaction.buildingId);
    if (transaction.building_id !== undefined) data.building_id = ensureUUID(transaction.building_id);
    if (transaction.sellerId !== undefined) data.seller_id = ensureUUID(transaction.sellerId);
    if (transaction.seller_id !== undefined) data.seller_id = ensureUUID(transaction.seller_id);
    if (transaction.buyerId !== undefined) data.buyer_id = ensureUUID(transaction.buyerId);
    if (transaction.buyer_id !== undefined) data.buyer_id = ensureUUID(transaction.buyer_id);
    if (transaction.listingId !== undefined) data.listing_id = ensureUUID(transaction.listingId);
    if (transaction.listing_id !== undefined) data.listing_id = ensureUUID(transaction.listing_id);
    if (transaction.salePrice !== undefined) data.sale_price = parseFloat(transaction.salePrice);
    if (transaction.sale_price !== undefined) data.sale_price = parseFloat(transaction.sale_price);
    if (transaction.brokerFee !== undefined) data.broker_fee = parseFloat(transaction.brokerFee);
    if (transaction.broker_fee !== undefined) data.broker_fee = parseFloat(transaction.broker_fee);
    if (transaction.netAmount !== undefined) data.net_amount = parseFloat(transaction.netAmount);
    if (transaction.net_amount !== undefined) data.net_amount = parseFloat(transaction.net_amount);
    if (transaction.cityId !== undefined) data.city_id = ensureUUID(transaction.cityId);
    if (transaction.city_id !== undefined) data.city_id = ensureUUID(transaction.city_id);
    if (transaction.cityName !== undefined) data.city_name = transaction.cityName;
    if (transaction.city_name !== undefined) data.city_name = transaction.city_name;
    if (transaction.buildingType !== undefined) data.building_type = transaction.buildingType;
    if (transaction.building_type !== undefined) data.building_type = transaction.building_type;
    if (transaction.transactionDate !== undefined) data.transaction_date = transaction.transactionDate ? new Date(transaction.transactionDate).toISOString() : new Date().toISOString();
    if (transaction.transaction_date !== undefined) data.transaction_date = transaction.transaction_date ? new Date(transaction.transaction_date).toISOString() : new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      transactionId: record.transaction_id,
      buildingId: record.building_id,
      sellerId: record.seller_id,
      buyerId: record.buyer_id,
      listingId: record.listing_id,
      salePrice: parseFloat(record.sale_price || 0),
      brokerFee: parseFloat(record.broker_fee || 0),
      netAmount: parseFloat(record.net_amount || 0),
      cityId: record.city_id,
      cityName: record.city_name,
      buildingType: record.building_type,
      transactionDate: record.transaction_date,
      createdAt: record.created_at
    };
  }

  async create(transaction) {
    const data = this.formatToSupabase(transaction);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByTransactionId(transactionId) {
    const record = await this.findOne({ transaction_id: transactionId });
    return this.formatFromSupabase(record);
  }

  async findByBuildingId(buildingId, limit = 50) {
    const supabase = this.getClient();
    const buildingUUID = ensureUUID(buildingId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('building_id', buildingUUID)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findByCityId(cityId, limit = 100) {
    const supabase = this.getClient();
    const cityUUID = ensureUUID(cityId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('city_id', cityUUID)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findByBuyerId(buyerId, limit = 50) {
    const supabase = this.getClient();
    const buyerUUID = ensureUUID(buyerId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('buyer_id', buyerUUID)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findBySellerId(sellerId, limit = 50) {
    const supabase = this.getClient();
    const sellerUUID = ensureUUID(sellerId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerUUID)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.formatRecords(records);
  }

  /**
   * Calcular estatísticas de valorização por cidade
   */
  async getCityPriceStats(cityId, days = 30) {
    const supabase = this.getClient();
    const cityUUID = ensureUUID(cityId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('sale_price, transaction_date, building_type')
      .eq('city_id', cityUUID)
      .gte('transaction_date', cutoffDate.toISOString())
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    if (!records || records.length === 0) {
      return {
        cityId,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        transactionCount: 0,
        priceChange: 0,
        priceChangePercent: 0
      };
    }

    const prices = records.map(r => parseFloat(r.sale_price));
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Calcular mudança de preço (primeira vs última transação)
    const firstPrice = parseFloat(records[records.length - 1].sale_price);
    const lastPrice = parseFloat(records[0].sale_price);
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

    return {
      cityId,
      averagePrice: Math.round(averagePrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      transactionCount: records.length,
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      period: `${days} dias`
    };
  }
}

export default new PropertyTransactionRepository();

