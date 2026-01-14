/**
 * ═══════════════════════════════════════════════════════════
 * 🔍 DIAGNÓSTICO: Verificar NPCs com city_id
 * ═══════════════════════════════════════════════════════════
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório backend
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNPCs() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  🔍 DIAGNÓSTICO: NPCs com city_id                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Contar NPCs totais
    const { count: totalNPCs, error: countError } = await supabase
      .from('npcs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar NPCs:', countError);
      return;
    }

    console.log(`📊 Total de NPCs no banco: ${totalNPCs}`);

    // Contar NPCs COM city_id
    const { count: npcsWithCity, error: withCityError } = await supabase
      .from('npcs')
      .select('*', { count: 'exact', head: true })
      .not('city_id', 'is', null);

    if (withCityError) {
      console.error('❌ Erro ao contar NPCs com city_id:', withCityError);
      return;
    }

    console.log(`✅ NPCs COM city_id: ${npcsWithCity}`);

    // Contar NPCs SEM city_id
    const { count: npcsWithoutCity, error: withoutCityError } = await supabase
      .from('npcs')
      .select('*', { count: 'exact', head: true })
      .is('city_id', null);

    if (withoutCityError) {
      console.error('❌ Erro ao contar NPCs sem city_id:', withoutCityError);
      return;
    }

    console.log(`❌ NPCs SEM city_id: ${npcsWithoutCity}`);

    // Buscar alguns exemplos de NPCs COM city_id
    if (npcsWithCity > 0) {
      const { data: examplesWithCity, error: examplesError } = await supabase
        .from('npcs')
        .select('npc_id, name, country_id, city_id, city_name, state_id, state_name, position_lat, position_lng')
        .not('city_id', 'is', null)
        .limit(10);

      if (examplesError) {
        console.error('❌ Erro ao buscar exemplos:', examplesError);
      } else {
        console.log('\n📍 Exemplos de NPCs COM city_id:');
        examplesWithCity.forEach((npc, index) => {
          console.log(`   ${index + 1}. ${npc.npc_id} (${npc.name})`);
          console.log(`      País: ${npc.country_id}`);
          console.log(`      Estado: ${npc.state_name || 'N/A'} (${npc.state_id || 'N/A'})`);
          console.log(`      Cidade: ${npc.city_name || 'N/A'} (${npc.city_id || 'N/A'})`);
          console.log(`      Posição: ${npc.position_lat}, ${npc.position_lng}`);
        });
      }
    }

    // Buscar alguns exemplos de NPCs SEM city_id
    if (npcsWithoutCity > 0) {
      const { data: examplesWithoutCity, error: examplesError } = await supabase
        .from('npcs')
        .select('npc_id, name, country_id, city_id, city_name, state_id, state_name, position_lat, position_lng')
        .is('city_id', null)
        .limit(10);

      if (examplesError) {
        console.error('❌ Erro ao buscar exemplos:', examplesError);
      } else {
        console.log('\n⚠️  Exemplos de NPCs SEM city_id:');
        examplesWithoutCity.forEach((npc, index) => {
          console.log(`   ${index + 1}. ${npc.npc_id} (${npc.name})`);
          console.log(`      País: ${npc.country_id}`);
          console.log(`      Estado: ${npc.state_name || 'NULL'} (${npc.state_id || 'NULL'})`);
          console.log(`      Cidade: ${npc.city_name || 'NULL'} (${npc.city_id || 'NULL'})`);
          console.log(`      Posição: ${npc.position_lat || 'NULL'}, ${npc.position_lng || 'NULL'}`);
        });
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║  ✅ DIAGNÓSTICO CONCLUÍDO                                 ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (npcsWithCity === 0) {
      console.log('\n🔴 PROBLEMA CONFIRMADO:');
      console.log('   O script populate:geo NÃO atualizou o banco de dados!');
      console.log('   Todos os NPCs ainda estão sem city_id.');
      console.log('\n✅ SOLUÇÃO:');
      console.log('   Verifique se o script está usando o .env correto');
      console.log('   e se a conexão com o Supabase está funcionando.');
    } else if (npcsWithCity < totalNPCs) {
      console.log(`\n⚠️  PARCIALMENTE ATUALIZADO:`);
      console.log(`   ${npcsWithCity} NPCs têm city_id (${((npcsWithCity / totalNPCs) * 100).toFixed(1)}%)`);
      console.log(`   ${npcsWithoutCity} NPCs ainda sem city_id (${((npcsWithoutCity / totalNPCs) * 100).toFixed(1)}%)`);
    } else {
      console.log('\n✅ TODOS OS NPCs TÊM city_id!');
      console.log('   O problema pode estar no cache do backend.');
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

checkNPCs().then(() => process.exit(0));

