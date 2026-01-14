/**
 * ═══════════════════════════════════════════════════════════
 * 🔧 CORRIGIR COORDENADAS DOS NPCs
 * Atualizar position_lat e position_lng baseado no city_id
 * ═══════════════════════════════════════════════════════════
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Coordenadas das cidades (centro aproximado)
const CITY_COORDINATES = {
  'BRA-SP-001': { lat: -23.5505, lng: -46.6333, radius: 0.5 }, // São Paulo
  'BRA-SP-002': { lat: -22.9099, lng: -47.0626, radius: 0.3 }, // Campinas
  'BRA-RJ-001': { lat: -22.9068, lng: -43.1729, radius: 0.4 }, // Rio de Janeiro
  'BRA-MG-001': { lat: -19.9167, lng: -43.9345, radius: 0.4 }, // Belo Horizonte
  'USA-CA-001': { lat: 34.0522, lng: -118.2437, radius: 0.5 }, // Los Angeles
  'USA-CA-002': { lat: 37.7749, lng: -122.4194, radius: 0.3 }, // San Francisco
  'USA-NY-001': { lat: 40.7128, lng: -74.0060, radius: 0.4 }, // New York City
  'USA-TX-001': { lat: 29.7604, lng: -95.3698, radius: 0.5 }, // Houston
  'CAN-ON-001': { lat: 43.6532, lng: -79.3832, radius: 0.4 }, // Toronto
  'CAN-QC-001': { lat: 45.5017, lng: -73.5673, radius: 0.4 }, // Montreal
  'CHN-001': { lat: 39.9042, lng: 116.4074, radius: 0.5 }, // Beijing
  'IND-001': { lat: 28.6139, lng: 77.2090, radius: 0.5 }, // New Delhi
  'GBR-001': { lat: 51.5074, lng: -0.1278, radius: 0.4 }, // London
  'FRA-001': { lat: 48.8566, lng: 2.3522, radius: 0.3 }, // Paris
  'DEU-001': { lat: 52.5200, lng: 13.4050, radius: 0.4 }, // Berlin
  'JPN-001': { lat: 35.6762, lng: 139.6503, radius: 0.5 }, // Tokyo
  'AUS-001': { lat: -33.8688, lng: 151.2093, radius: 0.5 }, // Sydney
  'RUS-001': { lat: 55.7558, lng: 37.6173, radius: 0.5 }, // Moscow
  'MEX-001': { lat: 19.4326, lng: -99.1332, radius: 0.5 }, // Mexico City
  'ARG-001': { lat: -34.6037, lng: -58.3816, radius: 0.4 }, // Buenos Aires
  'ZAF-001': { lat: -26.2041, lng: 28.0473, radius: 0.4 }, // Johannesburg
  'EGY-001': { lat: 30.0444, lng: 31.2357, radius: 0.4 }, // Cairo
  'TUR-001': { lat: 41.0082, lng: 28.9784, radius: 0.4 }, // Istanbul
  'SAU-001': { lat: 24.7136, lng: 46.6753, radius: 0.5 }, // Riyadh
  'KOR-001': { lat: 37.5665, lng: 126.9780, radius: 0.4 }, // Seoul
  'ITA-001': { lat: 41.9028, lng: 12.4964, radius: 0.3 }, // Rome
  'ESP-001': { lat: 40.4168, lng: -3.7038, radius: 0.4 }, // Madrid
  'NLD-001': { lat: 52.3676, lng: 4.9041, radius: 0.2 }, // Amsterdam
  'SWE-001': { lat: 59.3293, lng: 18.0686, radius: 0.3 }, // Stockholm
  'POL-001': { lat: 52.2297, lng: 21.0122, radius: 0.4 }  // Warsaw
};

// Gerar coordenada aleatória dentro de um raio da cidade
function getRandomCoordinateInCity(cityId) {
  const city = CITY_COORDINATES[cityId];
  if (!city) {
    return null;
  }

  // Gerar offset aleatório dentro do raio
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * city.radius;
  
  const lat = city.lat + (distance * Math.cos(angle));
  const lng = city.lng + (distance * Math.sin(angle));

  return { lat, lng };
}

async function fixNPCCoordinates() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  🔧 CORRIGINDO COORDENADAS DOS NPCs                       ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Buscar todos os NPCs com city_id
    const { data: npcs, error: fetchError } = await supabase
      .from('npcs')
      .select('id, npc_id, name, city_id, city_name, position_lat, position_lng')
      .not('city_id', 'is', null);

    if (fetchError) {
      console.error('❌ Erro ao buscar NPCs:', fetchError);
      return;
    }

    console.log(`📊 Encontrados ${npcs.length} NPCs com city_id`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const npc of npcs) {
      try {
        const coords = getRandomCoordinateInCity(npc.city_id);

        if (!coords) {
          console.log(`   ⚠️  NPC ${npc.npc_id} - cidade ${npc.city_id} não tem coordenadas cadastradas`);
          skipped++;
          continue;
        }

        // Atualizar coordenadas
        const { error: updateError } = await supabase
          .from('npcs')
          .update({
            position_lat: coords.lat,
            position_lng: coords.lng
          })
          .eq('id', npc.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar NPC ${npc.npc_id}:`, updateError.message);
          errors++;
        } else {
          if (updated < 10 || updated % 100 === 0) {
            console.log(`   ✅ NPC ${npc.npc_id} → ${npc.city_name} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
          }
          updated++;
        }
      } catch (error) {
        console.error(`   ❌ Erro ao processar NPC ${npc.npc_id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Resumo: ${updated} atualizados, ${skipped} pulados, ${errors} erros`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║  ✅ COORDENADAS CORRIGIDAS COM SUCESSO!                   ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Reinicie o backend (Ctrl+C e npm run dev)');
    console.log('   2. Recarregue o navegador (Ctrl+Shift+R)');
    console.log('   3. Clique em Brasil ou USA no mapa');
    console.log('   4. Os NPCs devem aparecer! 🎉\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir coordenadas:', error);
  }
}

fixNPCCoordinates().then(() => process.exit(0));

