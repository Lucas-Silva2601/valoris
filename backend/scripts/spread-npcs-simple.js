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
console.log('║  🌍 ESPALHANDO NPCs PELO MAPA (SIMPLES)                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Bounding boxes aproximados das cidades (lat/lng)
const cityBounds = {
  // Brasil
  'BRA-SP-001': { name: 'São Paulo', minLat: -23.7, maxLat: -23.4, minLng: -46.8, maxLng: -46.4 },
  'BRA-RJ-001': { name: 'Rio de Janeiro', minLat: -23.1, maxLat: -22.7, minLng: -43.8, maxLng: -43.1 },
  'BRA-MG-001': { name: 'Belo Horizonte', minLat: -20.0, maxLat: -19.7, minLng: -44.1, maxLng: -43.8 },
  'BRA-SP-002': { name: 'Campinas', minLat: -23.0, maxLat: -22.7, minLng: -47.2, maxLng: -46.9 },
  
  // EUA
  'USA-CA-001': { name: 'Los Angeles', minLat: 33.7, maxLat: 34.3, minLng: -118.7, maxLng: -118.1 },
  'USA-CA-002': { name: 'San Francisco', minLat: 37.7, maxLat: 37.8, minLng: -122.5, maxLng: -122.4 },
  'USA-NY-001': { name: 'New York', minLat: 40.6, maxLat: 40.9, minLng: -74.1, maxLng: -73.9 },
  'USA-TX-001': { name: 'Houston', minLat: 29.6, maxLat: 30.0, minLng: -95.7, maxLng: -95.1 },
  
  // Canadá
  'CAN-ON-001': { name: 'Toronto', minLat: 43.6, maxLat: 43.8, minLng: -79.5, maxLng: -79.3 },
  'CAN-QC-001': { name: 'Montreal', minLat: 45.4, maxLat: 45.6, minLng: -73.7, maxLng: -73.5 },
  
  // China
  'CHN-001': { name: 'Beijing', minLat: 39.8, maxLat: 40.0, minLng: 116.2, maxLng: 116.6 },
  
  // Índia
  'IND-001': { name: 'New Delhi', minLat: 28.5, maxLat: 28.7, minLng: 77.1, maxLng: 77.3 },
  
  // Reino Unido
  'GBR-001': { name: 'London', minLat: 51.4, maxLat: 51.6, minLng: -0.2, maxLng: 0.1 },
  
  // França
  'FRA-001': { name: 'Paris', minLat: 48.8, maxLat: 48.9, minLng: 2.2, maxLng: 2.5 },
  
  // Alemanha
  'DEU-001': { name: 'Berlin', minLat: 52.4, maxLat: 52.6, minLng: 13.3, maxLng: 13.5 },
  
  // Japão
  'JPN-001': { name: 'Tokyo', minLat: 35.6, maxLat: 35.7, minLng: 139.6, maxLng: 139.8 },
  
  // Austrália
  'AUS-001': { name: 'Sydney', minLat: -33.9, maxLat: -33.8, minLng: 151.1, maxLng: 151.3 },
  
  // Rússia
  'RUS-001': { name: 'Moscow', minLat: 55.6, maxLat: 55.8, minLng: 37.5, maxLng: 37.7 },
  
  // México
  'MEX-001': { name: 'Mexico City', minLat: 19.3, maxLat: 19.5, minLng: -99.2, maxLng: -99.0 },
  
  // África do Sul
  'ZAF-001': { name: 'Johannesburg', minLat: -26.3, maxLat: -26.1, minLng: 27.9, maxLng: 28.1 },
  
  // Argentina
  'ARG-001': { name: 'Buenos Aires', minLat: -34.7, maxLat: -34.5, minLng: -58.5, maxLng: -58.3 }
};

function generateRandomPoint(bounds) {
  const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
  const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
  return { lat, lng };
}

async function spreadNPCs() {
  try {
    console.log('📊 Buscando NPCs com city_id...\n');

    const { data: npcs, error: npcsError } = await supabase
      .from('npcs')
      .select('*')
      .not('city_id', 'is', null);

    if (npcsError) {
      throw npcsError;
    }

    console.log(`   ✅ ${npcs.length} NPCs encontrados\n`);
    console.log('🔄 Espalhando NPCs pelas cidades...\n');

    let updated = 0;
    let skipped = 0;

    for (const npc of npcs) {
      const bounds = cityBounds[npc.city_id];
      
      if (!bounds) {
        console.log(`   ⚠️  Cidade ${npc.city_id} não tem bounds definidos, pulando ${npc.name}`);
        skipped++;
        continue;
      }

      // Gerar posição aleatória dentro dos bounds
      const newPosition = generateRandomPoint(bounds);

      // Atualizar NPC
      const { error: updateError } = await supabase
        .from('npcs')
        .update({
          position_lat: newPosition.lat,
          position_lng: newPosition.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', npc.id);

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar ${npc.name}:`, updateError.message);
        skipped++;
      } else {
        updated++;
        if (updated % 50 === 0) {
          console.log(`   ✅ ${updated} NPCs espalhados...`);
        }
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📋 RESUMO                                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`   ✅ NPCs espalhados: ${updated}`);
    console.log(`   ⚠️  NPCs pulados: ${skipped}`);
    console.log(`   📊 Total: ${npcs.length}\n`);

    if (updated > 0) {
      console.log('🎉 NPCs espalhados com sucesso!');
      console.log('   Agora eles estão distribuídos de forma mais realista.\n');
      console.log('🔄 Os NPCs aparecerão espalhados no mapa em alguns segundos.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

spreadNPCs();

