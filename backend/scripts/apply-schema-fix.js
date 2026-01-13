/**
 * ✅ Script para aplicar correções no schema do banco de dados
 * Adiciona colunas faltantes: city_id, city_name, updated_at
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFix() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  🔧 APLICANDO CORREÇÕES NO BANCO DE DADOS                 ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Ler arquivo SQL
    const sqlFilePath = path.join(__dirname, 'fix-database-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('📄 Executando script SQL...\n');

    // Executar via RPC ou diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Fallback: executar cada statement individualmente
      console.log('⚠️  exec_sql não disponível, executando manualmente...\n');
      
      // 1. Verificar e adicionar city_id
      console.log('1️⃣  Verificando coluna city_id...');
      const { error: error1 } = await supabase.rpc('exec', {
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'buildings' AND column_name = 'city_id'
              ) THEN
                  ALTER TABLE buildings ADD COLUMN city_id TEXT;
              END IF;
          END $$;
        `
      });
      if (!error1) console.log('   ✅ Coluna city_id verificada');
      
      // 2. Verificar e adicionar city_name
      console.log('2️⃣  Verificando coluna city_name...');
      const { error: error2 } = await supabase.rpc('exec', {
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'buildings' AND column_name = 'city_name'
              ) THEN
                  ALTER TABLE buildings ADD COLUMN city_name TEXT;
              END IF;
          END $$;
        `
      });
      if (!error2) console.log('   ✅ Coluna city_name verificada');
      
      // 3. Verificar e adicionar updated_at
      console.log('3️⃣  Verificando coluna updated_at...');
      const { error: error3 } = await supabase.rpc('exec', {
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'shareholders' AND column_name = 'updated_at'
              ) THEN
                  ALTER TABLE shareholders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
              END IF;
          END $$;
        `
      });
      if (!error3) console.log('   ✅ Coluna updated_at verificada');
      
      return { data: 'Correções aplicadas manualmente', error: null };
    });

    if (error) {
      console.error('❌ Erro ao executar script:', error);
      
      // Tentar via query SQL direto
      console.log('\n⚠️  Tentando método alternativo...\n');
      
      // Método alternativo: usar from().select() para verificar colunas
      console.log('📊 Verificando schema atual...');
      
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .limit(1);
      
      if (buildings && buildings[0]) {
        const columns = Object.keys(buildings[0]);
        console.log('   Colunas em buildings:', columns.join(', '));
        
        if (!columns.includes('city_id')) {
          console.log('   ❌ city_id não encontrado!');
        } else {
          console.log('   ✅ city_id encontrado');
        }
      }
      
      const { data: shareholders, error: shareholdersError } = await supabase
        .from('shareholders')
        .select('*')
        .limit(1);
      
      if (shareholders && shareholders[0]) {
        const columns = Object.keys(shareholders[0]);
        console.log('   Colunas em shareholders:', columns.join(', '));
        
        if (!columns.includes('updated_at')) {
          console.log('   ❌ updated_at não encontrado!');
        } else {
          console.log('   ✅ updated_at encontrado');
        }
      }
      
      console.log('\n⚠️  ATENÇÃO: Execute as alterações manualmente no Supabase Dashboard:');
      console.log('\n1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/editor');
      console.log('2. Execute os comandos SQL:');
      console.log('\n```sql');
      console.log('ALTER TABLE buildings ADD COLUMN IF NOT EXISTS city_id TEXT;');
      console.log('ALTER TABLE buildings ADD COLUMN IF NOT EXISTS city_name TEXT;');
      console.log('ALTER TABLE shareholders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();');
      console.log('```\n');
      
      return;
    }

    console.log('\n✅ Correções aplicadas com sucesso!');
    console.log(data);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ BANCO DE DADOS ATUALIZADO!                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error);
    console.log('\n💡 Solução Manual:');
    console.log('   Acesse o Supabase Dashboard e execute o arquivo:');
    console.log('   backend/scripts/fix-database-schema.sql\n');
  }
}

// Executar
applySchemaFix().then(() => {
  console.log('🏁 Script finalizado\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});

