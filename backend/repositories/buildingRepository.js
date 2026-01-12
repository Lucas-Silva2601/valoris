import { BaseRepository } from './baseRepository.js';
import { ensureUUID } from '../utils/uuidUtils.js';

export class BuildingRepository extends BaseRepository {
  constructor() {
    super('buildings');
  }

  /**
   * Converter formato do Mongoose para formato do Supabase
   */
  formatToSupabase(building) {
    const data = {};
    
    if (building.buildingId !== undefined) data.building_id = building.buildingId;
    if (building.building_id !== undefined) data.building_id = building.building_id;
    
    // ✅ Converter ownerId para UUID válido (necessário para Supabase)
    if (building.ownerId !== undefined) {
      try {
        data.owner_id = ensureUUID(building.ownerId);
      } catch (error) {
        console.error('Erro ao converter ownerId para UUID:', error);
        // Se falhar, tentar usar diretamente (pode falhar no banco)
        data.owner_id = building.ownerId;
      }
    }
    if (building.owner_id !== undefined && !data.owner_id) {
      try {
        data.owner_id = ensureUUID(building.owner_id);
      } catch (error) {
        console.error('Erro ao converter owner_id para UUID:', error);
        data.owner_id = building.owner_id;
      }
    }
    if (building.countryId !== undefined) data.country_id = building.countryId;
    if (building.country_id !== undefined) data.country_id = building.country_id;
    if (building.countryName !== undefined) data.country_name = building.countryName;
    if (building.country_name !== undefined) data.country_name = building.country_name;
    // ✅ FASE 18: Campos hierárquicos
    if (building.stateId !== undefined) data.state_id = building.stateId;
    if (building.state_id !== undefined) data.state_id = building.state_id;
    if (building.stateName !== undefined) data.state_name = building.stateName;
    if (building.state_name !== undefined) data.state_name = building.state_name;
    if (building.cityId !== undefined) data.city_id = building.cityId;
    if (building.city_id !== undefined) data.city_id = building.city_id;
    if (building.cityName !== undefined) data.city_name = building.cityName;
    if (building.city_name !== undefined) data.city_name = building.city_name;
    if (building.lotId !== undefined) data.lot_id = building.lotId;
    if (building.lot_id !== undefined) data.lot_id = building.lot_id;
    if (building.type !== undefined) data.type = building.type;
    if (building.name !== undefined) data.name = building.name;
    
    // Posição
    if (building.position !== undefined) {
      data.position_lat = building.position.lat;
      data.position_lng = building.position.lng;
    } else {
      if (building.position_lat !== undefined) data.position_lat = building.position_lat;
      if (building.position_lng !== undefined) data.position_lng = building.position_lng;
    }
    
    if (building.level !== undefined) data.level = building.level;
    if (building.cost !== undefined) data.cost = building.cost;
    if (building.capacity !== undefined) data.capacity = building.capacity;
    if (building.revenuePerHour !== undefined) data.revenue_per_hour = building.revenuePerHour;
    if (building.revenue_per_hour !== undefined) data.revenue_per_hour = building.revenue_per_hour;
    // ✅ FASE 18: Campo yield_rate (taxa de retorno)
    if (building.yieldRate !== undefined) data.yield_rate = parseFloat(building.yieldRate);
    if (building.yield_rate !== undefined) data.yield_rate = parseFloat(building.yield_rate);
    if (building.condition !== undefined) data.condition = building.condition;
    
    return data;
  }

  /**
   * Converter formato do Supabase para formato do Mongoose
   */
  formatFromSupabase(record) {
    if (!record) return null;
    
    // ✅ Garantir que position seja válida
    const position = {
      lat: record.position_lat,
      lng: record.position_lng
    };
    
    // ✅ Validar se position é válida
    if (position.lat == null || position.lng == null || 
        isNaN(position.lat) || isNaN(position.lng)) {
      console.warn(`⚠️ Edifício ${record.building_id || record.id} sem posição válida`);
      // Não retornar null, mas marcar como inválido para filtrar depois
      position.lat = NaN;
      position.lng = NaN;
    }
    
    return {
      ...record,
      _id: record.id,
      id: record.id,
      buildingId: record.building_id,
      building_id: record.building_id, // ✅ Manter ambos os formatos
      ownerId: record.owner_id,
      owner_id: record.owner_id, // ✅ Manter ambos os formatos
      countryId: record.country_id,
      country_id: record.country_id, // ✅ Manter ambos os formatos
      countryName: record.country_name,
      country_name: record.country_name, // ✅ Manter ambos os formatos
      // ✅ FASE 18: Campos hierárquicos
      stateId: record.state_id,
      state_id: record.state_id,
      stateName: record.state_name,
      state_name: record.state_name,
      cityId: record.city_id,
      city_id: record.city_id,
      cityName: record.city_name,
      city_name: record.city_name,
      lotId: record.lot_id,
      lot_id: record.lot_id,
      type: record.type,
      name: record.name || `${record.type || 'Edifício'} Nível ${record.level || 1}`,
      level: record.level || 1,
      capacity: record.capacity || 10,
      cost: record.cost || 0,
      revenuePerHour: record.revenue_per_hour || 0,
      revenue_per_hour: record.revenue_per_hour || 0, // ✅ Manter ambos os formatos
      yieldRate: parseFloat(record.yield_rate || 0), // ✅ FASE 18: Taxa de retorno
      yield_rate: parseFloat(record.yield_rate || 0),
      condition: record.condition || 100,
      position: position,
      position_lat: record.position_lat, // ✅ Manter ambos os formatos
      position_lng: record.position_lng, // ✅ Manter ambos os formatos
      createdAt: record.created_at,
      created_at: record.created_at, // ✅ Manter ambos os formatos
      updatedAt: record.updated_at,
      updated_at: record.updated_at // ✅ Manter ambos os formatos
    };
  }

  /**
   * Criar edifício
   */
  async create(building) {
    const data = this.formatToSupabase(building);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  /**
   * Buscar por building_id
   */
  async findByBuildingId(buildingId) {
    const record = await this.findOne({ building_id: buildingId });
    return this.formatFromSupabase(record);
  }

  /**
   * Buscar por country_id
   */
  async findByCountryId(countryId) {
    const records = await this.find({ country_id: countryId });
    return records.map(record => this.formatFromSupabase(record));
  }

  /**
   * ✅ FASE 18: Buscar por state_id
   */
  async findByStateId(stateId) {
    const records = await this.find({ state_id: stateId });
    return records.map(record => this.formatFromSupabase(record));
  }

  /**
   * ✅ FASE 18: Buscar por city_id
   */
  async findByCityId(cityId) {
    const records = await this.find({ city_id: cityId });
    return records.map(record => this.formatFromSupabase(record));
  }

  /**
   * Buscar por owner_id
   * ✅ Converter userId para UUID válido antes de buscar e tentar ambos os formatos
   */
  async findByOwnerId(ownerId) {
    try {
      // ✅ Converter userId para UUID válido (necessário para Supabase)
      const ownerUUID = ensureUUID(ownerId);
      
      // ✅ Buscar edifícios por owner_id (UUID)
      // Tentar primeiro com UUID convertido
      let records = await this.find({ owner_id: ownerUUID });
      
      // ✅ Se não encontrou nenhum, tentar também com o ownerId original (pode estar salvo como string)
      if (!records || records.length === 0) {
        try {
          const altRecords = await this.find({ owner_id: ownerId });
          if (altRecords && altRecords.length > 0) {
            records = altRecords;
            console.log(`✅ Encontrados ${records.length} edifícios usando ownerId original`);
          }
        } catch (altError) {
          // Ignorar erro, usar resultados do UUID
        }
      }
      
      // ✅ Formatar edifícios e garantir que têm posição válida
      const buildings = (records || []).map(record => {
        const formatted = this.formatFromSupabase(record);
        
        // ✅ Garantir que position está no formato correto
        if (!formatted.position && formatted.position_lat != null && formatted.position_lng != null) {
          formatted.position = {
            lat: formatted.position_lat,
            lng: formatted.position_lng
          };
        }
        
        return formatted;
      });
      
      // ✅ Filtrar edifícios sem posição válida
      const validBuildings = buildings.filter(building => {
        if (!building) return false;
        
        const position = building.position || { 
          lat: building.position_lat, 
          lng: building.position_lng 
        };
        
        if (!position || position.lat == null || position.lng == null ||
            isNaN(position.lat) || isNaN(position.lng) ||
            position.lat < -90 || position.lat > 90 ||
            position.lng < -180 || position.lng > 180) {
          console.warn(`⚠️ Edifício ${building.buildingId || building.building_id} sem posição válida:`, position);
          return false;
        }
        
        return true;
      });
      
      console.log(`✅ ${validBuildings.length} edifícios válidos encontrados para ownerId ${ownerId} (UUID: ${ownerUUID})`);
      
      return validBuildings;
    } catch (error) {
      console.error(`Erro ao buscar edifícios por owner_id (${ownerId}):`, error);
      return [];
    }
  }

  /**
   * Atualizar edifício
   */
  async update(id, building) {
    const data = this.formatToSupabase(building);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  /**
   * Buscar edifícios próximos a uma posição
   */
  async findNearby(lng, lat, maxDistanceKm = 5, countryId = null) {
    try {
      // Query básica
      let query = this.supabase.from(this.tableName).select('*');
      
      // Filtrar por país se fornecido
      if (countryId) {
        query = query.eq('country_id', countryId);
      }
      
      // Buscar edifícios e filtrar por distância no código
      // (PostGIS não está disponível, então fazemos cálculo aproximado)
      const { data: records, error } = await query;
      
      if (error) throw error;
      
      // Converter maxDistanceKm para metros
      const maxDistanceM = maxDistanceKm * 1000;
      
      // Filtrar por distância usando fórmula de Haversine
      const nearby = (records || []).filter(record => {
        if (!record.position_lat || !record.position_lng) return false;
        
        const R = 6371000; // Raio da Terra em metros
        const dLat = (record.position_lat - lat) * Math.PI / 180;
        const dLng = (record.position_lng - lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(record.position_lat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceM = R * c;
        
        return distanceM <= maxDistanceM;
      });
      
      return nearby.map(record => this.formatFromSupabase(record));
    } catch (error) {
      console.error(`Erro ao buscar edifícios próximos:`, error);
      return [];
    }
  }

  /**
   * Buscar edifício por building_id
   */
  async findByBuildingId(buildingId) {
    const record = await this.findOne({ building_id: buildingId });
    return this.formatFromSupabase(record);
  }
}

export default new BuildingRepository();

