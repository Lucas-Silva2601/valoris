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
console.log('║  🌍 SEED GLOBAL - ESPALHAMENTO REAL POR TODO O MUNDO    ║');
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
  '#E63946', '#F77F00', '#06FFA5', '#118AB2', '#073B4C',
  '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'
];

// Nomes aleatórios
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda',
  'Rafael', 'Camila', 'Diego', 'Beatriz', 'Felipe', 'Larissa', 'Gustavo',
  'John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William',
  'Li', 'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao',
  'Mohammed', 'Ahmed', 'Fatima', 'Aisha', 'Ali', 'Omar', 'Hassan',
  'Ivan', 'Olga', 'Dmitri', 'Natasha', 'Sergei', 'Elena', 'Boris'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Wei', 'Fang', 'Ling', 'Ming', 'Jing', 'Xin', 'Yun',
  'Khan', 'Ali', 'Hassan', 'Hussein', 'Rahman', 'Abdullah',
  'Ivanov', 'Petrov', 'Sidorov', 'Volkov', 'Sokolov', 'Popov'
];

/**
 * ✅ PASSO 2: Sorteio por BBox com validação de polígono
 * Esta é a ÚNICA forma correta de espalhar NPCs por todo o território
 */
function generateValidPointInCountry(countryFeature) {
  // Obter BBox (caixa delimitadora) do país
  const bbox = turf.bbox(countryFeature);
  
  // Tentar até 200 vezes encontrar um ponto válido
  for (let attempt = 0; attempt < 200; attempt++) {
    // Gerar 1 ponto aleatório dentro do BBox
    const randomPoints = turf.randomPoint(1, { bbox });
    const point = randomPoints.features[0];
    
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se está DENTRO do polígono do país
    const isInside = turf.booleanPointInPolygon(point, countryFeature);
    
    if (isInside) {
      // Ponto válido! Está dentro das fronteiras
      const [lng, lat] = point.geometry.coordinates;
      return { lat, lng };
    }
    
    // Se não está dentro, continuar tentando
  }
  
  // Se após 200 tentativas não conseguiu, usar centroide como fallback
  console.log(`      ⚠️  Usando centroide como fallback`);
  const centroid = turf.centroid(countryFeature);
  const [lng, lat] = centroid.geometry.coordinates;
  return { lat, lng };
}

/**
 * ✅ PASSO 3: Gerar múltiplos NPCs espalhados por um país
 */
function generateNPCsForCountry(countryFeature, quantity) {
  const positions = [];
  
  for (let i = 0; i < quantity; i++) {
    const position = generateValidPointInCountry(countryFeature);
    positions.push(position);
    console.log(`      ✓ NPC ${i + 1}/${quantity}: [${position.lat.toFixed(2)}, ${position.lng.toFixed(2)}]`);
  }
  
  return positions;
}

async function reseedGlobalNPCs() {
  try {
    // ✅ PASSO 1: LIMPEZA TOTAL (Reset)
    console.log('🗑️  ETAPA 1: LIMPEZA TOTAL - Deletando todos os NPCs existentes...\n');
    
    const { error: deleteError } = await supabase
      .from('npcs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos
    
    if (deleteError) {
      console.error('❌ Erro ao limpar NPCs:', deleteError);
      return;
    }
    
    console.log('   ✅ Banco de dados limpo! Começando do zero.\n');
    
    // ✅ PASSO 3: DENSIDADE GLOBAL - 3 a 5 NPCs por país
    console.log('🌍 ETAPA 2: CRIANDO NPCs EM TODOS OS PAÍSES DO MUNDO...\n');
    
    let totalCriados = 0;
    let npcCounter = 1;
    let paisesProcessados = 0;
    
    for (const feature of countriesGeoJSON.features) {
      const countryId = feature.properties.ISO_A3;
      const countryName = feature.properties.NAME;
      
      // Pular países inválidos
      if (!countryId || countryId === '-99' || countryId === 'null') continue;
      
      paisesProcessados++;
      console.log(`   🌍 ${paisesProcessados}. ${countryName} (${countryId}):`);
      
      // Quantidade aleatória entre 3 e 5 NPCs por país
      const quantity = 3 + Math.floor(Math.random() * 3); // 3, 4 ou 5
      
      // Gerar posições espalhadas
      const positions = generateNPCsForCountry(feature, quantity);
      
      // Criar NPCs
      const npcsToCreate = [];
      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        npcsToCreate.push({
          npc_id: `NPC-${countryId}-${String(npcCounter).padStart(4, '0')}`,
          name: `${firstName} ${lastName}`,
          country_id: countryId,
          country_name: countryName,
          position_lat: position.lat,
          position_lng: position.lng,
          skin_color: skinColors[Math.floor(Math.random() * skinColors.length)],
          clothing_color: clothingColors[Math.floor(Math.random() * clothingColors.length)],
          status: 'walking',
          speed: 5.0 + Math.random() * 5.0, // 5-10 km/h
          routine_state: 'wandering'
        });
        
        npcCounter++;
      }
      
      // Inserir NPCs no banco
      const { data, error } = await supabase
        .from('npcs')
        .insert(npcsToCreate)
        .select();
      
      if (error) {
        console.error(`      ❌ Erro: ${error.message}`);
      } else {
        console.log(`      ✅ ${data.length} NPCs criados e espalhados\n`);
        totalCriados += data.length;
      }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 SEED GLOBAL CONCLUÍDO COM SUCESSO!                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 ESTATÍSTICAS FINAIS:\n`);
    console.log(`   • Total de países processados: ${paisesProcessados}`);
    console.log(`   • Total de NPCs criados: ${totalCriados}`);
    console.log(`   • Média de NPCs por país: ${(totalCriados / paisesProcessados).toFixed(1)}`);
    console.log(`   • Cobertura: MUNDO TODO 🌍\n`);
    
    console.log('📋 CARACTERÍSTICAS:\n');
    console.log('   • Espalhamento: turf.randomPoint + turf.booleanPointInPolygon');
    console.log('   • Validação: Cada ponto dentro das fronteiras');
    console.log('   • Densidade: 3-5 NPCs por país');
    console.log('   • Cores: 10 tons de pele + 20 cores de roupa');
    console.log('   • Velocidade: 5-10 km/h\n');
    
    console.log('🚀 PRÓXIMOS PASSOS:\n');
    console.log('   1. Reinicie o backend (Ctrl+C + npm run dev)');
    console.log('   2. Recarregue o navegador (Ctrl+Shift+R)');
    console.log('   3. Veja NPCs espalhados por TODO O MUNDO! 🌍\n');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

reseedGlobalNPCs();

