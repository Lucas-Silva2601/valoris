import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

// Load environment variables from the backend/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logger = createLogger('RepositionNPCs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cidades com coordenadas centrais para cada país
const citiesCoordinates = {
  'BRA': [
    { city_id: 'BRA-SP', name: 'São Paulo', lat: -23.5505, lng: -46.6333, country_id: 'BRA', state_id: 'BRA-SP' },
    { city_id: 'BRA-RJ', name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, country_id: 'BRA', state_id: 'BRA-RJ' }
  ],
  'USA': [
    { city_id: 'USA-NYC', name: 'New York', lat: 40.7128, lng: -74.0060, country_id: 'USA', state_id: 'USA-NY' },
    { city_id: 'USA-LA', name: 'Los Angeles', lat: 34.0522, lng: -118.2437, country_id: 'USA', state_id: 'USA-CA' }
  ],
  'JPN': [
    { city_id: 'JPN-TKY', name: 'Tokyo', lat: 35.6762, lng: 139.6503, country_id: 'JPN', state_id: 'JPN-13' },
    { city_id: 'JPN-OSA', name: 'Osaka', lat: 34.6937, lng: 135.5023, country_id: 'JPN', state_id: 'JPN-27' }
  ],
  'DEU': [
    { city_id: 'DEU-BER', name: 'Berlin', lat: 52.5200, lng: 13.4050, country_id: 'DEU', state_id: 'DEU-BE' },
    { city_id: 'DEU-MUC', name: 'Munich', lat: 48.1351, lng: 11.5820, country_id: 'DEU', state_id: 'DEU-BY' }
  ],
  'FRA': [
    { city_id: 'FRA-PAR', name: 'Paris', lat: 48.8566, lng: 2.3522, country_id: 'FRA', state_id: 'FRA-IDF' },
    { city_id: 'FRA-MAR', name: 'Marseille', lat: 43.2965, lng: 5.3698, country_id: 'FRA', state_id: 'FRA-PAC' }
  ],
  'GBR': [
    { city_id: 'GBR-LON', name: 'London', lat: 51.5074, lng: -0.1278, country_id: 'GBR', state_id: 'GBR-ENG' },
    { city_id: 'GBR-MAN', name: 'Manchester', lat: 53.4808, lng: -2.2426, country_id: 'GBR', state_id: 'GBR-ENG' }
  ],
  'CHN': [
    { city_id: 'CHN-BJS', name: 'Beijing', lat: 39.9042, lng: 116.4074, country_id: 'CHN', state_id: 'CHN-BJ' },
    { city_id: 'CHN-SHA', name: 'Shanghai', lat: 31.2304, lng: 121.4737, country_id: 'CHN', state_id: 'CHN-SH' }
  ],
  'IND': [
    { city_id: 'IND-DEL', name: 'Delhi', lat: 28.7041, lng: 77.1025, country_id: 'IND', state_id: 'IND-DL' },
    { city_id: 'IND-MUM', name: 'Mumbai', lat: 19.0760, lng: 72.8777, country_id: 'IND', state_id: 'IND-MH' }
  ]
};

// Função para gerar posição aleatória próxima de um ponto (raio de ~5km)
function generateRandomPosition(centerLat, centerLng) {
  const radius = 0.05; // ~5km de raio
  const randomLat = centerLat + (Math.random() - 0.5) * radius;
  const randomLng = centerLng + (Math.random() - 0.5) * radius;
  return { lat: randomLat, lng: randomLng };
}

async function repositionNPCs() {
  logger.info('\n╔════════════════════════════════════════════════════════════╗');
  logger.info('║                                                            ║');
  logger.info('║  🗺️  REPOSICIONANDO NPCs NAS CIDADES                     ║');
  logger.info('║                                                            ║');
  logger.info('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Buscar todos os NPCs
    const { data: npcs, error: fetchError } = await supabase
      .from('npcs')
      .select('id, country_id, position');

    if (fetchError) throw fetchError;

    logger.info(`📊 ${npcs.length} NPCs encontrados no banco\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // 2. Para cada NPC, atribuir uma cidade baseada no country_id
    for (const npc of npcs) {
      const countryId = npc.country_id;
      const cities = citiesCoordinates[countryId];

      if (!cities || cities.length === 0) {
        // País sem cidades definidas, pular
        skippedCount++;
        continue;
      }

      // Escolher cidade aleatória do país
      const city = cities[Math.floor(Math.random() * cities.length)];

      // Gerar posição aleatória próxima da cidade
      const newPosition = generateRandomPosition(city.lat, city.lng);

      // Atualizar NPC
      const { error: updateError } = await supabase
        .from('npcs')
        .update({
          city_id: city.city_id,
          city_name: city.name,
          state_id: city.state_id,
          state_name: city.state_id, // Placeholder
          position: newPosition
        })
        .eq('id', npc.id);

      if (updateError) {
        logger.error(`❌ Erro ao atualizar NPC ${npc.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          logger.info(`   ✅ ${updatedCount} NPCs atualizados...`);
        }
      }
    }

    logger.info(`\n📊 Resumo Final:`);
    logger.info(`   ✅ ${updatedCount} NPCs reposicionados`);
    logger.info(`   ⏭️  ${skippedCount} NPCs pulados (países sem cidades)`);

    logger.info('\n╔════════════════════════════════════════════════════════════╗');
    logger.info('║                                                            ║');
    logger.info('║  ✅ REPOSICIONAMENTO CONCLUÍDO!                          ║');
    logger.info('║                                                            ║');
    logger.info('╚════════════════════════════════════════════════════════════╝\n');

    logger.info('🎯 Próximos passos:');
    logger.info('   1. Reinicie o backend (npm run dev)');
    logger.info('   2. Recarregue o navegador (Ctrl+Shift+R)');
    logger.info('   3. NPCs devem aparecer nas cidades! 🎉\n');
  } catch (error) {
    logger.error('❌ Erro ao reposicionar NPCs:', error);
    process.exit(1);
  }
}

repositionNPCs();

