import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Testando conexão com Supabase...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios!');
  console.error('   Verifique o arquivo .env');
  process.exit(1);
}

console.log(`📊 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\n`);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Testar conexão tentando acessar uma tabela
  console.log('🔄 Testando conexão...');
  
  // Tentar acessar a tabela users (pode não existir ainda, mas testa a conexão)
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('⚠️  Tabela "users" não existe ainda.');
      console.log('💡 Execute o schema SQL no Supabase Dashboard para criar as tabelas.\n');
      console.log('📋 Próximos passos:');
      console.log('   1. Acesse: https://supabase.com/dashboard');
      console.log('   2. Vá em SQL Editor');
      console.log('   3. Execute o arquivo: backend/config/schema.sql\n');
    } else {
      console.error('❌ Erro ao conectar:', error.message);
      console.error('   Código:', error.code);
      process.exit(1);
    }
  } else {
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('✅ Tabelas já existem no banco de dados!\n');
  }

  // Testar outras tabelas importantes
  const tables = ['wallets', 'npcs', 'buildings'];
  console.log('🔍 Verificando tabelas...\n');
  
  for (const table of tables) {
    const { error: tableError } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log(`   ⚠️  Tabela "${table}" não existe`);
    } else if (tableError) {
      console.log(`   ❌ Erro ao acessar "${table}": ${tableError.message}`);
    } else {
      console.log(`   ✅ Tabela "${table}" existe`);
    }
  }

  console.log('\n✅ Teste de conexão concluído!\n');

} catch (error) {
  console.error('\n❌ Erro ao testar conexão:', error.message);
  console.error('\n💡 Verifique:');
  console.error('   • As credenciais estão corretas?');
  console.error('   • O projeto Supabase está ativo?');
  console.error('   • A URL está correta?\n');
  process.exit(1);
}
