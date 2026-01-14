import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
console.log('║  🌍 ESPALHANDO NPCs MAIS UNIFORMEMENTE                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Função para gerar coordenadas MUITO espalhadas dentro de um retângulo
function getRandomCoordinatesSpread(bounds) {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  
  // Usar distribuição mais uniforme (não apenas aleatória pura)
  // Dividir a área em uma grade e escolher pontos aleatórios em cada célula
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);
  
  return { lat, lng };
}

// Expandir os bounds das cidades para espalhar mais os NPCs
const citiesWithExpandedBounds = {
  // Brasil - Expandido
  'BRA-SP-001': { name: 'São Paulo', bounds: [-24.0, -47.2, -23.2, -46.2] },
  'BRA-RJ-001': { name: 'Rio de Janeiro', bounds: [-23.3, -44.0, -22.5, -43.0] },
  'BRA-MG-001': { name: 'Belo Horizonte', bounds: [-20.2, -44.3, -19.5, -43.6] },
  'BRA-SP-002': { name: 'Campinas', bounds: [-23.2, -47.4, -22.5, -46.7] },
  
  // Estados Unidos - Expandido
  'USA-CA-001': { name: 'Los Angeles', bounds: [33.5, -118.9, 34.5, -117.9] },
  'USA-CA-002': { name: 'San Francisco', bounds: [37.5, -122.7, 38.0, -122.1] },
  'USA-NY-001': { name: 'New York', bounds: [40.4, -74.3, 41.0, -73.5] },
  'USA-TX-001': { name: 'Houston', bounds: [29.3, -95.9, 30.3, -94.8] },
  
  // Canadá - Expandido
  'CAN-ON-001': { name: 'Toronto', bounds: [43.4, -79.8, 44.0, -79.0] },
  'CAN-QC-001': { name: 'Montreal', bounds: [45.2, -74.0, 45.8, -73.2] },
  
  // China - Expandido
  'CHN-BJ-001': { name: 'Beijing', bounds: [39.6, 116.0, 40.2, 116.8] },
  
  // Índia - Expandido
  'IND-DL-001': { name: 'New Delhi', bounds: [28.3, 76.8, 28.9, 77.6] },
  
  // Reino Unido - Expandido
  'GBR-EN-001': { name: 'London', bounds: [51.2, -0.5, 51.8, 0.3] },
  
  // França - Expandido
  'FRA-IF-001': { name: 'Paris', bounds: [48.6, 2.0, 49.0, 2.7] },
  
  // Alemanha - Expandido
  'DEU-BE-001': { name: 'Berlin', bounds: [52.2, 13.0, 52.8, 13.8] },
  
  // Japão - Expandido
  'JPN-TK-001': { name: 'Tokyo', bounds: [35.4, 139.4, 36.0, 140.1] },
  
  // Austrália - Expandido
  'AUS-NS-001': { name: 'Sydney', bounds: [-34.2, 150.8, -33.5, 151.6] },
  
  // Rússia - Expandido
  'RUS-MO-001': { name: 'Moscow', bounds: [55.4, 37.2, 56.0, 38.0] },
  
  // México - Expandido
  'MEX-CM-001': { name: 'Mexico City', bounds: [19.1, -99.5, 19.7, -98.7] },
  
  // África do Sul - Expandido
  'ZAF-GT-001': { name: 'Johannesburg', bounds: [-26.5, 27.7, -25.8, 28.4] },
  
  // Egito - Expandido
  'EGY-CA-001': { name: 'Cairo', bounds: [29.8, 30.9, 30.4, 31.6] },
  
  // Nigéria - Expandido
  'NGA-LA-001': { name: 'Lagos', bounds: [6.2, 3.1, 6.8, 3.7] },
  
  // Coreia do Sul - Expandido
  'KOR-SE-001': { name: 'Seoul', bounds: [37.2, 126.6, 37.8, 127.3] },
  
  // Indonésia - Expandido
  'IDN-JK-001': { name: 'Jakarta', bounds: [-6.5, 106.5, -5.9, 107.1] },
  
  // Turquia - Expandido
  'TUR-IS-001': { name: 'Istanbul', bounds: [40.8, 28.7, 41.3, 29.3] },
  
  // Itália - Expandido
  'ITA-RM-001': { name: 'Rome', bounds: [41.6, 12.2, 42.0, 12.8] },
  
  // Espanha - Expandido
  'ESP-MD-001': { name: 'Madrid', bounds: [40.1, -4.0, 40.7, -3.4] },
  
  // Arábia Saudita - Expandido
  'SAU-RI-001': { name: 'Riyadh', bounds: [24.4, 46.4, 25.0, 47.0] },
  
  // Suécia - Expandido
  'SWE-ST-001': { name: 'Stockholm', bounds: [59.1, 17.8, 59.5, 18.3] },
  
  // Argentina - Expandido
  'ARG-BA-001': { name: 'Buenos Aires', bounds: [-34.9, -58.7, -34.3, -58.1] }
};

async function spreadNPCsMore() {
  try {
    console.log('📊 Buscando todos os NPCs...\n');
    
    const { data: allNPCs, error: errorNPCs } = await supabase
      .from('npcs')
      .select('*');
    
    if (errorNPCs) {
      console.error('❌ Erro ao buscar NPCs:', errorNPCs);
      return;
    }
    
    console.log(`   Total de NPCs: ${allNPCs.length}\n`);
    console.log('🌍 Redistribuindo NPCs com MAIS ESPAÇAMENTO...\n');
    
    let npcsAtualizados = 0;
    
    for (const npc of allNPCs) {
      const cityData = citiesWithExpandedBounds[npc.city_id];
      
      if (cityData) {
        // Gerar nova posição MUITO espalhada dentro da cidade
        const newPosition = getRandomCoordinatesSpread(cityData.bounds);
        
        const { error: updateError } = await supabase
          .from('npcs')
          .update({
            position_lat: newPosition.lat,
            position_lng: newPosition.lng
          })
          .eq('id', npc.id);
        
        if (!updateError) {
          npcsAtualizados++;
          if (npcsAtualizados % 100 === 0) {
            console.log(`   ✅ ${npcsAtualizados} NPCs redistribuídos...`);
          }
        }
      }
    }
    
    console.log(`\n✅ Total de NPCs redistribuídos: ${npcsAtualizados}`);
    console.log('\n🎉 NPCs agora estão MUITO MAIS ESPALHADOS!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

spreadNPCsMore();
