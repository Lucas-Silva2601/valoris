import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as turf from '@turf/turf';

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
console.log('║  🌍 REDISTRIBUINDO NPCs PELO MAPA                        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

/**
 * Gerar ponto aleatório dentro de um polígono (cidade)
 */
function generateRandomPointInPolygon(geometry) {
  try {
    if (!geometry || !geometry.coordinates) {
      return null;
    }

    // Obter bounding box do polígono
    const bbox = turf.bbox(geometry);
    const [minLng, minLat, maxLng, maxLat] = bbox;

    // Tentar gerar ponto dentro do polígono (máximo 50 tentativas)
    for (let i = 0; i < 50; i++) {
      const randomLat = minLat + Math.random() * (maxLat - minLat);
      const randomLng = minLng + Math.random() * (maxLng - minLng);
      const point = turf.point([randomLng, randomLat]);

      if (turf.booleanPointInPolygon(point, geometry)) {
        return { lat: randomLat, lng: randomLng };
      }
    }

    // Se não conseguir, usar o centroide
    const centroid = turf.centroid(geometry);
    return {
      lat: centroid.geometry.coordinates[1],
      lng: centroid.geometry.coordinates[0]
    };
  } catch (error) {
    console.error('Erro ao gerar ponto aleatório:', error.message);
    return null;
  }
}

async function redistributeNPCs() {
  try {
    console.log('📊 Buscando NPCs com city_id...\n');

    // Buscar NPCs que têm city_id
    const { data: npcsWithCity, error: npcsError } = await supabase
      .from('npcs')
      .select('*')
      .not('city_id', 'is', null);

    if (npcsError) {
      throw npcsError;
    }

    console.log(`   ✅ ${npcsWithCity.length} NPCs encontrados com city_id\n`);

    if (npcsWithCity.length === 0) {
      console.log('⚠️  Nenhum NPC com city_id encontrado. Execute primeiro populate-geographic-data.js\n');
      return;
    }

    // Buscar geometrias das cidades
    console.log('📊 Buscando geometrias das cidades...\n');
    
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*');

    if (citiesError) {
      throw citiesError;
    }

    console.log(`   ✅ ${cities.length} cidades encontradas\n`);

    // Criar mapa de city_id -> geometry
    const cityGeometries = {};
    cities.forEach(city => {
      if (city.geometry) {
        cityGeometries[city.city_id] = city.geometry;
      }
    });

    console.log('🔄 Redistribuindo NPCs...\n');

    let updated = 0;
    let failed = 0;

    for (const npc of npcsWithCity) {
      try {
        const cityGeometry = cityGeometries[npc.city_id];
        
        if (!cityGeometry) {
          console.log(`   ⚠️  Cidade ${npc.city_id} não tem geometria, pulando NPC ${npc.name}`);
          failed++;
          continue;
        }

        // Gerar nova posição aleatória dentro da cidade
        const newPosition = generateRandomPointInPolygon(cityGeometry);

        if (!newPosition) {
          console.log(`   ⚠️  Não foi possível gerar posição para NPC ${npc.name} em ${npc.city_id}`);
          failed++;
          continue;
        }

        // Atualizar posição do NPC
        const { error: updateError } = await supabase
          .from('npcs')
          .update({
            position_lat: newPosition.lat,
            position_lng: newPosition.lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', npc.id);

        if (updateError) {
          console.log(`   ❌ Erro ao atualizar NPC ${npc.name}:`, updateError.message);
          failed++;
        } else {
          updated++;
          if (updated % 50 === 0) {
            console.log(`   ✅ ${updated} NPCs redistribuídos...`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro ao processar NPC ${npc.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📋 RESUMO DA REDISTRIBUIÇÃO                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`   ✅ NPCs redistribuídos: ${updated}`);
    console.log(`   ❌ NPCs com falha: ${failed}`);
    console.log(`   📊 Total processado: ${npcsWithCity.length}\n`);

    if (updated > 0) {
      console.log('🎉 NPCs redistribuídos com sucesso!');
      console.log('   Agora eles estão espalhados de forma mais realista pelas cidades.\n');
      console.log('🔄 Reinicie o backend para ver as mudanças no mapa.\n');
    }

  } catch (error) {
    console.error('❌ Erro durante redistribuição:', error);
  }
}

redistributeNPCs();

