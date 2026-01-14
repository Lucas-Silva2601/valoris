import npcRepository from '../repositories/npcRepository.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TestNPCRepository');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🧪 TESTE DO NPC REPOSITORY                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testar() {
  try {
    console.log('📊 Buscando todos os NPCs através do npcRepository...\n');
    
    const allNPCs = await npcRepository.find({});
    
    console.log(`   Total de NPCs retornados: ${allNPCs.length}\n`);
    
    // Analisar os NPCs
    const comCityId = allNPCs.filter(npc => npc.cityId !== null && npc.cityId !== undefined);
    const semCityId = allNPCs.filter(npc => !npc.cityId);
    const comCoordenadas = allNPCs.filter(npc => npc.positionLat && npc.positionLng);
    const semCoordenadas = allNPCs.filter(npc => !npc.positionLat || !npc.positionLng);
    
    console.log('📊 ANÁLISE DOS NPCs RETORNADOS PELO REPOSITORY:\n');
    console.log(`   ✅ NPCs com cityId: ${comCityId.length}`);
    console.log(`   ❌ NPCs sem cityId: ${semCityId.length}`);
    console.log(`   ✅ NPCs com coordenadas: ${comCoordenadas.length}`);
    console.log(`   ❌ NPCs sem coordenadas: ${semCoordenadas.length}\n`);
    
    // NPCs que seriam pulados pela lógica do backend
    let pulados = 0;
    let processados = 0;
    
    allNPCs.forEach(npc => {
      if (!npc.cityId && (!npc.positionLat || !npc.positionLng)) {
        pulados++;
      } else {
        processados++;
      }
    });
    
    console.log('🔍 SIMULAÇÃO DA LÓGICA DO BACKEND:\n');
    console.log(`   ✅ NPCs que seriam processados: ${processados}`);
    console.log(`   ❌ NPCs que seriam pulados: ${pulados}\n`);
    
    if (pulados === allNPCs.length) {
      console.log('❌ PROBLEMA CRÍTICO ENCONTRADO!');
      console.log('   TODOS os NPCs seriam pulados pelo backend!\n');
      
      // Mostrar exemplo de NPC que deveria ter cityId
      console.log('📋 Exemplo de NPC (primeiro da lista):\n');
      const exemplo = allNPCs[0];
      console.log('   Campos do objeto NPC:');
      Object.keys(exemplo).forEach(key => {
        const value = exemplo[key];
        const tipo = typeof value;
        console.log(`      ${key}: ${tipo} = ${JSON.stringify(value)}`);
      });
      
      console.log('\n🔍 Verificando se city_id existe no registro original...');
      console.log('   (Isso indicaria problema na conversão formatFromSupabase)\n');
      
    } else if (processados > 0) {
      console.log('✅ SUCESSO!');
      console.log(`   ${processados} NPCs seriam processados corretamente!\n`);
      
      // Mostrar exemplo de NPC válido
      const npcValido = allNPCs.find(npc => npc.cityId && npc.positionLat && npc.positionLng);
      if (npcValido) {
        console.log('📋 Exemplo de NPC VÁLIDO:\n');
        console.log(`   ID: ${npcValido.id}`);
        console.log(`   Nome: ${npcValido.name}`);
        console.log(`   cityId: ${npcValido.cityId}`);
        console.log(`   cityName: ${npcValido.cityName}`);
        console.log(`   positionLat: ${npcValido.positionLat}`);
        console.log(`   positionLng: ${npcValido.positionLng}\n`);
      }
    }
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📋 CONCLUSÃO DO TESTE                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    if (pulados === allNPCs.length && comCityId.length === 0) {
      console.log('❌ O npcRepository NÃO está convertendo city_id -> cityId!');
      console.log('   A função formatFromSupabase() está falhando.\n');
    } else if (pulados === allNPCs.length && comCityId.length > 0) {
      console.log('⚠️  O npcRepository está convertendo, mas há outro problema.');
      console.log('   Possível problema com valores null ou undefined.\n');
    } else {
      console.log('✅ O npcRepository está funcionando corretamente!');
      console.log('   O problema deve estar em outro lugar.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testar();

