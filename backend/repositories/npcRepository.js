import { BaseRepository } from './baseRepository.js';

export class NPCRepository extends BaseRepository {
  constructor() {
    super('npcs');
  }

  /**
   * Converter formato do Mongoose para formato do Supabase
   */
  formatToSupabase(npc) {
    // Função auxiliar para converter Date para ISO string
    const toISO = (date) => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') return date;
      return null;
    };

    const data = {};
    
    // Apenas incluir campos que foram fornecidos (para updates parciais)
    if (npc.npcId !== undefined) data.npc_id = npc.npcId;
    if (npc.npc_id !== undefined) data.npc_id = npc.npc_id;
    if (npc.name !== undefined) data.name = npc.name;
    if (npc.countryId !== undefined) data.country_id = npc.countryId;
    if (npc.country_id !== undefined) data.country_id = npc.country_id;
    if (npc.countryName !== undefined) data.country_name = npc.countryName;
    if (npc.country_name !== undefined) data.country_name = npc.country_name;
    
    // ✅ Posição - GARANTIR que sempre tenha valores válidos (não null)
    if (npc.position !== undefined && npc.position !== null) {
      // Se position for um objeto com lat e lng válidos
      if (typeof npc.position === 'object' && npc.position.lat != null && npc.position.lng != null) {
        data.position_lat = parseFloat(npc.position.lat);
        data.position_lng = parseFloat(npc.position.lng);
      }
    } else if (npc.position_lat !== undefined && npc.position_lat !== null && 
               npc.position_lng !== undefined && npc.position_lng !== null) {
      // Se position_lat/lng forem fornecidos diretamente
      data.position_lat = parseFloat(npc.position_lat);
      data.position_lng = parseFloat(npc.position_lng);
    }
    // ✅ Se nenhuma posição for fornecida e estivermos fazendo UPDATE, NÃO incluir no objeto
    // (manter posição atual do banco) - isso evita passar null e violar constraint NOT NULL
    
    // Target position
    if (npc.targetPosition !== undefined) {
      if (npc.targetPosition === null) {
        data.target_position_lat = null;
        data.target_position_lng = null;
      } else {
        data.target_position_lat = npc.targetPosition.lat;
        data.target_position_lng = npc.targetPosition.lng;
      }
    } else {
      if (npc.target_position_lat !== undefined) data.target_position_lat = npc.target_position_lat;
      if (npc.target_position_lng !== undefined) data.target_position_lng = npc.target_position_lng;
    }
    
    if (npc.homeBuilding !== undefined) data.home_building_id = npc.homeBuilding;
    if (npc.home_building_id !== undefined) data.home_building_id = npc.home_building_id;
    if (npc.workBuilding !== undefined) data.work_building_id = npc.workBuilding;
    if (npc.work_building_id !== undefined) data.work_building_id = npc.work_building_id;
    if (npc.status !== undefined) data.status = npc.status;
    if (npc.skinColor !== undefined) data.skin_color = npc.skinColor;
    if (npc.skin_color !== undefined) data.skin_color = npc.skin_color;
    if (npc.currentTask !== undefined) data.current_task = npc.currentTask;
    if (npc.current_task !== undefined) data.current_task = npc.current_task;
    if (npc.speed !== undefined) data.speed = npc.speed;
    if (npc.direction !== undefined) data.direction = npc.direction;
    if (npc.lastMovementTime !== undefined) data.last_movement_time = toISO(npc.lastMovementTime);
    if (npc.last_movement_time !== undefined) data.last_movement_time = toISO(npc.last_movement_time);
    if (npc.nextActionTime !== undefined) data.next_action_time = toISO(npc.nextActionTime);
    if (npc.next_action_time !== undefined) data.next_action_time = toISO(npc.next_action_time);
    if (npc.npcType !== undefined) data.npc_type = npc.npcType;
    if (npc.npc_type !== undefined) data.npc_type = npc.npc_type;
    
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
      npcId: record.npc_id,
      countryId: record.country_id,
      countryName: record.country_name,
      position: {
        lat: record.position_lat,
        lng: record.position_lng
      },
      targetPosition: record.target_position_lat && record.target_position_lng ? {
        lat: record.target_position_lat,
        lng: record.target_position_lng
      } : null,
      homeBuilding: record.home_building_id,
      workBuilding: record.work_building_id,
      skinColor: record.skin_color,
      currentTask: record.current_task,
      lastMovementTime: record.last_movement_time,
      nextActionTime: record.next_action_time,
      npcType: record.npc_type
    };
  }

  /**
   * Criar NPC
   * ✅ GARANTIR que sempre tenha posição válida
   */
  async create(npc) {
    const data = this.formatToSupabase(npc);
    
    // ✅ GARANTIR que position_lat e position_lng sempre existam e sejam válidos (OBRIGATÓRIO para INSERT)
    if (!data.position_lat || !data.position_lng ||
        isNaN(data.position_lat) || isNaN(data.position_lng)) {
      throw new Error(`NPC deve ter posição válida (lat: ${data.position_lat}, lng: ${data.position_lng})`);
    }
    
    // ✅ Garantir que valores são números válidos
    data.position_lat = parseFloat(data.position_lat);
    data.position_lng = parseFloat(data.position_lng);
    
    // ✅ Validar limites
    if (data.position_lat < -90 || data.position_lat > 90 ||
        data.position_lng < -180 || data.position_lng > 180) {
      throw new Error(`Posição do NPC fora dos limites (lat: ${data.position_lat}, lng: ${data.position_lng})`);
    }
    
    const record = await super.create(data);
    return this.formatFromSupabase(record);
  }

  /**
   * Buscar por npc_id
   */
  async findByNpcId(npcId) {
    const record = await this.findOne({ npc_id: npcId });
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
   * Buscar todos os NPCs
   */
  async findAll(options = {}) {
    const records = await this.find({}, options);
    return records.map(record => this.formatFromSupabase(record));
  }

  /**
   * Atualizar NPC por ID (UUID)
   * ✅ GARANTIR que posição seja preservada se não for fornecida nova
   */
  async update(id, npc) {
    // ✅ Se npc já é objeto formatado (data direto), usar diretamente
    // Senão, formatar primeiro
    let data;
    if (npc.position_lat !== undefined || npc.position_lng !== undefined || 
        (npc.position !== undefined && npc.position !== null)) {
      // É um objeto com posição (formato do código)
      data = this.formatToSupabase(npc);
    } else {
      // É um objeto já formatado (direto do Supabase)
      data = npc;
    }
    
    // ✅ Se position não foi fornecida no update, buscar a atual do banco para preservar
    if (!data.position_lat && !data.position_lng) {
      const existing = await this.findById(id);
      if (existing && existing.position) {
        data.position_lat = existing.position.lat;
        data.position_lng = existing.position.lng;
      } else {
        // Se não existe no banco ou não tem posição, não pode atualizar sem posição válida
        throw new Error(`NPC ${id} não tem posição válida e nenhuma foi fornecida no update`);
      }
    }
    
    // ✅ GARANTIR que position_lat e position_lng são válidos
    if (data.position_lat !== undefined && data.position_lng !== undefined) {
      data.position_lat = parseFloat(data.position_lat);
      data.position_lng = parseFloat(data.position_lng);
      
      // Validar limites
      if (isNaN(data.position_lat) || isNaN(data.position_lng) ||
          data.position_lat < -90 || data.position_lat > 90 ||
          data.position_lng < -180 || data.position_lng > 180) {
        throw new Error(`Posição inválida fornecida para NPC ${id}`);
      }
    }
    
    const record = await super.update(id, data);
    return this.formatFromSupabase(record);
  }

  /**
   * Atualizar NPC por npc_id (string)
   * ✅ GARANTIR que posição seja SEMPRE preservada (nunca null)
   */
  async updateByNpcId(npcId, npc) {
    const existing = await this.findByNpcId(npcId);
    if (!existing) {
      throw new Error(`NPC com npc_id ${npcId} não encontrado`);
    }
    
    // ✅ Formatar dados para Supabase
    const data = this.formatToSupabase(npc);
    
    // ✅ GARANTIR que SEMPRE temos position_lat e position_lng válidos
    // Se não foi fornecida nova posição, usar posição atual do NPC existente
    if (!data.position_lat || !data.position_lng || 
        data.position_lat === null || data.position_lng === null ||
        data.position_lat === undefined || data.position_lng === undefined) {
      
      // ✅ Tentar usar posição atual do NPC existente
      if (existing.position && existing.position.lat != null && existing.position.lng != null &&
          !isNaN(existing.position.lat) && !isNaN(existing.position.lng)) {
        data.position_lat = parseFloat(existing.position.lat);
        data.position_lng = parseFloat(existing.position.lng);
        logger.debug(`Preservando posição atual do NPC ${npcId}:`, { lat: data.position_lat, lng: data.position_lng });
      } else {
        // ✅ Se NPC não tem posição válida, usar coordenadas padrão do país ou Brasil
        logger.warn(`⚠️  NPC ${npcId} não tem posição válida. Usando coordenadas do país ou padrão.`);
        const countryCoords = {
          'BRA': { lat: -14.2350, lng: -51.9253 },
          'USA': { lat: 37.0902, lng: -95.7129 },
          'ARG': { lat: -38.4161, lng: -63.6167 },
          'PER': { lat: -9.1900, lng: -75.0152 },
          'BOL': { lat: -16.2902, lng: -63.5887 },
          'COL': { lat: 4.5709, lng: -74.2973 },
          'VEN': { lat: 6.4238, lng: -66.5897 },
        };
        
        const knownCoords = existing.countryId ? countryCoords[existing.countryId?.toUpperCase()] : null;
        if (knownCoords) {
          data.position_lat = knownCoords.lat;
          data.position_lng = knownCoords.lng;
          logger.info(`✅ Usando coordenadas do país ${existing.countryId} para NPC ${npcId}`);
        } else {
          // Fallback final: usar centro do Brasil
          data.position_lat = -14.2350;
          data.position_lng = -51.9253;
          logger.warn(`⚠️  Usando coordenadas padrão (Brasil) para NPC ${npcId}`);
        }
      }
    } else {
      // ✅ Se position foi fornecida, validar antes de usar
      const providedLat = parseFloat(data.position_lat);
      const providedLng = parseFloat(data.position_lng);
      
      if (isNaN(providedLat) || isNaN(providedLng) ||
          providedLat < -90 || providedLat > 90 ||
          providedLng < -180 || providedLng > 180) {
        logger.warn(`⚠️  Posição inválida fornecida para NPC ${npcId}. Usando posição atual.`);
        // Usar posição atual se inválida foi fornecida
        if (existing.position && existing.position.lat != null && existing.position.lng != null) {
          data.position_lat = parseFloat(existing.position.lat);
          data.position_lng = parseFloat(existing.position.lng);
        } else {
          // Usar coordenadas padrão se nem atual nem fornecida são válidas
          data.position_lat = -14.2350;
          data.position_lng = -51.9253;
        }
      } else {
        // ✅ Posição fornecida é válida, usar ela
        data.position_lat = providedLat;
        data.position_lng = providedLng;
      }
    }
    
    // ✅ GARANTIR que position_lat e position_lng são números válidos (nunca null)
    if (!data.position_lat || !data.position_lng || 
        isNaN(data.position_lat) || isNaN(data.position_lng)) {
      throw new Error(`NPC ${npcId}: Não foi possível garantir posição válida. position_lat=${data.position_lat}, position_lng=${data.position_lng}`);
    }
    
    return await this.update(existing.id, data);
  }

  /**
   * Buscar por status
   */
  async findByStatus(status) {
    const records = await this.find({ status });
    return records.map(record => this.formatFromSupabase(record));
  }
}

export default new NPCRepository();

