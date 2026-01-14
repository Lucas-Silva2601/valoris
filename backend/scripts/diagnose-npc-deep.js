import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env do diretório backend
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🔬 DIAGNÓSTICO PROFUNDO DOS NPCs                        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function diagnosticar() {
  try {
    console.log('📊 ETAPA 1: Contagem Total de NPCs\n');
    
    // Buscar TODOS os NPCs
    const { data: allNpcs, error: errorAll } = await supabase
      .from('npcs')
      .select('*');
    
    if (errorAll) {
      console.error('❌ Erro ao buscar NPCs:', errorAll);
      return;
    }
    
    console.log(`   Total de NPCs no banco: ${allNpcs.length}`);
    
    // Análise detalhada
    const comCityId = allNpcs.filter(npc => npc.city_id !== null);
    const semCityId = allNpcs.filter(npc => npc.city_id === null);
    const comCoordenadas = allNpcs.filter(npc => npc.position_lat !== null && npc.position_lng !== null);
    const semCoordenadas = allNpcs.filter(npc => npc.position_lat === null || npc.position_lng === null);
    
    console.log(`   ✅ NPCs com city_id: ${comCityId.length}`);
    console.log(`   ❌ NPCs sem city_id: ${semCityId.length}`);
    console.log(`   ✅ NPCs com coordenadas: ${comCoordenadas.length}`);
    console.log(`   ❌ NPCs sem coordenadas: ${semCoordenadas.length}`);
    
    // NPCs VÁLIDOS (com city_id E coordenadas)
    const npcsValidos = allNpcs.filter(npc => 
      npc.city_id !== null && 
      npc.position_lat !== null && 
      npc.position_lng !== null
    );
    
    console.log(`\n   🎯 NPCs VÁLIDOS (city_id + coordenadas): ${npcsValidos.length}`);
    
    if (npcsValidos.length === 0) {
      console.log('\n❌ PROBLEMA ENCONTRADO: NENHUM NPC VÁLIDO NO BANCO!');
      console.log('   Isso explica porque o backend pula todos os NPCs.\n');
      return;
    }
    
    console.log('\n📊 ETAPA 2: Análise dos NPCs Válidos\n');
    
    // Agrupar por país
    const porPais = {};
    npcsValidos.forEach(npc => {
      const pais = npc.country_id || 'DESCONHECIDO';
      if (!porPais[pais]) porPais[pais] = [];
      porPais[pais].push(npc);
    });
    
    console.log('   NPCs válidos por país:');
    Object.entries(porPais).forEach(([pais, npcs]) => {
      console.log(`   🌍 ${pais}: ${npcs.length} NPCs`);
    });
    
    console.log('\n📊 ETAPA 3: Exemplo de NPCs Válidos (primeiros 5)\n');
    
    npcsValidos.slice(0, 5).forEach((npc, index) => {
      console.log(`   NPC ${index + 1}:`);
      console.log(`      ID: ${npc.id}`);
      console.log(`      Nome: ${npc.name}`);
      console.log(`      País: ${npc.country_id}`);
      console.log(`      city_id: ${npc.city_id}`);
      console.log(`      city_name: ${npc.city_name}`);
      console.log(`      state_id: ${npc.state_id}`);
      console.log(`      state_name: ${npc.state_name}`);
      console.log(`      Lat: ${npc.position_lat}`);
      console.log(`      Lng: ${npc.position_lng}`);
      console.log(`      Tipo: ${npc.type}`);
      console.log(`      Ocupação: ${npc.occupation}`);
      console.log('');
    });
    
    console.log('📊 ETAPA 4: Verificação de Estrutura dos Dados\n');
    
    const primeiroNpc = npcsValidos[0];
    const campos = Object.keys(primeiroNpc);
    
    console.log('   Campos disponíveis no NPC:');
    campos.forEach(campo => {
      const valor = primeiroNpc[campo];
      const tipo = typeof valor;
      const temValor = valor !== null && valor !== undefined;
      console.log(`      ${temValor ? '✅' : '❌'} ${campo}: ${tipo} = ${valor}`);
    });
    
    console.log('\n📊 ETAPA 5: Simulação do Backend\n');
    
    // Simular o que o backend faz
    let processados = 0;
    let pulados = 0;
    
    npcsValidos.forEach(npc => {
      // Converter city_id para cityId (como o backend faz)
      const npcConvertido = {
        ...npc,
        cityId: npc.city_id,
        positionLat: npc.position_lat,
        positionLng: npc.position_lng,
      };
      
      // Verificar a condição do backend
      if (!npcConvertido.cityId && (!npcConvertido.positionLat || !npcConvertido.positionLng)) {
        pulados++;
      } else {
        processados++;
      }
    });
    
    console.log(`   Simulação da lógica do backend:`);
    console.log(`      ✅ NPCs que seriam processados: ${processados}`);
    console.log(`      ❌ NPCs que seriam pulados: ${pulados}`);
    
    if (processados > 0) {
      console.log('\n✅ DIAGNÓSTICO POSITIVO!');
      console.log('   Os dados no Supabase estão CORRETOS!');
      console.log(`   ${processados} NPCs deveriam aparecer no mapa.`);
      console.log('\n🔴 PROBLEMA: O backend NÃO está lendo esses dados!');
      console.log('   Possíveis causas:');
      console.log('   1. Cache do backend não foi atualizado');
      console.log('   2. npcRepository não está convertendo city_id -> cityId');
      console.log('   3. NPCs sendo carregados de uma fonte diferente');
      console.log('   4. Problema na query do Supabase no backend');
    } else {
      console.log('\n❌ PROBLEMA CONFIRMADO!');
      console.log('   Mesmo com city_id e coordenadas, os NPCs seriam pulados.');
      console.log('   A lógica do backend está INCORRETA!');
    }
    
    console.log('\n📊 ETAPA 6: Verificação do npcRepository\n');
    console.log('   Vou verificar como o backend busca os NPCs...\n');
    
    // Simular a query que o backend deveria fazer
    const { data: npcsBackend, error: errorBackend } = await supabase
      .from('npcs')
      .select(`
        id,
        name,
        type,
        occupation,
        country_id,
        city_id,
        city_name,
        state_id,
        state_name,
        position_lat,
        position_lng,
        health,
        energy,
        happiness,
        money,
        last_action_at
      `);
    
    if (errorBackend) {
      console.error('   ❌ Erro ao simular query do backend:', errorBackend);
    } else {
      console.log(`   ✅ Query do backend retornou: ${npcsBackend.length} NPCs`);
      
      const npcsBackendValidos = npcsBackend.filter(npc => 
        npc.city_id !== null && 
        npc.position_lat !== null && 
        npc.position_lng !== null
      );
      
      console.log(`   ✅ NPCs válidos na query do backend: ${npcsBackendValidos.length}`);
      
      if (npcsBackendValidos.length > 0) {
        console.log('\n   Exemplo de NPC como o backend deveria ver:');
        const exemplo = npcsBackendValidos[0];
        console.log(JSON.stringify(exemplo, null, 2));
      }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📋 RESUMO DO DIAGNÓSTICO                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log(`   Total de NPCs: ${allNpcs.length}`);
    console.log(`   NPCs válidos no Supabase: ${npcsValidos.length}`);
    console.log(`   NPCs que deveriam aparecer: ${processados}`);
    console.log(`   NPCs que o backend pula: ${pulados}`);
    
    if (processados > 0 && pulados === 0) {
      console.log('\n✅ CONCLUSÃO: Dados do Supabase estão PERFEITOS!');
      console.log('   O problema está 100% no BACKEND.');
      console.log('\n🎯 PRÓXIMA AÇÃO:');
      console.log('   Vou verificar o código do npcRepository e npcService');
      console.log('   para encontrar onde está o problema de leitura.');
    } else if (npcsValidos.length === 0) {
      console.log('\n❌ CONCLUSÃO: Dados do Supabase estão VAZIOS!');
      console.log('   Nenhum NPC tem city_id e coordenadas.');
      console.log('\n🎯 PRÓXIMA AÇÃO:');
      console.log('   Executar novamente o script fix-npc-coordinates.js');
    } else {
      console.log('\n⚠️  CONCLUSÃO: Problema MISTO!');
      console.log('   Alguns NPCs estão corretos, mas a lógica do backend');
      console.log('   está pulando NPCs que deveriam ser processados.');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

diagnosticar();

