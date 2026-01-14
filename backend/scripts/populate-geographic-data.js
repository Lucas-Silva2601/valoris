/**
 * ═══════════════════════════════════════════════════════════
 * 🗺️ POPULAR DADOS GEOGRÁFICOS (States, Cities, NPCs)
 * ═══════════════════════════════════════════════════════════
 * 
 * Este script popula:
 * 1. Estados (states) - dados simplificados dos principais países
 * 2. Cidades (cities) - principais cidades de cada estado
 * 3. Atribui city_id aos NPCs baseado em proximidade geográfica
 * 
 * ═══════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import * as turf from '@turf/turf';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente (tenta múltiplos locais)
dotenv.config(); // Tenta ./env
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Tenta root
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Tenta backend

// Debug: Verificar se as variáveis foram carregadas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE_KEY ||
                    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('╔════════════════════════════════════════════════════════════╗');
  console.error('║                                                            ║');
  console.error('║  ❌ ERRO: VARIÁVEIS DE AMBIENTE NÃO ENCONTRADAS          ║');
  console.error('║                                                            ║');
  console.error('╚════════════════════════════════════════════════════════════╝\n');
  console.error('📋 Configure as variáveis de ambiente:');
  console.error('   SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=sua-chave-service-role\n');
  console.error('💡 Crie um arquivo .env no root do projeto ou configure no sistema.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ═══════════════════════════════════════════════════════════
 * 📊 DADOS GEOGRÁFICOS SIMPLIFICADOS
 * ═══════════════════════════════════════════════════════════
 */

// Estados principais dos países (com geometria simplificada)
const STATES_DATA = [
  // 🇧🇷 Brasil
  {
    state_id: 'BRA-SP',
    name: 'São Paulo',
    code: 'SP',
    country_id: 'BRA',
    country_name: 'Brazil',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-53.0, -25.0], [-44.0, -25.0], [-44.0, -20.0], [-53.0, -20.0], [-53.0, -25.0]
      ]]
    }
  },
  {
    state_id: 'BRA-RJ',
    name: 'Rio de Janeiro',
    code: 'RJ',
    country_id: 'BRA',
    country_name: 'Brazil',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-45.0, -23.5], [-41.0, -23.5], [-41.0, -20.5], [-45.0, -20.5], [-45.0, -23.5]
      ]]
    }
  },
  {
    state_id: 'BRA-MG',
    name: 'Minas Gerais',
    code: 'MG',
    country_id: 'BRA',
    country_name: 'Brazil',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-51.0, -23.0], [-40.0, -23.0], [-40.0, -14.0], [-51.0, -14.0], [-51.0, -23.0]
      ]]
    }
  },
  
  // 🇺🇸 Estados Unidos
  {
    state_id: 'USA-CA',
    name: 'California',
    code: 'CA',
    country_id: 'USA',
    country_name: 'United States',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-124.4, 32.5], [-114.1, 32.5], [-114.1, 42.0], [-124.4, 42.0], [-124.4, 32.5]
      ]]
    }
  },
  {
    state_id: 'USA-NY',
    name: 'New York',
    code: 'NY',
    country_id: 'USA',
    country_name: 'United States',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.8, 40.5], [-71.9, 40.5], [-71.9, 45.0], [-79.8, 45.0], [-79.8, 40.5]
      ]]
    }
  },
  {
    state_id: 'USA-TX',
    name: 'Texas',
    code: 'TX',
    country_id: 'USA',
    country_name: 'United States',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-106.6, 25.8], [-93.5, 25.8], [-93.5, 36.5], [-106.6, 36.5], [-106.6, 25.8]
      ]]
    }
  },

  // 🇨🇦 Canadá
  {
    state_id: 'CAN-ON',
    name: 'Ontario',
    code: 'ON',
    country_id: 'CAN',
    country_name: 'Canada',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-95.2, 41.7], [-74.3, 41.7], [-74.3, 56.9], [-95.2, 56.9], [-95.2, 41.7]
      ]]
    }
  },
  {
    state_id: 'CAN-QC',
    name: 'Quebec',
    code: 'QC',
    country_id: 'CAN',
    country_name: 'Canada',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.8, 45.0], [-57.1, 45.0], [-57.1, 62.6], [-79.8, 62.6], [-79.8, 45.0]
      ]]
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // 🌍 OUTROS PAÍSES (Estados genéricos)
  // ═══════════════════════════════════════════════════════════
  { state_id: 'CHN-01', name: 'Beijing', code: 'BJ', country_id: 'CHN', country_name: 'China', geometry: { type: 'Point', coordinates: [116.4074, 39.9042] } },
  { state_id: 'IND-01', name: 'Delhi', code: 'DL', country_id: 'IND', country_name: 'India', geometry: { type: 'Point', coordinates: [77.2090, 28.6139] } },
  { state_id: 'GBR-01', name: 'England', code: 'EN', country_id: 'GBR', country_name: 'United Kingdom', geometry: { type: 'Point', coordinates: [-0.1278, 51.5074] } },
  { state_id: 'FRA-01', name: 'Île-de-France', code: 'IF', country_id: 'FRA', country_name: 'France', geometry: { type: 'Point', coordinates: [2.3522, 48.8566] } },
  { state_id: 'DEU-01', name: 'Berlin', code: 'BE', country_id: 'DEU', country_name: 'Germany', geometry: { type: 'Point', coordinates: [13.4050, 52.5200] } },
  { state_id: 'JPN-01', name: 'Tokyo', code: 'TK', country_id: 'JPN', country_name: 'Japan', geometry: { type: 'Point', coordinates: [139.6503, 35.6762] } },
  { state_id: 'AUS-01', name: 'New South Wales', code: 'NSW', country_id: 'AUS', country_name: 'Australia', geometry: { type: 'Point', coordinates: [151.2093, -33.8688] } },
  { state_id: 'RUS-01', name: 'Moscow', code: 'MOW', country_id: 'RUS', country_name: 'Russia', geometry: { type: 'Point', coordinates: [37.6173, 55.7558] } },
  { state_id: 'MEX-01', name: 'Mexico City', code: 'CMX', country_id: 'MEX', country_name: 'Mexico', geometry: { type: 'Point', coordinates: [-99.1332, 19.4326] } },
  { state_id: 'ARG-01', name: 'Buenos Aires', code: 'BA', country_id: 'ARG', country_name: 'Argentina', geometry: { type: 'Point', coordinates: [-58.3816, -34.6037] } },
  { state_id: 'ZAF-01', name: 'Gauteng', code: 'GT', country_id: 'ZAF', country_name: 'South Africa', geometry: { type: 'Point', coordinates: [28.0473, -26.2041] } },
  { state_id: 'EGY-01', name: 'Cairo', code: 'C', country_id: 'EGY', country_name: 'Egypt', geometry: { type: 'Point', coordinates: [31.2357, 30.0444] } },
  { state_id: 'TUR-01', name: 'Istanbul', code: 'IST', country_id: 'TUR', country_name: 'Turkey', geometry: { type: 'Point', coordinates: [28.9784, 41.0082] } },
  { state_id: 'SAU-01', name: 'Riyadh', code: 'RI', country_id: 'SAU', country_name: 'Saudi Arabia', geometry: { type: 'Point', coordinates: [46.6753, 24.7136] } },
  { state_id: 'KOR-01', name: 'Seoul', code: 'SE', country_id: 'KOR', country_name: 'South Korea', geometry: { type: 'Point', coordinates: [126.9780, 37.5665] } },
  { state_id: 'ITA-01', name: 'Lazio', code: 'LZ', country_id: 'ITA', country_name: 'Italy', geometry: { type: 'Point', coordinates: [12.4964, 41.9028] } },
  { state_id: 'ESP-01', name: 'Madrid', code: 'MD', country_id: 'ESP', country_name: 'Spain', geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] } },
  { state_id: 'NLD-01', name: 'North Holland', code: 'NH', country_id: 'NLD', country_name: 'Netherlands', geometry: { type: 'Point', coordinates: [4.9041, 52.3676] } },
  { state_id: 'SWE-01', name: 'Stockholm', code: 'ST', country_id: 'SWE', country_name: 'Sweden', geometry: { type: 'Point', coordinates: [18.0686, 59.3293] } },
  { state_id: 'POL-01', name: 'Masovian', code: 'MZ', country_id: 'POL', country_name: 'Poland', geometry: { type: 'Point', coordinates: [21.0122, 52.2297] } }
];

// Cidades principais (com coordenadas reais)
const CITIES_DATA = [
  // ═══════════════════════════════════════════════════════════
  // 🇧🇷 BRAZIL
  // ═══════════════════════════════════════════════════════════
  { city_id: 'BRA-SP-001', name: 'São Paulo', state_id: 'BRA-SP', state_name: 'São Paulo', country_id: 'BRA', country_name: 'Brazil', lat: -23.5505, lng: -46.6333, population: 12325232, land_value: 5000 },
  { city_id: 'BRA-SP-002', name: 'Campinas', state_id: 'BRA-SP', state_name: 'São Paulo', country_id: 'BRA', country_name: 'Brazil', lat: -22.9099, lng: -47.0626, population: 1213792, land_value: 3000 },
  { city_id: 'BRA-RJ-001', name: 'Rio de Janeiro', state_id: 'BRA-RJ', state_name: 'Rio de Janeiro', country_id: 'BRA', country_name: 'Brazil', lat: -22.9068, lng: -43.1729, population: 6747815, land_value: 4500 },
  { city_id: 'BRA-MG-001', name: 'Belo Horizonte', state_id: 'BRA-MG', state_name: 'Minas Gerais', country_id: 'BRA', country_name: 'Brazil', lat: -19.9167, lng: -43.9345, population: 2521564, land_value: 3500 },
  
  // ═══════════════════════════════════════════════════════════
  // 🇺🇸 UNITED STATES
  // ═══════════════════════════════════════════════════════════
  { city_id: 'USA-CA-001', name: 'Los Angeles', state_id: 'USA-CA', state_name: 'California', country_id: 'USA', country_name: 'United States', lat: 34.0522, lng: -118.2437, population: 3979576, land_value: 8000 },
  { city_id: 'USA-CA-002', name: 'San Francisco', state_id: 'USA-CA', state_name: 'California', country_id: 'USA', country_name: 'United States', lat: 37.7749, lng: -122.4194, population: 873965, land_value: 10000 },
  { city_id: 'USA-NY-001', name: 'New York City', state_id: 'USA-NY', state_name: 'New York', country_id: 'USA', country_name: 'United States', lat: 40.7128, lng: -74.0060, population: 8336817, land_value: 12000 },
  { city_id: 'USA-TX-001', name: 'Houston', state_id: 'USA-TX', state_name: 'Texas', country_id: 'USA', country_name: 'United States', lat: 29.7604, lng: -95.3698, population: 2325502, land_value: 4000 },
  
  // ═══════════════════════════════════════════════════════════
  // 🇨🇦 CANADA
  // ═══════════════════════════════════════════════════════════
  { city_id: 'CAN-ON-001', name: 'Toronto', state_id: 'CAN-ON', state_name: 'Ontario', country_id: 'CAN', country_name: 'Canada', lat: 43.6532, lng: -79.3832, population: 2731571, land_value: 7000 },
  { city_id: 'CAN-QC-001', name: 'Montreal', state_id: 'CAN-QC', state_name: 'Quebec', country_id: 'CAN', country_name: 'Canada', lat: 45.5017, lng: -73.5673, population: 1704694, land_value: 6000 },
  
  // ═══════════════════════════════════════════════════════════
  // 🌍 OUTROS PAÍSES (para cobrir todos os NPCs)
  // ═══════════════════════════════════════════════════════════
  // Cidades globais - 1 por país onde há NPCs
  { city_id: 'CHN-001', name: 'Beijing', state_id: 'CHN-01', state_name: 'Beijing', country_id: 'CHN', country_name: 'China', lat: 39.9042, lng: 116.4074, population: 21540000, land_value: 6000 },
  { city_id: 'IND-001', name: 'New Delhi', state_id: 'IND-01', state_name: 'Delhi', country_id: 'IND', country_name: 'India', lat: 28.6139, lng: 77.2090, population: 32900000, land_value: 3000 },
  { city_id: 'GBR-001', name: 'London', state_id: 'GBR-01', state_name: 'England', country_id: 'GBR', country_name: 'United Kingdom', lat: 51.5074, lng: -0.1278, population: 9000000, land_value: 12000 },
  { city_id: 'FRA-001', name: 'Paris', state_id: 'FRA-01', state_name: 'Île-de-France', country_id: 'FRA', country_name: 'France', lat: 48.8566, lng: 2.3522, population: 2160000, land_value: 10000 },
  { city_id: 'DEU-001', name: 'Berlin', state_id: 'DEU-01', state_name: 'Berlin', country_id: 'DEU', country_name: 'Germany', lat: 52.5200, lng: 13.4050, population: 3650000, land_value: 8000 },
  { city_id: 'JPN-001', name: 'Tokyo', state_id: 'JPN-01', state_name: 'Tokyo', country_id: 'JPN', country_name: 'Japan', lat: 35.6762, lng: 139.6503, population: 13960000, land_value: 15000 },
  { city_id: 'AUS-001', name: 'Sydney', state_id: 'AUS-01', state_name: 'New South Wales', country_id: 'AUS', country_name: 'Australia', lat: -33.8688, lng: 151.2093, population: 5300000, land_value: 9000 },
  { city_id: 'RUS-001', name: 'Moscow', state_id: 'RUS-01', state_name: 'Moscow', country_id: 'RUS', country_name: 'Russia', lat: 55.7558, lng: 37.6173, population: 12500000, land_value: 5000 },
  { city_id: 'MEX-001', name: 'Mexico City', state_id: 'MEX-01', state_name: 'Mexico City', country_id: 'MEX', country_name: 'Mexico', lat: 19.4326, lng: -99.1332, population: 21800000, land_value: 3500 },
  { city_id: 'ARG-001', name: 'Buenos Aires', state_id: 'ARG-01', state_name: 'Buenos Aires', country_id: 'ARG', country_name: 'Argentina', lat: -34.6037, lng: -58.3816, population: 3100000, land_value: 4000 },
  { city_id: 'ZAF-001', name: 'Johannesburg', state_id: 'ZAF-01', state_name: 'Gauteng', country_id: 'ZAF', country_name: 'South Africa', lat: -26.2041, lng: 28.0473, population: 5600000, land_value: 3500 },
  { city_id: 'EGY-001', name: 'Cairo', state_id: 'EGY-01', state_name: 'Cairo', country_id: 'EGY', country_name: 'Egypt', lat: 30.0444, lng: 31.2357, population: 20900000, land_value: 2500 },
  { city_id: 'TUR-001', name: 'Istanbul', state_id: 'TUR-01', state_name: 'Istanbul', country_id: 'TUR', country_name: 'Turkey', lat: 41.0082, lng: 28.9784, population: 15500000, land_value: 4500 },
  { city_id: 'SAU-001', name: 'Riyadh', state_id: 'SAU-01', state_name: 'Riyadh', country_id: 'SAU', country_name: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, population: 7600000, land_value: 5000 },
  { city_id: 'KOR-001', name: 'Seoul', state_id: 'KOR-01', state_name: 'Seoul', country_id: 'KOR', country_name: 'South Korea', lat: 37.5665, lng: 126.9780, population: 9700000, land_value: 10000 },
  { city_id: 'ITA-001', name: 'Rome', state_id: 'ITA-01', state_name: 'Lazio', country_id: 'ITA', country_name: 'Italy', lat: 41.9028, lng: 12.4964, population: 2800000, land_value: 9000 },
  { city_id: 'ESP-001', name: 'Madrid', state_id: 'ESP-01', state_name: 'Madrid', country_id: 'ESP', country_name: 'Spain', lat: 40.4168, lng: -3.7038, population: 3200000, land_value: 7000 },
  { city_id: 'NLD-001', name: 'Amsterdam', state_id: 'NLD-01', state_name: 'North Holland', country_id: 'NLD', country_name: 'Netherlands', lat: 52.3676, lng: 4.9041, population: 870000, land_value: 11000 },
  { city_id: 'SWE-001', name: 'Stockholm', state_id: 'SWE-01', state_name: 'Stockholm', country_id: 'SWE', country_name: 'Sweden', lat: 59.3293, lng: 18.0686, population: 975000, land_value: 9000 },
  { city_id: 'POL-001', name: 'Warsaw', state_id: 'POL-01', state_name: 'Masovian', country_id: 'POL', country_name: 'Poland', lat: 52.2297, lng: 21.0122, population: 1790000, land_value: 5000 }
];

/**
 * ═══════════════════════════════════════════════════════════
 * 🔧 FUNÇÕES AUXILIARES
 * ═══════════════════════════════════════════════════════════
 */

// Encontrar cidade mais próxima de um ponto
function findNearestCity(lat, lng, cities) {
  let nearestCity = null;
  let minDistance = Infinity;

  for (const city of cities) {
    const distance = turf.distance(
      turf.point([lng, lat]),
      turf.point([city.lng, city.lat]),
      { units: 'kilometers' }
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return { city: nearestCity, distance: minDistance };
}

/**
 * ═══════════════════════════════════════════════════════════
 * 📥 1. POPULAR ESTADOS
 * ═══════════════════════════════════════════════════════════
 */
async function populateStates() {
  console.log('\n🗺️  Populando estados...');
  
  let inserted = 0;
  let errors = 0;

  for (const state of STATES_DATA) {
    try {
      const { data, error } = await supabase
        .from('states')
        .insert({
          state_id: state.state_id,
          name: state.name,
          code: state.code,
          country_id: state.country_id,
          country_name: state.country_name,
          geometry: JSON.stringify(state.geometry),
          treasury_balance: 0
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Estado ${state.name} já existe`);
        } else {
          throw error;
        }
      } else {
        console.log(`   ✅ Estado inserido: ${state.name} (${state.state_id})`);
        inserted++;
      }
    } catch (error) {
      console.error(`   ❌ Erro ao inserir ${state.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Resumo Estados: ${inserted} inseridos, ${errors} erros`);
}

/**
 * ═══════════════════════════════════════════════════════════
 * 🏙️  2. POPULAR CIDADES
 * ═══════════════════════════════════════════════════════════
 */
async function populateCities() {
  console.log('\n🏙️  Populando cidades...');
  
  let inserted = 0;
  let errors = 0;

  for (const city of CITIES_DATA) {
    try {
      // Criar geometria de ponto para a cidade
      const geometry = {
        type: 'Point',
        coordinates: [city.lng, city.lat]
      };

      const { data, error } = await supabase
        .from('cities')
        .insert({
          city_id: city.city_id,
          name: city.name,
          state_id: city.state_id,
          state_name: city.state_name,
          country_id: city.country_id,
          country_name: city.country_name,
          geometry: JSON.stringify(geometry),
          land_value: city.land_value,
          population: city.population,
          treasury_balance: 0
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Cidade ${city.name} já existe`);
        } else {
          throw error;
        }
      } else {
        console.log(`   ✅ Cidade inserida: ${city.name} (${city.city_id})`);
        inserted++;
      }
    } catch (error) {
      console.error(`   ❌ Erro ao inserir ${city.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Resumo Cidades: ${inserted} inseridos, ${errors} erros`);
}

/**
 * ═══════════════════════════════════════════════════════════
 * 👥 3. ATRIBUIR CITY_ID AOS NPCs (BASEADO NO PAÍS)
 * ═══════════════════════════════════════════════════════════
 */
async function assignCityToNPCs() {
  console.log('\n👥 Atribuindo city_id aos NPCs (baseado no país)...');
  
  // Buscar todos os NPCs sem city_id
  const { data: npcs, error: fetchError } = await supabase
    .from('npcs')
    .select('id, npc_id, country_id');

  if (fetchError) {
    console.error('❌ Erro ao buscar NPCs:', fetchError);
    return;
  }

  console.log(`📊 Encontrados ${npcs.length} NPCs`);

  let updated = 0;
  let skipped = 0;

  // Agrupar cidades por país para busca rápida
  const citiesByCountry = {};
  for (const city of CITIES_DATA) {
    if (!citiesByCountry[city.country_id]) {
      citiesByCountry[city.country_id] = [];
    }
    citiesByCountry[city.country_id].push(city);
  }

  for (const npc of npcs) {
    try {
      // Encontrar cidades do mesmo país
      const citiesInCountry = citiesByCountry[npc.country_id];
      
      if (!citiesInCountry || citiesInCountry.length === 0) {
        console.log(`   ⚠️  NPC ${npc.npc_id} - país ${npc.country_id} não tem cidades cadastradas`);
        skipped++;
        continue;
      }

      // Atribuir cidade aleatória do país
      const randomCity = citiesInCountry[Math.floor(Math.random() * citiesInCountry.length)];

      const { error: updateError } = await supabase
        .from('npcs')
        .update({
          city_id: randomCity.city_id,
          city_name: randomCity.name,
          state_id: randomCity.state_id,
          state_name: randomCity.state_name
        })
        .eq('id', npc.id);

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar NPC ${npc.npc_id}:`, updateError.message);
        skipped++;
      } else {
        if (updated < 10 || updated % 100 === 0) {
          console.log(`   ✅ NPC ${npc.npc_id} → ${randomCity.name} (${npc.country_id})`);
        }
        updated++;
      }
    } catch (error) {
      console.error(`   ❌ Erro ao processar NPC ${npc.npc_id}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n📊 Resumo NPCs: ${updated} atualizados, ${skipped} pulados`);
}

/**
 * ═══════════════════════════════════════════════════════════
 * 🚀 EXECUTAR SCRIPT
 * ═══════════════════════════════════════════════════════════
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  🗺️  POPULANDO DADOS GEOGRÁFICOS                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // 1. Popular Estados
    await populateStates();

    // 2. Popular Cidades
    await populateCities();

    // 3. Atribuir city_id aos NPCs
    await assignCityToNPCs();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║  ✅ POPULAÇÃO DE DADOS CONCLUÍDA COM SUCESSO!            ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n🎯 Próximos passos:');
    console.log('   1. Reinicie o backend (npm run dev)');
    console.log('   2. Recarregue o navegador (Ctrl+Shift+R)');
    console.log('   3. Clique em um país para ver os Estados!');
    console.log('   4. Dê zoom para ver as Cidades!');
    console.log('   5. NPCs devem aparecer nas cidades! 🎉\n');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Executar
main();

