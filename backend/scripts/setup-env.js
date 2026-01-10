import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envExamplePath = join(__dirname, '../env.example');
const envPath = join(__dirname, '../.env');

console.log('\n🔧 Configurando arquivo .env...\n');

if (!existsSync(envExamplePath)) {
  console.error('❌ Arquivo env.example não encontrado!');
  process.exit(1);
}

if (existsSync(envPath)) {
  console.log('⚠️  Arquivo .env já existe!');
  console.log('   Se quiser sobrescrever, delete o arquivo .env primeiro.\n');
  process.exit(0);
}

try {
  const content = readFileSync(envExamplePath, 'utf-8');
  writeFileSync(envPath, content, 'utf-8');
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log(`   Local: ${envPath}\n`);
  console.log('📋 Próximos passos:');
  console.log('   1. Verifique se as credenciais do Supabase estão corretas no .env');
  console.log('   2. Execute o schema SQL no Supabase Dashboard');
  console.log('   3. Teste a conexão: node scripts/test-supabase-connection.js');
  console.log('   4. Inicie o servidor: npm start\n');
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
}

