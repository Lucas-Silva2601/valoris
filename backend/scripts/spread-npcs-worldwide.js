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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🌍 ESPALHANDO NPCs PELO MUNDO                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Função para gerar coordenadas aleatórias dentro de um retângulo (bounds)
function getRandomCoordinatesInBounds(bounds) {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);
  return { lat, lng };
}

// Cidades existentes com seus bounds aproximados
const citiesWithBounds = {
  // Brasil
  'BRA-SP-001': { name: 'São Paulo', bounds: [-23.7, -46.8, -23.4, -46.4] },
  'BRA-RJ-001': { name: 'Rio de Janeiro', bounds: [-23.1, -43.8, -22.7, -43.1] },
  'BRA-MG-001': { name: 'Belo Horizonte', bounds: [-20.0, -44.1, -19.7, -43.8] },
  'BRA-SP-002': { name: 'Campinas', bounds: [-23.0, -47.2, -22.7, -46.9] },
  
  // Estados Unidos
  'USA-CA-001': { name: 'Los Angeles', bounds: [33.7, -118.7, 34.3, -118.1] },
  'USA-CA-002': { name: 'San Francisco', bounds: [37.7, -122.5, 37.8, -122.3] },
  'USA-NY-001': { name: 'New York', bounds: [40.6, -74.1, 40.9, -73.7] },
  'USA-TX-001': { name: 'Houston', bounds: [29.5, -95.7, 30.1, -95.0] },
  
  // Canadá
  'CAN-ON-001': { name: 'Toronto', bounds: [43.6, -79.6, 43.8, -79.1] },
  'CAN-QC-001': { name: 'Montreal', bounds: [45.4, -73.8, 45.6, -73.4] },
  
  // China
  'CHN-BJ-001': { name: 'Beijing', bounds: [39.8, 116.2, 40.0, 116.6] },
  
  // Índia
  'IND-DL-001': { name: 'New Delhi', bounds: [28.5, 77.0, 28.7, 77.4] },
  
  // Reino Unido
  'GBR-EN-001': { name: 'London', bounds: [51.4, -0.3, 51.6, 0.1] },
  
  // França
  'FRA-IF-001': { name: 'Paris', bounds: [48.8, 2.2, 48.9, 2.5] },
  
  // Alemanha
  'DEU-BE-001': { name: 'Berlin', bounds: [52.4, 13.2, 52.6, 13.6] },
  
  // Japão
  'JPN-TK-001': { name: 'Tokyo', bounds: [35.6, 139.6, 35.8, 139.9] },
  
  // Austrália
  'AUS-NS-001': { name: 'Sydney', bounds: [-34.0, 151.0, -33.7, 151.4] },
  
  // Rússia
  'RUS-MO-001': { name: 'Moscow', bounds: [55.6, 37.4, 55.9, 37.8] },
  
  // México
  'MEX-CM-001': { name: 'Mexico City', bounds: [19.3, -99.3, 19.5, -98.9] },
  
  // África do Sul
  'ZAF-GT-001': { name: 'Johannesburg', bounds: [-26.3, 27.9, -26.0, 28.2] },
  
  // Egito
  'EGY-CA-001': { name: 'Cairo', bounds: [30.0, 31.1, 30.2, 31.4] },
  
  // Nigéria
  'NGA-LA-001': { name: 'Lagos', bounds: [6.4, 3.3, 6.6, 3.5] },
  
  // Coreia do Sul
  'KOR-SE-001': { name: 'Seoul', bounds: [37.4, 126.8, 37.6, 127.1] },
  
  // Indonésia
  'IDN-JK-001': { name: 'Jakarta', bounds: [-6.3, 106.7, -6.1, 106.9] },
  
  // Turquia
  'TUR-IS-001': { name: 'Istanbul', bounds: [41.0, 28.9, 41.1, 29.1] },
  
  // Itália
  'ITA-RM-001': { name: 'Rome', bounds: [41.8, 12.4, 41.9, 12.6] },
  
  // Espanha
  'ESP-MD-001': { name: 'Madrid', bounds: [40.3, -3.8, 40.5, -3.6] },
  
  // Arábia Saudita
  'SAU-RI-001': { name: 'Riyadh', bounds: [24.6, 46.6, 24.8, 46.8] },
  
  // Suécia
  'SWE-ST-001': { name: 'Stockholm', bounds: [59.3, 18.0, 59.4, 18.1] },
  
  // Argentina
  'ARG-BA-001': { name: 'Buenos Aires', bounds: [-34.7, -58.5, -34.5, -58.3] }
};

async function spreadNPCs() {
  try {
    console.log('📊 ETAPA 1: Buscando todos os NPCs\n');
    
    const { data: allNPCs, error: errorNPCs } = await supabase
      .from('npcs')
      .select('*');
    
    if (errorNPCs) {
      console.error('❌ Erro ao buscar NPCs:', errorNPCs);
      return;
    }
    
    console.log(`   Total de NPCs: ${allNPCs.length}\n`);
    
    // Separar NPCs por status
    const npcsComCidade = allNPCs.filter(npc => npc.city_id);
    const npcsSemCidade = allNPCs.filter(npc => !npc.city_id);
    
    console.log(`   ✅ NPCs com cidade: ${npcsComCidade.length}`);
    console.log(`   ❌ NPCs sem cidade: ${npcsSemCidade.length}\n`);
    
    console.log('📊 ETAPA 2: Redistribuindo NPCs com cidade\n');
    
    let npcsAtualizados = 0;
    const cityIds = Object.keys(citiesWithBounds);
    
    // Redistribuir NPCs que já têm cidade para coordenadas aleatórias dentro da cidade
    for (const npc of npcsComCidade) {
      const cityData = citiesWithBounds[npc.city_id];
      
      if (cityData) {
        // Gerar nova posição aleatória dentro da cidade
        const newPosition = getRandomCoordinatesInBounds(cityData.bounds);
        
        const { error: updateError } = await supabase
          .from('npcs')
          .update({
            position_lat: newPosition.lat,
            position_lng: newPosition.lng
          })
          .eq('id', npc.id);
        
        if (!updateError) {
          npcsAtualizados++;
          if (npcsAtualizados % 50 === 0) {
            console.log(`   ✅ ${npcsAtualizados} NPCs redistribuídos...`);
          }
        }
      }
    }
    
    console.log(`\n   ✅ Total de NPCs redistribuídos: ${npcsAtualizados}\n`);
    
    console.log('📊 ETAPA 3: Atribuindo cidades aos NPCs sem cidade\n');
    
    let npcsAtribuidos = 0;
    
    // Distribuir NPCs sem cidade uniformemente entre as cidades disponíveis
    for (let i = 0; i < npcsSemCidade.length; i++) {
      const npc = npcsSemCidade[i];
      
      // Escolher cidade de forma rotativa para distribuição uniforme
      const cityId = cityIds[i % cityIds.length];
      const cityData = citiesWithBounds[cityId];
      
      // Gerar posição aleatória dentro da cidade
      const newPosition = getRandomCoordinatesInBounds(cityData.bounds);
      
      // Extrair country_id e state_id do city_id
      const [countryId, stateId] = cityId.split('-');
      
      const { error: updateError } = await supabase
        .from('npcs')
        .update({
          city_id: cityId,
          city_name: cityData.name,
          state_id: `${countryId}-${stateId}`,
          position_lat: newPosition.lat,
          position_lng: newPosition.lng
        })
        .eq('id', npc.id);
      
      if (!updateError) {
        npcsAtribuidos++;
        if (npcsAtribuidos % 50 === 0) {
          console.log(`   ✅ ${npcsAtribuidos} NPCs atribuídos a cidades...`);
        }
      }
    }
    
    console.log(`\n   ✅ Total de NPCs atribuídos a cidades: ${npcsAtribuidos}\n`);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📋 RESUMO FINAL                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log(`   Total de NPCs: ${allNPCs.length}`);
    console.log(`   NPCs redistribuídos: ${npcsAtualizados}`);
    console.log(`   NPCs atribuídos a novas cidades: ${npcsAtribuidos}`);
    console.log(`   Total de NPCs processados: ${npcsAtualizados + npcsAtribuidos}`);
    
    // Mostrar distribuição por cidade
    console.log('\n📊 DISTRIBUIÇÃO POR CIDADE:\n');
    
    const { data: finalNPCs } = await supabase
      .from('npcs')
      .select('city_id, city_name');
    
    const distribuicao = {};
    finalNPCs.forEach(npc => {
      if (npc.city_id) {
        distribuicao[npc.city_name] = (distribuicao[npc.city_name] || 0) + 1;
      }
    });
    
    Object.entries(distribuicao)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cidade, count]) => {
        console.log(`   ${cidade}: ${count} NPCs`);
      });
    
    console.log('\n✅ NPCS ESPALHADOS COM SUCESSO PELO MUNDO!\n');
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

spreadNPCs();

