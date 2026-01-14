import { BaseRepository } from './baseRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NPCRepository');

export class NPCRepository extends BaseRepository {
  constructor() {
    super('npcs');
  }

  formatToSupabase(npc) {
    const data = {};
    if (npc.npcId !== undefined) data.npc_id = npc.npcId;
    if (npc.npc_id !== undefined) data.npc_id = npc.npc_id;
    if (npc.name !== undefined) data.name = npc.name;
    if (npc.countryId !== undefined) data.country_id = npc.countryId;
    if (npc.country_id !== undefined) data.country_id = npc.country_id;
    if (npc.countryName !== undefined) data.country_name = npc.countryName;
    if (npc.country_name !== undefined) data.country_name = npc.country_name;
    // ✅ FASE 18.5: Campos hierárquicos
    if (npc.stateId !== undefined) data.state_id = npc.stateId;
    if (npc.state_id !== undefined) data.state_id = npc.state_id;
    if (npc.stateName !== undefined) data.state_name = npc.stateName;
    if (npc.state_name !== undefined) data.state_name = npc.state_name;
    if (npc.cityId !== undefined) data.city_id = npc.cityId;
    if (npc.city_id !== undefined) data.city_id = npc.city_id;
    if (npc.cityName !== undefined) data.city_name = npc.cityName;
    if (npc.city_name !== undefined) data.city_name = npc.city_name;
    if (npc.positionLat !== undefined) data.position_lat = parseFloat(npc.positionLat);
    if (npc.position_lat !== undefined) data.position_lat = parseFloat(npc.position_lat);
    if (npc.positionLng !== undefined) data.position_lng = parseFloat(npc.positionLng);
    if (npc.position_lng !== undefined) data.position_lng = parseFloat(npc.position_lng);
    if (npc.targetPositionLat !== undefined) data.target_position_lat = parseFloat(npc.targetPositionLat);
    if (npc.target_position_lat !== undefined) data.target_position_lat = parseFloat(npc.target_position_lat);
    if (npc.targetPositionLng !== undefined) data.target_position_lng = parseFloat(npc.targetPositionLng);
    if (npc.target_position_lng !== undefined) data.target_position_lng = parseFloat(npc.target_position_lng);
    // ✅ FASE 18.5: Edifícios de casa e trabalho
    if (npc.homeBuildingId !== undefined) data.home_building_id = npc.homeBuildingId;
    if (npc.home_building_id !== undefined) data.home_building_id = npc.home_building_id;
    if (npc.workBuildingId !== undefined) data.work_building_id = npc.workBuildingId;
    if (npc.work_building_id !== undefined) data.work_building_id = npc.work_building_id;
    if (npc.status !== undefined) data.status = npc.status;
    if (npc.routineState !== undefined) data.routine_state = npc.routineState;
    if (npc.routine_state !== undefined) data.routine_state = npc.routine_state;
    // ✅ FASE 18.5: virtual_hour - NÃO incluir no update (coluna pode não existir no schema ainda)
    // O BaseRepository já trata isso automaticamente removendo campos que não existem
    // Deixar comentado até que a coluna seja adicionada ao schema
    // if (npc.virtualHour !== undefined && npc.virtualHour !== null) {
    //   data.virtual_hour = parseInt(npc.virtualHour);
    // }
    // if (npc.virtual_hour !== undefined && npc.virtual_hour !== null) {
    //   data.virtual_hour = parseInt(npc.virtual_hour);
    // }
    if (npc.skinColor !== undefined) data.skin_color = npc.skinColor;
    if (npc.skin_color !== undefined) data.skin_color = npc.skin_color;
    if (npc.currentTask !== undefined) data.current_task = npc.currentTask;
    if (npc.current_task !== undefined) data.current_task = npc.current_task;
    if (npc.speed !== undefined) data.speed = parseFloat(npc.speed);
    if (npc.speed !== undefined) data.speed = parseFloat(npc.speed);
    if (npc.direction !== undefined) data.direction = parseFloat(npc.direction);
    if (npc.direction !== undefined) data.direction = parseFloat(npc.direction);
    // ✅ FASE 18.5: Rota urbana
    if (npc.currentRoute !== undefined) {
      data.current_route = typeof npc.currentRoute === 'string' ? JSON.parse(npc.currentRoute) : npc.currentRoute;
    }
    if (npc.current_route !== undefined) {
      data.current_route = typeof npc.current_route === 'string' ? JSON.parse(npc.current_route) : npc.current_route;
    }
    if (npc.routeIndex !== undefined) data.route_index = parseInt(npc.routeIndex);
    if (npc.route_index !== undefined) data.route_index = parseInt(npc.route_index);
    if (npc.lastMovementTime !== undefined) data.last_movement_time = npc.lastMovementTime;
    if (npc.last_movement_time !== undefined) data.last_movement_time = npc.last_movement_time;
    if (npc.nextActionTime !== undefined) data.next_action_time = npc.nextActionTime;
    if (npc.next_action_time !== undefined) data.next_action_time = npc.next_action_time;
    if (npc.npcType !== undefined) data.npc_type = npc.npcType;
    if (npc.npc_type !== undefined) data.npc_type = npc.npc_type;
    data.updated_at = new Date().toISOString();
    return data;
  }

  formatFromSupabase(record) {
    if (!record) return null;
    return {
      ...record,
      _id: record.id,
      npcId: record.npc_id,
      name: record.name,
      countryId: record.country_id,
      countryName: record.country_name,
      // ✅ FASE 18.5: Campos hierárquicos
      stateId: record.state_id,
      stateName: record.state_name,
      cityId: record.city_id,
      cityName: record.city_name,
      position: {
        lat: parseFloat(record.position_lat),
        lng: parseFloat(record.position_lng)
      },
      positionLat: parseFloat(record.position_lat),
      positionLng: parseFloat(record.position_lng),
      targetPosition: record.target_position_lat && record.target_position_lng ? {
        lat: parseFloat(record.target_position_lat),
        lng: parseFloat(record.target_position_lng)
      } : null,
      targetPositionLat: record.target_position_lat ? parseFloat(record.target_position_lat) : null,
      targetPositionLng: record.target_position_lng ? parseFloat(record.target_position_lng) : null,
      // ✅ FASE 18.5: Edifícios
      homeBuildingId: record.home_building_id,
      workBuildingId: record.work_building_id,
      status: record.status,
      routineState: record.routine_state || 'resting',
      virtualHour: parseInt(record.virtual_hour || 8),
      skinColor: record.skin_color,
      currentTask: record.current_task,
      speed: parseFloat(record.speed || 5.0),
      direction: parseFloat(record.direction || 0),
      // ✅ FASE 18.5: Rota urbana
      currentRoute: typeof record.current_route === 'string' ? JSON.parse(record.current_route || '[]') : (record.current_route || []),
      routeIndex: parseInt(record.route_index || 0),
      lastMovementTime: record.last_movement_time,
      nextActionTime: record.next_action_time,
      npcType: record.npc_type || 'resident',
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  // ✅ Sobrescrever formatRecord do BaseRepository para usar formatFromSupabase
  formatRecord(record) {
    return this.formatFromSupabase(record);
  }

  // ✅ Sobrescrever formatRecords do BaseRepository para usar formatFromSupabase
  formatRecords(records) {
    if (!records || !Array.isArray(records)) return [];
    return records.map(record => this.formatFromSupabase(record));
  }

  async create(npc) {
    const data = this.formatToSupabase(npc);
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  async findByNPCId(npcId) {
    const record = await this.findOne({ npc_id: npcId });
    return this.formatFromSupabase(record);
  }

  async findByCityId(cityId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('city_id', cityId);

    if (error) {
      logger.error(`Erro ao buscar NPCs por city_id ${cityId}:`, error);
      throw error;
    }
    return this.formatRecords(records || []);
  }

  async findByCountryId(countryId) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('country_id', countryId);

    if (error) {
      logger.error(`Erro ao buscar NPCs por country_id ${countryId}:`, error);
      throw error;
    }
    return this.formatRecords(records || []);
  }

  async findByRoutineState(routineState) {
    const supabase = this.getClient();
    const { data: records, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('routine_state', routineState);

    if (error) {
      logger.error(`Erro ao buscar NPCs por routine_state ${routineState}:`, error);
      throw error;
    }
    return this.formatRecords(records || []);
  }

  async update(id, npc) {
    const data = this.formatToSupabase(npc);
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  async updateByNPCId(npcId, npc) {
    const existing = await this.findByNPCId(npcId);
    if (!existing) {
      throw new Error(`NPC não encontrado para ${npcId}`);
    }
    return await this.update(existing.id, npc);
  }
}

export default new NPCRepository();

