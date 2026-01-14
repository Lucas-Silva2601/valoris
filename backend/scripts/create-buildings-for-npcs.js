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
console.log('║  🏢 CRIANDO EDIFÍCIOS PARA OS NPCs                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Função para gerar coordenadas dentro de bounds
function getRandomCoordinates(bounds) {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);
  return { lat, lng };
}

// Cidades com bounds
const citiesWithBounds = {
  'BRA-SP-001': { name: 'São Paulo', country: 'BRA', bounds: [-24.0, -47.2, -23.2, -46.2] },
  'BRA-RJ-001': { name: 'Rio de Janeiro', country: 'BRA', bounds: [-23.3, -44.0, -22.5, -43.0] },
  'BRA-MG-001': { name: 'Belo Horizonte', country: 'BRA', bounds: [-20.2, -44.3, -19.5, -43.6] },
  'BRA-SP-002': { name: 'Campinas', country: 'BRA', bounds: [-23.2, -47.4, -22.5, -46.7] },
  'USA-CA-001': { name: 'Los Angeles', country: 'USA', bounds: [33.5, -118.9, 34.5, -117.9] },
  'USA-CA-002': { name: 'San Francisco', country: 'USA', bounds: [37.5, -122.7, 38.0, -122.1] },
  'USA-NY-001': { name: 'New York', country: 'USA', bounds: [40.4, -74.3, 41.0, -73.5] },
  'USA-TX-001': { name: 'Houston', country: 'USA', bounds: [29.3, -95.9, 30.3, -94.8] },
  'CAN-ON-001': { name: 'Toronto', country: 'CAN', bounds: [43.4, -79.8, 44.0, -79.0] },
  'CAN-QC-001': { name: 'Montreal', country: 'CAN', bounds: [45.2, -74.0, 45.8, -73.2] },
  'CHN-BJ-001': { name: 'Beijing', country: 'CHN', bounds: [39.6, 116.0, 40.2, 116.8] },
  'IND-DL-001': { name: 'New Delhi', country: 'IND', bounds: [28.3, 76.8, 28.9, 77.6] },
  'GBR-EN-001': { name: 'London', country: 'GBR', bounds: [51.2, -0.5, 51.8, 0.3] },
  'FRA-IF-001': { name: 'Paris', country: 'FRA', bounds: [48.6, 2.0, 49.0, 2.7] },
  'DEU-BE-001': { name: 'Berlin', country: 'DEU', bounds: [52.2, 13.0, 52.8, 13.8] },
  'JPN-TK-001': { name: 'Tokyo', country: 'JPN', bounds: [35.4, 139.4, 36.0, 140.1] },
  'AUS-NS-001': { name: 'Sydney', country: 'AUS', bounds: [-34.2, 150.8, -33.5, 151.6] },
  'RUS-MO-001': { name: 'Moscow', country: 'RUS', bounds: [55.4, 37.2, 56.0, 38.0] },
  'MEX-CM-001': { name: 'Mexico City', country: 'MEX', bounds: [19.1, -99.5, 19.7, -98.7] },
  'ZAF-GT-001': { name: 'Johannesburg', country: 'ZAF', bounds: [-26.5, 27.7, -25.8, 28.4] },
  'EGY-CA-001': { name: 'Cairo', country: 'EGY', bounds: [29.8, 30.9, 30.4, 31.6] },
  'NGA-LA-001': { name: 'Lagos', country: 'NGA', bounds: [6.2, 3.1, 6.8, 3.7] },
  'KOR-SE-001': { name: 'Seoul', country: 'KOR', bounds: [37.2, 126.6, 37.8, 127.3] },
  'IDN-JK-001': { name: 'Jakarta', country: 'IDN', bounds: [-6.5, 106.5, -5.9, 107.1] },
  'TUR-IS-001': { name: 'Istanbul', country: 'TUR', bounds: [40.8, 28.7, 41.3, 29.3] },
  'ITA-RM-001': { name: 'Rome', country: 'ITA', bounds: [41.6, 12.2, 42.0, 12.8] },
  'ESP-MD-001': { name: 'Madrid', country: 'ESP', bounds: [40.1, -4.0, 40.7, -3.4] },
  'SAU-RI-001': { name: 'Riyadh', country: 'SAU', bounds: [24.4, 46.4, 25.0, 47.0] },
  'SWE-ST-001': { name: 'Stockholm', country: 'SWE', bounds: [59.1, 17.8, 59.5, 18.3] },
  'ARG-BA-001': { name: 'Buenos Aires', country: 'ARG', bounds: [-34.9, -58.7, -34.3, -58.1] }
};

async function createBuildings() {
  try {
    console.log('📊 Criando edifícios em cada cidade...\n');
    
    let totalCriados = 0;
    let buildingCounter = 1;
    
    for (const [cityId, cityData] of Object.entries(citiesWithBounds)) {
      console.log(`   🏙️  ${cityData.name}:`);
      
      // Criar 10 casas e 10 locais de trabalho por cidade
      const buildings = [];
      
      // 10 casas/apartamentos
      for (let i = 0; i < 10; i++) {
        const pos = getRandomCoordinates(cityData.bounds);
        buildings.push({
          building_id: `BLD-${cityId}-H${buildingCounter++}`,
          name: `Casa ${i + 1} - ${cityData.name}`,
          type: i % 2 === 0 ? 'house' : 'apartment',
          country_id: cityData.country,
          city_id: cityId,
          city_name: cityData.name,
          position_lat: pos.lat,
          position_lng: pos.lng,
          level: 1
        });
      }
      
      // 10 locais de trabalho
      const workTypes = ['office', 'factory', 'shop'];
      for (let i = 0; i < 10; i++) {
        const pos = getRandomCoordinates(cityData.bounds);
        const workType = workTypes[i % workTypes.length];
        buildings.push({
          building_id: `BLD-${cityId}-W${buildingCounter++}`,
          name: `${workType} ${i + 1} - ${cityData.name}`,
          type: workType,
          country_id: cityData.country,
          city_id: cityId,
          city_name: cityData.name,
          position_lat: pos.lat,
          position_lng: pos.lng,
          level: 1
        });
      }
      
      // Inserir edifícios
      const { data, error } = await supabase
        .from('buildings')
        .insert(buildings)
        .select();
      
      if (error) {
        console.error(`      ❌ Erro: ${error.message}`);
      } else {
        console.log(`      ✅ ${data.length} edifícios criados`);
        totalCriados += data.length;
      }
    }
    
    console.log(`\n✅ Total de edifícios criados: ${totalCriados}\n`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 EDIFÍCIOS CRIADOS COM SUCESSO!                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createBuildings();

