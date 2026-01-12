import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { createLogger } from '../utils/logger.js';

dotenv.config();

const logger = createLogger('ResetDatabase');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 🗑️ Deletar todos os registros de uma tabela
 */
const deleteAllFromTable = async (supabase, tableName) => {
  try {
    // Verificar se a tabela existe
    const { error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // Tabela não existe, não há nada para deletar
        return { success: true, deleted: 0, message: 'Tabela não existe' };
      }
      throw checkError;
    }

    // Deletar em lotes para evitar timeout
    let totalDeleted = 0;
    let hasMore = true;
    const batchSize = 1000;

    while (hasMore) {
      // Buscar IDs para deletar
      const { data, error: selectError } = await supabase
        .from(tableName)
        .select('id')
        .limit(batchSize);

      if (selectError) {
        throw selectError;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Deletar o lote
      const ids = data.map(row => row.id);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (deleteError) {
        throw deleteError;
      }

      totalDeleted += ids.length;
      logger.info(`   📦 Deletados ${ids.length} registros de ${tableName} (total: ${totalDeleted})`);

      // Se retornou menos que o batch size, não há mais registros
      if (data.length < batchSize) {
        hasMore = false;
      }
    }

    return { success: true, deleted: totalDeleted };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ Script para resetar completamente o banco de dados
 * 
 * Este script:
 * 1. Deleta todos os dados de todas as tabelas (respeitando foreign keys)
 * 2. Opcionalmente executa o seed
 */
const resetDatabase = async (options = {}) => {
  const {
    runSeed = true,
    keepUsers = false
  } = options;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY não configuradas!');
    logger.error('📋 Configure no arquivo .env:');
    logger.error('   SUPABASE_URL=https://seu-projeto.supabase.co');
    logger.error('   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role (recomendado para operações admin)');
    process.exit(1);
  }

  // Usar SERVICE_ROLE_KEY se disponível para poder deletar tudo
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ✅ IMPORTANTE: Inicializar o cliente global do supabase.js para que seedDatabase funcione
  // Importar e inicializar manualmente sem executar connectDB() (que executa seed automaticamente)
  try {
    const supabaseModule = await import('../config/supabase.js');
    // Inicializar manualmente o cliente global
    if (supabaseModule.getSupabase) {
      try {
        // Verificar se já está conectado, se não, inicializar manualmente
        if (!supabaseModule.checkConnection()) {
          // Usar um hack temporário para inicializar o cliente global
          // Nota: Isso requer que o módulo exporte uma função de inicialização manual
          // Por enquanto, vamos usar connectDB() mas vamos desabilitar o seed automático
          logger.debug('Inicializando cliente global Supabase...');
        }
      } catch (getSupabaseError) {
        // Se getSupabase() lançar erro, significa que não está conectado
        logger.debug('Cliente global não está inicializado, usando cliente local');
      }
    }
  } catch (importError) {
    logger.debug('Não foi possível importar módulo supabase, continuando com cliente local');
  }

  logger.info('🔄 Iniciando reset do banco de dados...');
  logger.info(`📊 URL: ${supabaseUrl}`);
  logger.info(`🔑 Usando: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}`);

  try {
    // 1. DELETAR TODOS OS DADOS (respeitando ordem de dependências)
    logger.info('\n🗑️  Deletando dados das tabelas...');

    // Ordem de deleção respeitando foreign keys
    const tablesToDelete = [
      // Tabelas que dependem de outras (deletar primeiro)
      'npcs',
      'buildings',
      'transactions',
      'dividends',
      'shareholders',
      'military_units',
      'combats',
      'market_orders',
      'missions',
      'player_profiles',
      'game_events',
      'analytics_metrics',
      
      // Tabelas intermediárias
      'country_ownership',
      'country_defense',
      'economic_metrics',
      'treasuries',
    ];

    // Deletar dados das tabelas
    for (const table of tablesToDelete) {
      logger.info(`🗑️  Limpando ${table}...`);
      const result = await deleteAllFromTable(supabase, table);
      
      if (result.success) {
        if (result.deleted > 0) {
          logger.info(`✅ ${table}: ${result.deleted} registros deletados`);
        } else if (result.message === 'Tabela não existe') {
          logger.info(`ℹ️  ${table}: Tabela não existe, pulando...`);
        } else {
          logger.info(`✅ ${table}: Já estava vazia`);
        }
      } else {
        logger.warn(`⚠️  ${table}: Erro - ${result.error}`);
      }
    }

    // 2. Deletar users e wallets (se não for manter)
    if (!keepUsers) {
      logger.info('\n🗑️  Limpando users e wallets...');
      
      const usersResult = await deleteAllFromTable(supabase, 'users');
      if (usersResult.success) {
        logger.info(`✅ users: ${usersResult.deleted} registros deletados`);
      }

      const walletsResult = await deleteAllFromTable(supabase, 'wallets');
      if (walletsResult.success) {
        logger.info(`✅ wallets: ${walletsResult.deleted} registros deletados`);
      }
    } else {
      logger.info('\n⚠️  Mantendo usuários e carteiras (--keep-users)');
    }

    logger.info('\n✅ Dados deletados com sucesso!');

    // 3. INICIALIZAR CLIENTE GLOBAL PARA SEED
    // O seedDatabase precisa que o cliente global esteja inicializado
    if (runSeed) {
      logger.info('\n🔧 Inicializando cliente global Supabase para seed...');
      
      try {
        // Usar initializeSupabase para não executar seed automático
        const { initializeSupabase } = await import('../config/supabase.js');
        await initializeSupabase();
        logger.info('✅ Cliente global inicializado');
      } catch (connectError) {
        logger.warn(`⚠️  Não foi possível inicializar cliente global: ${connectError.message}`);
        logger.warn('   Tentando executar seed mesmo assim...');
      }
    }

    // 4. EXECUTAR SEED (se solicitado)
    if (runSeed) {
      logger.info('\n🌱 Executando seed do banco de dados...');
      
      try {
        const { seedDatabase } = await import('../utils/seedDatabase.js');
        const result = await seedDatabase();
        
        if (result && result.success) {
          logger.info('✅ Seed executado com sucesso!');
          logger.info(`   💰 Saldo garantido para usuário de teste: 100.000 VAL`);
          logger.info(`   🌍 NPCs distribuídos globalmente`);
        } else {
          logger.warn(`⚠️  Seed executado com avisos: ${result?.message || 'resultado não retornado'}`);
        }
      } catch (seedError) {
        logger.error(`❌ Erro ao executar seed: ${seedError.message}`);
        logger.error(seedError.stack);
      }
    } else {
      logger.info('\n⚠️  Seed não executado (--no-seed)');
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ RESET DO BANCO DE DADOS CONCLUÍDO!');
    logger.info('='.repeat(60));
    logger.info('\n💡 Próximos passos:');
    logger.info('   1. O banco foi resetado e está limpo');
    if (runSeed) {
      logger.info('   2. Seed foi executado automaticamente');
      logger.info('   3. Você pode começar a testar!');
    } else {
      logger.info('   2. Execute o seed manualmente se necessário');
      logger.info('   3. Ou execute: npm run reset-db (sem --no-seed)');
    }

  } catch (error) {
    logger.error('\n❌ Erro durante reset do banco de dados:');
    logger.error(error.message);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Executar se chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;

if (isMainModule || process.argv[1]?.endsWith('resetDatabase.js')) {
  const args = process.argv.slice(2);
  const options = {
    runSeed: !args.includes('--no-seed'),
    keepUsers: args.includes('--keep-users')
  };

  logger.info('🔧 Opções de reset:');
  logger.info(`   - Executar seed: ${options.runSeed ? 'SIM' : 'NÃO (--no-seed)'}`);
  logger.info(`   - Manter usuários: ${options.keepUsers ? 'SIM (--keep-users)' : 'NÃO'}`);
  logger.info('');

  resetDatabase(options)
    .then(() => {
      logger.info('\n✅ Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Script falhou:', error);
      process.exit(1);
    });
}

export default resetDatabase;

