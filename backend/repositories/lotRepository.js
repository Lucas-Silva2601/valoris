import { BaseRepository } from './baseRepository.js';

export class LotRepository extends BaseRepository {
  constructor() {
    super('lots');
  }

  formatToSupabase(lot) {
    const data = {};
    if (lot.lotId !== undefined) data.lot_id = lot.lotId;
    if (lot.lot_id !== undefined) data.lot_id = lot.lot_id;
    if (lot.cityId !== undefined) data.city_id = lot.cityId;
    if (lot.city_id !== undefined) data.city_id = lot.city_id;
    if (lot.positionLat !== undefined) data.position_lat = parseFloat(lot.positionLat);
    if (lot.position_lat !== undefined) data.position_lat = parseFloat(lot.position_lat);
    if (lot.positionLng !== undefined) data.position_lng = parseFloat(lot.positionLng);
    if (lot.position_lng !== undefined) data.position_lng = parseFloat(lot.position_lng);
    if (lot.gridX !== undefined) data.grid_x = parseInt(lot.gridX);
    if (lot.grid_x !== undefined) data.grid_x = parseInt(lot.grid_x);
    if (lot.gridY !== undefined) data.grid_y = parseInt(lot.gridY);
    if (lot.grid_y !== undefined) data.grid_y = parseInt(lot.grid_y);
    if (lot.isOccupied !== undefined) data.is_occupied = Boolean(lot.isOccupied);
    if (lot.is_occupied !== undefined) data.is_occupied = Boolean(lot.is_occupied);
    if (lot.buildingId !== undefined) data.building_id = lot.buildingId;
    if (lot.building_id !== undefined) data.building_id = lot.building_id;
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      lotId: record.lot_id,
      cityId: record.city_id,
      positionLat: parseFloat(record.position_lat),
      positionLng: parseFloat(record.position_lng),
      gridX: parseInt(record.grid_x),
      gridY: parseInt(record.grid_y),
      isOccupied: Boolean(record.is_occupied),
      buildingId: record.building_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(lot) {
    const data = this.formatToSupabase(lot);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByLotId(lotId) {
    const record = await this.findOne({ lot_id: lotId });
    if (!record) return null;
    return this.formatFromSupabase(record);
  }

  async findByCityId(cityId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('city_id', cityId);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findAvailableLotByCityId(cityId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('city_id', cityId)
      .eq('is_occupied', false)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Nenhum registro encontrado
      throw error;
    }
    return this.formatFromSupabase(records);
  }

  async findByGridPosition(cityId, gridX, gridY) {
    const supabase = this.getClient();
    const { data: record, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('city_id', cityId)
      .eq('grid_x', gridX)
      .eq('grid_y', gridY)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.formatFromSupabase(record);
  }

  async occupyLot(lotId, buildingId) {
    const lot = await this.findByLotId(lotId);
    if (!lot) {
      throw new Error(`Lote não encontrado para ${lotId}`);
    }
    if (lot.isOccupied) {
      throw new Error(`Lote ${lotId} já está ocupado`);
    }
    
    return await this.update(lot.id, { 
      isOccupied: true, 
      buildingId: buildingId 
    });
  }

  async freeLot(lotId) {
    const lot = await this.findByLotId(lotId);
    if (!lot) {
      throw new Error(`Lote não encontrado para ${lotId}`);
    }
    
    return await this.update(lot.id, { 
      isOccupied: false, 
      buildingId: null 
    });
  }

  async update(id, lot) {
    const data = this.formatToSupabase(lot);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }
}

export default new LotRepository();

