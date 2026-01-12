import { createLogger } from '../utils/logger.js';
import { getSupabaseClient } from '../config/supabase.js';

const logger = createLogger('MigrateNPCsTable');

/**
 * ✅ Script de migração para adicionar colunas faltantes na tabela npcs
 * Executa ALTER TABLE para adicionar campos que podem estar faltando
 */
export const migrateNPCsTable = async () => {
  try {
    logger.info('🔄 Iniciando migração da tabela npcs...');
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      logger.error('❌ Supabase não está conectado');
      return { success: false, message: 'Supabase não conectado' };
    }

    // Lista de colunas que precisam ser adicionadas (se não existirem)
    const columnsToAdd = [
      {
        name: 'virtual_hour',
        definition: 'INTEGER DEFAULT 8 CHECK (virtual_hour >= 0 AND virtual_hour <= 23)',
        comment: 'Hora virtual (0-23)'
      },
      {
        name: 'state_id',
        definition: 'VARCHAR(50) REFERENCES states(state_id) ON DELETE SET NULL',
        comment: 'ID do estado'
      },
      {
        name: 'state_name',
        definition: 'VARCHAR(255)',
        comment: 'Nome do estado'
      },
      {
        name: 'city_id',
        definition: 'VARCHAR(50) REFERENCES cities(city_id) ON DELETE SET NULL',
        comment: 'ID da cidade'
      },
      {
        name: 'city_name',
        definition: 'VARCHAR(255)',
        comment: 'Nome da cidade'
      },
      {
        name: 'home_building_id',
        definition: 'UUID REFERENCES buildings(id) ON DELETE SET NULL',
        comment: 'ID do edifício onde o NPC mora'
      },
      {
        name: 'work_building_id',
        definition: 'UUID REFERENCES buildings(id) ON DELETE SET NULL',
        comment: 'ID do edifício onde o NPC trabalha'
      },
      {
        name: 'routine_state',
        definition: "VARCHAR(30) DEFAULT 'resting' CHECK (routine_state IN ('resting', 'going_to_work', 'working', 'going_home'))",
        comment: 'Estado da rotina do NPC'
      },
      {
        name: 'current_route',
        definition: "JSONB DEFAULT '[]'::jsonb",
        comment: 'Rota urbana otimizada (array de pontos)'
      },
      {
        name: 'route_index',
        definition: 'INTEGER DEFAULT 0',
        comment: 'Índice atual na rota'
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const column of columnsToAdd) {
      try {
        // Verificar se a coluna já existe
        const { data: columnExists, error: checkError } = await supabase.rpc('check_column_exists', {
          table_name: 'npcs',
          column_name: column.name
        });

        // Se a função RPC não existir, tentar adicionar diretamente (pode falhar se já existir)
        if (checkError && checkError.message?.includes('function') || !columnExists) {
          // Tentar adicionar a coluna
          const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE npcs ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};`
          });

          if (alterError) {
            // Se a função RPC não existir, usar query direta (requer permissões)
            // Como alternativa, vamos apenas tentar adicionar e ignorar se já existir
            logger.warn(`⚠️  Não foi possível verificar/adicionar coluna ${column.name}: ${alterError.message}`);
            logger.info(`💡 Execute manualmente no Supabase SQL Editor: ALTER TABLE npcs ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};`);
          } else {
            logger.info(`✅ Coluna ${column.name} adicionada ou já existe`);
            addedCount++;
          }
        } else {
          logger.info(`⏭️  Coluna ${column.name} já existe, pulando...`);
          skippedCount++;
        }
      } catch (error) {
        logger.warn(`⚠️  Erro ao processar coluna ${column.name}: ${error.message}`);
        logger.info(`💡 Execute manualmente no Supabase SQL Editor: ALTER TABLE npcs ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};`);
      }
    }

    logger.info(`✅ Migração concluída: ${addedCount} colunas processadas, ${skippedCount} já existiam`);
    logger.info('💡 Se houver erros, execute o SQL manualmente no Supabase SQL Editor');
    
    return { 
      success: true, 
      added: addedCount, 
      skipped: skippedCount,
      message: 'Migração concluída. Verifique os logs para detalhes.'
    };
  } catch (error) {
    logger.error('❌ Erro na migração:', error);
    return { success: false, error: error.message };
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateNPCsTable()
    .then(result => {
      if (result.success) {
        logger.info('✅ Migração executada com sucesso');
        process.exit(0);
      } else {
        logger.error('❌ Migração falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('❌ Erro fatal na migração:', error);
      process.exit(1);
    });
}

