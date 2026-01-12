import { BaseRepository } from './baseRepository.js';

export class StateRepository extends BaseRepository {
  constructor() {
    super('states');
  }

  formatToSupabase(state) {
    const data = {};
    if (state.stateId !== undefined) data.state_id = state.stateId;
    if (state.state_id !== undefined) data.state_id = state.state_id;
    if (state.name !== undefined) data.name = state.name;
    if (state.code !== undefined) data.code = state.code;
    if (state.countryId !== undefined) data.country_id = state.countryId;
    if (state.country_id !== undefined) data.country_id = state.country_id;
    if (state.countryName !== undefined) data.country_name = state.countryName;
    if (state.country_name !== undefined) data.country_name = state.country_name;
    if (state.geometry !== undefined) data.geometry = typeof state.geometry === 'string' ? JSON.parse(state.geometry) : state.geometry;
    if (state.treasuryBalance !== undefined) data.treasury_balance = parseFloat(state.treasuryBalance);
    if (state.treasury_balance !== undefined) data.treasury_balance = parseFloat(state.treasury_balance);
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      stateId: record.state_id,
      countryId: record.country_id,
      countryName: record.country_name,
      geometry: typeof record.geometry === 'string' ? JSON.parse(record.geometry) : record.geometry,
      treasuryBalance: parseFloat(record.treasury_balance || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  async create(state) {
    const data = this.formatToSupabase(state);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByStateId(stateId) {
    const record = await this.findOne({ state_id: stateId });
    if (!record) return null;
    return this.formatFromSupabase(record);
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

  async update(id, state) {
    const data = this.formatToSupabase(state);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  async updateByStateId(stateId, state) {
    const existing = await this.findByStateId(stateId);
    if (!existing) {
      throw new Error(`State não encontrado para ${stateId}`);
    }
    return await this.update(existing.id, state);
  }
}

export default new StateRepository();

