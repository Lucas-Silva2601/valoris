import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🌍 RE-SEMEANDO NPCs ESPALHADOS PELO MUNDO              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Carregar GeoJSON dos países
const countriesGeoJSON = JSON.parse(
  fs.readFileSync(join(__dirname, '..', 'data', 'countries.geojson'), 'utf-8')
);

// Cores de pele variadas
const skinColors = [
  '#FFDAB9', '#F0D5BE', '#E8BEAC', '#D4A574', '#C68642',
  '#8D5524', '#6B4423', '#4A2511', '#3D1F14', '#2C1810'
];

// Cores de roupa variadas
const clothingColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#F77F00', '#06FFA5', '#118AB2', '#073B4C'
];

// Nomes aleatórios
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda',
  'Rafael', 'Camila', 'Diego', 'Beatriz', 'Felipe', 'Larissa', 'Gustavo',
  'John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William',
  'Li', 'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao',
  'Mohammed', 'Ahmed', 'Fatima', 'Aisha', 'Ali', 'Omar', 'Hassan'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Wei', 'Fang', 'Ling', 'Ming', 'Jing', 'Xin', 'Yun',
  'Khan', 'Ali', 'Hassan', 'Hussein', 'Rahman', 'Abdullah'
];

/**
 * ✅ CORREÇÃO: Gerar múltiplos pontos espalhados dentro de um país
 * Usa turf.randomPoint com bbox e valida CADA ponto individualmente
 */
function generateSpreadPositionsInCountry(countryFeature, quantity = 5) {
  const bbox = turf.bbox(countryFeature);
  const validPositions = [];
  
  console.log(`      🎲 Gerando ${quantity} posições aleatórias...`);
  
  // Tentar até 500 vezes para conseguir todos os pontos
  let attempts = 0;
  const maxAttempts = 500;
  
  while (validPositions.length < quantity && attempts < maxAttempts) {
    attempts++;
    
    // Gerar 1 ponto aleatório dentro do bbox
    const randomPoints = turf.randomPoint(1, { bbox });
    const point = randomPoints.features[0];
    
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se está dentro do polígono do país
    const isInside = turf.booleanPointInPolygon(point, countryFeature);
    
    if (!isInside) {
      continue; // Ponto caiu no mar ou fora do país, tentar novamente
    }
    
    const [lng, lat] = point.geometry.coordinates;
    
    // ✅ VALIDAÇÃO DE DISTÂNCIA: Garantir que não está muito perto de outro NPC
    let isFarEnough = true;
    for (const existingPos of validPositions) {
      const distance = turf.distance(
        turf.point([lng, lat]),
        turf.point([existingPos.lng, existingPos.lat]),
        { units: 'kilometers' }
      );
      
      if (distance < 100) { // Mínimo 100km de distância
        isFarEnough = false;
        break;
      }
    }
    
    if (!isFarEnough) {
      continue; // Muito perto de outro NPC, tentar novamente
    }
    
    // ✅ Ponto válido! Adicionar à lista
    validPositions.push({ lat, lng });
    console.log(`      ✓ Ponto ${validPositions.length}/${quantity} validado`);
  }
  
  // Se não conseguiu todos os pontos, preencher com centroides
  while (validPositions.length < quantity) {
    const centroid = turf.centroid(countryFeature);
    const [lng, lat] = centroid.geometry.coordinates;
    
    // Adicionar um pequeno offset aleatório para não ficarem exatamente no mesmo lugar
    const offsetLat = lat + (Math.random() - 0.5) * 2;
    const offsetLng = lng + (Math.random() - 0.5) * 2;
    
    validPositions.push({ lat: offsetLat, lng: offsetLng });
  }
  
  return validPositions;
}

async function reseedNPCs() {
  try {
    console.log('📊 ETAPA 1: Limpando NPCs existentes...\n');
    
    const { error: deleteError } = await supabase
      .from('npcs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos
    
    if (deleteError) {
      console.error('❌ Erro ao limpar NPCs:', deleteError);
      return;
    }
    
    console.log('   ✅ NPCs limpos\n');
    
    console.log('📊 ETAPA 2: Criando 5 NPCs por país...\n');
    
    let totalCriados = 0;
    let npcCounter = 1;
    
    for (const feature of countriesGeoJSON.features) {
      const countryId = feature.properties.ISO_A3;
      const countryName = feature.properties.NAME;
      
      if (!countryId || countryId === '-99') continue;
      
      console.log(`   🌍 ${countryName} (${countryId}):`);
      
      // ✅ Gerar TODAS as posições de uma vez, garantindo espalhamento
      const positions = generateSpreadPositionsInCountry(feature, 5);
      const npcsToCreate = [];
      
      // Criar NPCs com as posições validadas
      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        npcsToCreate.push({
          npc_id: `NPC-${countryId}-${npcCounter++}`,
          name: `${firstName} ${lastName}`,
          country_id: countryId,
          country_name: countryName,
          position_lat: position.lat,
          position_lng: position.lng,
          skin_color: skinColors[Math.floor(Math.random() * skinColors.length)],
          clothing_color: clothingColors[Math.floor(Math.random() * clothingColors.length)],
          status: 'walking',
          speed: 5.0 + Math.random() * 3.0, // 5-8 km/h
          routine_state: 'wandering'
        });
      }
      
      // Inserir NPCs no banco
      if (npcsToCreate.length > 0) {
        const { data, error } = await supabase
          .from('npcs')
          .insert(npcsToCreate)
          .select();
        
        if (error) {
          console.error(`      ❌ Erro: ${error.message}`);
        } else {
          console.log(`      ✅ ${data.length} NPCs criados e espalhados`);
          totalCriados += data.length;
        }
      }
    }
    
    console.log(`\n✅ Total de NPCs criados: ${totalCriados}\n`);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 NPCs RE-SEMEADOS COM SUCESSO!                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 CARACTERÍSTICAS DOS NPCs:\n');
    console.log('   • 5 NPCs por país (espalhados)');
    console.log('   • Distância mínima: 50km entre NPCs');
    console.log('   • Cores de pele variadas (10 tons)');
    console.log('   • Cores de roupa variadas (15 cores)');
    console.log('   • Velocidade: 5-8 km/h');
    console.log('   • Status: Caminhando\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

reseedNPCs();

