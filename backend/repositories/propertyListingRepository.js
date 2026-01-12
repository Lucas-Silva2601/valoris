import { BaseRepository } from './baseRepository.js';
import { ensureUUID } from '../utils/uuidUtils.js';

export class PropertyListingRepository extends BaseRepository {
  constructor() {
    super('property_listings');
  }

  formatToSupabase(listing) {
    const data = {};
    if (listing.listingId !== undefined) data.listing_id = listing.listingId;
    if (listing.listing_id !== undefined) data.listing_id = listing.listing_id;
    if (listing.buildingId !== undefined) data.building_id = ensureUUID(listing.buildingId);
    if (listing.building_id !== undefined) data.building_id = ensureUUID(listing.building_id);
    if (listing.sellerId !== undefined) data.seller_id = ensureUUID(listing.sellerId);
    if (listing.seller_id !== undefined) data.seller_id = ensureUUID(listing.seller_id);
    if (listing.price !== undefined) data.price = parseFloat(listing.price);
    if (listing.status !== undefined) data.status = listing.status;
    if (listing.description !== undefined) data.description = listing.description;
    if (listing.expiresAt !== undefined) data.expires_at = listing.expiresAt ? new Date(listing.expiresAt).toISOString() : null;
    if (listing.expires_at !== undefined) data.expires_at = listing.expires_at ? new Date(listing.expires_at).toISOString() : null;
    if (listing.soldAt !== undefined) data.sold_at = listing.soldAt ? new Date(listing.soldAt).toISOString() : null;
    if (listing.sold_at !== undefined) data.sold_at = listing.sold_at ? new Date(listing.sold_at).toISOString() : null;
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      listingId: record.listing_id,
      buildingId: record.building_id,
      sellerId: record.seller_id,
      price: parseFloat(record.price || 0),
      status: record.status,
      description: record.description,
      expiresAt: record.expires_at,
      soldAt: record.sold_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(listing) {
    const data = this.formatToSupabase(listing);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByListingId(listingId) {
    const record = await this.findOne({ listing_id: listingId });
    return this.formatFromSupabase(record);
  }

  async findByBuildingId(buildingId) {
    const supabase = this.getClient();
    const buildingUUID = ensureUUID(buildingId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('building_id', buildingUUID)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findActiveByBuildingId(buildingId) {
    const supabase = this.getClient();
    const buildingUUID = ensureUUID(buildingId);
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('building_id', buildingUUID)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!records || records.length === 0) return null;
    return this.formatFromSupabase(records[0]);
  }

  async findActive(filters = {}) {
    const supabase = this.getClient();
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        buildings:building_id (
          id,
          building_id,
          type,
          name,
          level,
          position_lat,
          position_lng,
          city_id,
          city_name,
          state_id,
          state_name,
          country_id,
          country_name
        ),
        sellers:seller_id (
          id,
          username,
          email
        )
      `)
      .eq('status', 'active');

    // Filtros opcionais
    if (filters.cityId) {
      query = query.eq('buildings.city_id', filters.cityId);
    }
    if (filters.buildingType) {
      query = query.eq('buildings.type', filters.buildingType);
    }
    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice));
    }
    if (filters.sellerId) {
      query = query.eq('seller_id', ensureUUID(filters.sellerId));
    }

    // ✅ FASE 18.7: Paginação
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 50, 100); // Máximo 100 por página
    const offset = (page - 1) * limit;

    query = query.order('created_at', { ascending: false });

    // Obter total de registros (sem paginação) para contagem
    // Nota: Para queries com joins, a contagem pode ser complexa, então vamos usar uma abordagem mais simples
    // Contar após aplicar filtros básicos (sem joins)
    let countQuery = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // Aplicar filtros simples na contagem (sem joins)
    if (filters.minPrice) {
      countQuery = countQuery.gte('price', parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      countQuery = countQuery.lte('price', parseFloat(filters.maxPrice));
    }
    if (filters.sellerId) {
      countQuery = countQuery.eq('seller_id', ensureUUID(filters.sellerId));
    }

    const { count } = await countQuery;
    
    // Aplicar paginação na query principal
    const paginatedQuery = query.range(offset, offset + limit - 1);
    const { data: records, error } = await paginatedQuery;
    if (error) throw error;

    // Formatar registros
    const formattedRecords = records.map(record => {
      const formatted = this.formatFromSupabase(record);
      if (record.buildings) {
        formatted.building = record.buildings;
      }
      if (record.sellers) {
        formatted.seller = record.sellers;
      }
      return formatted;
    });

    // ✅ FASE 18.7: Retornar com informações de paginação
    return {
      listings: formattedRecords,
      pagination: {
        page,
        limit,
        total: count || formattedRecords.length,
        totalPages: Math.ceil((count || formattedRecords.length) / limit)
      }
    };
  }

  async update(id, listing) {
    const data = this.formatToSupabase(listing);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  async updateStatus(listingId, status, soldAt = null) {
    const listing = await this.findByListingId(listingId);
    if (!listing) {
      throw new Error(`Listagem ${listingId} não encontrada`);
    }

    const updateData = { status };
    if (soldAt) {
      updateData.soldAt = soldAt;
    }

    return await this.update(listing.id, updateData);
  }

  async cancelListing(listingId) {
    return await this.updateStatus(listingId, 'cancelled');
  }

  async markAsSold(listingId) {
    return await this.updateStatus(listingId, 'sold', new Date().toISOString());
  }
}

export default new PropertyListingRepository();

