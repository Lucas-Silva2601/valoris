import { getSupabase } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('BaseRepository');

/**
 * Classe base para repositórios Supabase
 * Fornece métodos comuns para CRUD operations
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Obter cliente Supabase
   */
  getClient() {
    try {
      return getSupabase();
    } catch (error) {
      logger.error(`Erro ao obter cliente Supabase para ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Converter UUID para string (para compatibilidade)
   */
  formatId(id) {
    return id ? id.toString() : null;
  }

  /**
   * Converter objeto do Supabase para formato esperado
   */
  formatRecord(record) {
    if (!record) return null;
    
    // Converter id para _id para compatibilidade com código existente
    const formatted = {
      ...record,
      _id: this.formatId(record.id),
      id: this.formatId(record.id)
    };
    
    return formatted;
  }

  /**
   * Converter array de registros
   */
  formatRecords(records) {
    if (!records || !Array.isArray(records)) return [];
    return records.map(record => this.formatRecord(record));
  }

  /**
   * Criar novo registro
   */
  async create(data) {
    try {
      const supabase = this.getClient();
      const { data: record, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return this.formatRecord(record);
    } catch (error) {
      logger.error(`Erro ao criar registro em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Criar múltiplos registros
   */
  async createMany(dataArray) {
    try {
      const supabase = this.getClient();
      const { data: records, error } = await supabase
        .from(this.tableName)
        .insert(dataArray)
        .select();

      if (error) throw error;
      return this.formatRecords(records);
    } catch (error) {
      logger.error(`Erro ao criar múltiplos registros em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id) {
    try {
      const supabase = this.getClient();
      const { data: record, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = não encontrado
      return this.formatRecord(record);
    } catch (error) {
      logger.error(`Erro ao buscar por ID em ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Buscar um registro por critério
   */
  async findOne(query = {}) {
    try {
      const supabase = this.getClient();
      let queryBuilder = supabase.from(this.tableName).select('*');

      // Aplicar filtros
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { data: records, error } = await queryBuilder.limit(1);

      if (error) throw error;
      return records && records.length > 0 ? this.formatRecord(records[0]) : null;
    } catch (error) {
      logger.error(`Erro ao buscar um registro em ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Buscar múltiplos registros
   */
  async find(query = {}, options = {}) {
    try {
      const supabase = this.getClient();
      let queryBuilder = supabase.from(this.tableName).select('*');

      // Aplicar filtros
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.$ne) {
            queryBuilder = queryBuilder.neq(key, value.$ne);
          } else if (typeof value === 'object' && value.$gte) {
            queryBuilder = queryBuilder.gte(key, value.$gte);
          } else if (typeof value === 'object' && value.$lte) {
            queryBuilder = queryBuilder.lte(key, value.$lte);
          } else {
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      });

      // Aplicar ordenação
      if (options.sort) {
        Object.entries(options.sort).forEach(([key, direction]) => {
          queryBuilder = queryBuilder.order(key, { ascending: direction === 1 || direction === 'asc' });
        });
      } else {
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
      }

      // Aplicar limite (padrão: 1000 para garantir que retorne todos os registros relevantes)
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      } else {
        // ✅ Por padrão, retornar até 1000 registros (suficiente para edifícios de um usuário)
        queryBuilder = queryBuilder.limit(1000);
      }

      const { data: records, error } = await queryBuilder;

      if (error) throw error;
      return this.formatRecords(records || []);
    } catch (error) {
      logger.error(`Erro ao buscar registros em ${this.tableName}:`, error);
      return [];
    }
  }

  /**
   * Atualizar registro
   */
  async update(id, data) {
    try {
      const supabase = this.getClient();
      
      // ✅ Filtrar campos que podem não existir no schema (ex: virtual_hour)
      // Se o erro for sobre coluna não encontrada, remover esse campo e tentar novamente
      let filteredData = { ...data };
      
      const { data: record, error } = await supabase
        .from(this.tableName)
        .update(filteredData)
        .eq('id', id)
        .select()
        .single();

      // ✅ Se o erro for sobre coluna não encontrada, remover campos problemáticos e tentar novamente
      if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
        // Tentar extrair nome da coluna do erro
        const columnMatch = error.message?.match(/'(\w+)'/);
        const columnName = columnMatch?.[1];
        
        if (columnName && filteredData[columnName] !== undefined) {
          logger.warn(`⚠️  Coluna ${columnName} não encontrada no schema, removendo do update...`);
          delete filteredData[columnName];
          
          // Tentar novamente sem o campo problemático
          const { data: retryRecord, error: retryError } = await supabase
            .from(this.tableName)
            .update(filteredData)
            .eq('id', id)
            .select()
            .single();
          
          if (retryError && retryError.code !== 'PGRST204' && retryError.code !== '42703') {
            throw retryError;
          }
          
          if (!retryError) {
            return this.formatRecord(retryRecord);
          }
        }
        
        // Se ainda tiver erro após remover a coluna, remover virtual_hour se estiver presente
        if (filteredData.virtual_hour !== undefined) {
          logger.warn(`⚠️  Removendo virtual_hour do update (coluna não existe no schema)`);
          delete filteredData.virtual_hour;
          
          const { data: finalRecord, error: finalError } = await supabase
            .from(this.tableName)
            .update(filteredData)
            .eq('id', id)
            .select()
            .single();
          
          if (finalError && finalError.code !== 'PGRST204' && finalError.code !== '42703') {
            throw finalError;
          }
          
          if (!finalError) {
            return this.formatRecord(finalRecord);
          }
        }
      }
      
      if (error) throw error;
      return this.formatRecord(record);
    } catch (error) {
      logger.error(`Erro ao atualizar registro em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Atualizar múltiplos registros
   */
  async updateMany(query, data) {
    try {
      const supabase = this.getClient();
      let queryBuilder = supabase.from(this.tableName).update(data);

      // Aplicar filtros
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { data: records, error } = await queryBuilder.select();

      if (error) throw error;
      return this.formatRecords(records || []);
    } catch (error) {
      logger.error(`Erro ao atualizar múltiplos registros em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deletar registro
   */
  async delete(id) {
    try {
      const supabase = this.getClient();
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error(`Erro ao deletar registro em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deletar múltiplos registros
   */
  async deleteMany(query) {
    try {
      const supabase = this.getClient();
      let queryBuilder = supabase.from(this.tableName).delete();

      // Aplicar filtros
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { error } = await queryBuilder;

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error(`Erro ao deletar múltiplos registros em ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Contar registros
   */
  async count(query = {}) {
    try {
      const supabase = this.getClient();
      let queryBuilder = supabase.from(this.tableName).select('*', { count: 'exact', head: true });

      // Aplicar filtros
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { count, error } = await queryBuilder;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error(`Erro ao contar registros em ${this.tableName}:`, error);
      return 0;
    }
  }

  /**
   * Buscar e atualizar (findOneAndUpdate)
   */
  async findOneAndUpdate(query, data, options = {}) {
    const record = await this.findOne(query);
    if (!record) {
      if (options.upsert) {
        return await this.create({ ...query, ...data });
      }
      return null;
    }
    return await this.update(record.id, data);
  }
}

