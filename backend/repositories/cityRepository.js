import { BaseRepository } from './baseRepository.js';

export class CityRepository extends BaseRepository {
  constructor() {
    super('cities');
  }

  formatToSupabase(city) {
    const data = {};
    if (city.cityId !== undefined) data.city_id = city.cityId;
    if (city.city_id !== undefined) data.city_id = city.city_id;
    if (city.name !== undefined) data.name = city.name;
    if (city.stateId !== undefined) data.state_id = city.stateId;
    if (city.state_id !== undefined) data.state_id = city.state_id;
    if (city.stateName !== undefined) data.state_name = city.stateName;
    if (city.state_name !== undefined) data.state_name = city.state_name;
    if (city.countryId !== undefined) data.country_id = city.countryId;
    if (city.country_id !== undefined) data.country_id = city.country_id;
    if (city.countryName !== undefined) data.country_name = city.countryName;
    if (city.country_name !== undefined) data.country_name = city.country_name;
    if (city.geometry !== undefined) data.geometry = typeof city.geometry === 'string' ? JSON.parse(city.geometry) : city.geometry;
    if (city.landValue !== undefined) data.land_value = parseFloat(city.landValue);
    if (city.land_value !== undefined) data.land_value = parseFloat(city.land_value);
    if (city.population !== undefined) data.population = parseInt(city.population);
    if (city.population !== undefined && city.population === undefined) data.population = parseInt(city.population || 0);
    if (city.treasuryBalance !== undefined) data.treasury_balance = parseFloat(city.treasuryBalance);
    if (city.treasury_balance !== undefined) data.treasury_balance = parseFloat(city.treasury_balance);
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      cityId: record.city_id,
      stateId: record.state_id,
      stateName: record.state_name,
      countryId: record.country_id,
      countryName: record.country_name,
      geometry: typeof record.geometry === 'string' ? JSON.parse(record.geometry) : record.geometry,
      landValue: parseFloat(record.land_value || 1000),
      population: parseInt(record.population || 0),
      treasuryBalance: parseFloat(record.treasury_balance || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(city) {
    const data = this.formatToSupabase(city);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByCityId(cityId) {
    const record = await this.findOne({ city_id: cityId });
    if (!record) return null;
    return this.formatFromSupabase(record);
  }

  async findByStateId(stateId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('state_id', stateId);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async findByCountryId(countryId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('country_id', countryId);

    if (error) throw error;
    return this.formatRecords(records);
  }

  async update(id, city) {
    const data = this.formatToSupabase(city);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  async updateByCityId(cityId, city) {
    const existing = await this.findByCityId(cityId);
    if (!existing) {
      throw new Error(`City não encontrada para ${cityId}`);
    }
    return await this.update(existing.id, city);
  }

  /**
   * Atualizar land_value baseado no número de prédios (Lei da Oferta e Procura)
   */
  async updateLandValue(cityId, buildingCount) {
    const city = await this.findByCityId(cityId);
    if (!city) {
      throw new Error(`City não encontrada para ${cityId}`);
    }

    // Fórmula: land_value = base_value * (1 + (building_count / 100) * 0.1)
    // Cada 100 prédios aumenta o land_value em 10%
    const baseValue = 1000; // Valor base mínimo
    const newLandValue = baseValue * (1 + (buildingCount / 100) * 0.1);
    
    return await this.update(city.id, { landValue: newLandValue });
  }
}

export default new CityRepository();

