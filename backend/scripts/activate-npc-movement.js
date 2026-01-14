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
console.log('║  🚶 ATIVANDO MOVIMENTO DOS NPCs                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function activateNPCMovement() {
  try {
    console.log('📊 ETAPA 1: Buscando NPCs e Edifícios\n');
    
    const { data: allNPCs, error: errorNPCs } = await supabase
      .from('npcs')
      .select('*');
    
    if (errorNPCs) {
      console.error('❌ Erro ao buscar NPCs:', errorNPCs);
      return;
    }
    
    const { data: allBuildings, error: errorBuildings } = await supabase
      .from('buildings')
      .select('*')
      .in('type', ['house', 'apartment', 'office', 'factory', 'shop']);
    
    if (errorBuildings) {
      console.error('❌ Erro ao buscar edifícios:', errorBuildings);
      return;
    }
    
    console.log(`   Total de NPCs: ${allNPCs.length}`);
    console.log(`   Total de Edifícios: ${allBuildings.length}\n`);
    
    // Agrupar edifícios por cidade
    const buildingsByCity = {};
    allBuildings.forEach(building => {
      if (!building.city_id) return;
      if (!buildingsByCity[building.city_id]) {
        buildingsByCity[building.city_id] = {
          residential: [],
          commercial: []
        };
      }
      
      if (building.type === 'house' || building.type === 'apartment') {
        buildingsByCity[building.city_id].residential.push(building);
      } else {
        buildingsByCity[building.city_id].commercial.push(building);
      }
    });
    
    console.log('📊 ETAPA 2: Atribuindo Casa e Trabalho aos NPCs\n');
    
    let npcsAtualizados = 0;
    let npcsComMovimento = 0;
    
    for (const npc of allNPCs) {
      if (!npc.city_id) continue;
      
      const cityBuildings = buildingsByCity[npc.city_id];
      if (!cityBuildings) continue;
      
      // Escolher casa e trabalho aleatórios
      const residential = cityBuildings.residential;
      const commercial = cityBuildings.commercial;
      
      if (residential.length === 0 || commercial.length === 0) {
        continue;
      }
      
      const homeBuilding = residential[Math.floor(Math.random() * residential.length)];
      const workBuilding = commercial[Math.floor(Math.random() * commercial.length)];
      
      // Atualizar NPC com casa e trabalho
      const { error: updateError } = await supabase
        .from('npcs')
        .update({
          home_building_id: homeBuilding.id,
          work_building_id: workBuilding.id,
          routine_state: 'resting',
          status: 'idle',
          speed: 5.0 + Math.random() * 3.0 // Velocidade entre 5-8 km/h
        })
        .eq('id', npc.id);
      
      if (!updateError) {
        npcsAtualizados++;
        npcsComMovimento++;
        
        if (npcsAtualizados % 100 === 0) {
          console.log(`   ✅ ${npcsAtualizados} NPCs configurados...`);
        }
      }
    }
    
    console.log(`\n✅ Total de NPCs configurados: ${npcsAtualizados}`);
    console.log(`✅ NPCs prontos para se mover: ${npcsComMovimento}\n`);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 MOVIMENTO DOS NPCs ATIVADO!                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 O QUE VAI ACONTECER AGORA:\n');
    console.log('   • NPCs vão começar a se mover pelo mapa');
    console.log('   • Durante o dia: vão de casa para o trabalho');
    console.log('   • Durante a noite: voltam para casa');
    console.log('   • Movimento suave e realista (5-8 km/h)');
    console.log('   • Cada NPC tem sua própria rotina\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

activateNPCMovement();

