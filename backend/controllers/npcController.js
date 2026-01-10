import * as npcService from '../services/npcService.js';
import { checkConnection } from '../config/supabase.js';

// ✅ FALLBACK: NPCs mockados para quando o banco estiver offline
const getMockNPCs = () => {
  const skinTones = ['#f4d5bd', '#422d1a', '#d4a574', '#8b6f47', '#c9a882', '#a67c52'];
  const mockNPCs = [];
  
  // Criar 20 NPCs mockados espalhados pelo mundo
  for (let i = 0; i < 20; i++) {
    mockNPCs.push({
      npcId: `mock_npc_${i}`,
      name: `NPC ${i + 1}`,
      countryId: 'BRA', // Brasil como padrão
      countryName: 'Brazil',
      position: {
        lat: -14.2350 + (Math.random() - 0.5) * 20, // Variação no Brasil
        lng: -51.9253 + (Math.random() - 0.5) * 20
      },
      status: 'idle',
      npcType: Math.random() > 0.5 ? 'resident' : 'worker',
      skinColor: skinTones[Math.floor(Math.random() * skinTones.length)],
      _id: `mock_${i}`,
      homeBuilding: null,
      workBuilding: null
    });
  }
  
  return mockNPCs;
};

export const getNPCsByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    
    // ✅ Verificar se banco está conectado
    if (!checkConnection()) {
      console.warn('⚠️  Supabase offline. Retornando NPCs mockados.');
      const mockNPCs = getMockNPCs().filter(npc => npc.countryId === countryId);
      return res.json({ npcs: mockNPCs, _isOffline: true });
    }
    
    const npcs = await npcService.getNPCsByCountry(countryId);
    res.json({ npcs });
  } catch (error) {
    // ✅ Em caso de erro, retornar dados mockados em vez de erro 500
    console.error('Erro ao buscar NPCs:', error.message);
    const mockNPCs = getMockNPCs().filter(npc => npc.countryId === req.params.countryId);
    res.json({ npcs: mockNPCs, _isOffline: true, error: error.message });
  }
};

export const processNPCsMovement = async (req, res) => {
  try {
    // ✅ Verificar se banco está conectado
    if (!checkConnection()) {
      return res.json({
        success: true,
        updated: 0,
        idleProcessed: 0,
        npcs: [],
        message: 'Modo offline - movimento não processado',
        _isOffline: true
      });
    }
    
    const result = await npcService.processAllNPCsMovement();
    res.json({
      success: true,
      ...result,
      message: 'Movimento de NPCs processado'
    });
  } catch (error) {
    // ✅ Retornar resposta vazia em vez de erro
    console.error('Erro ao processar movimento:', error.message);
    res.json({
      success: true,
      updated: 0,
      idleProcessed: 0,
      npcs: [],
      message: 'Erro ao processar movimento (modo offline)',
      _isOffline: true
    });
  }
};

export const getAllNPCs = async (req, res) => {
  try {
    // ✅ Verificar se banco está conectado
    if (!checkConnection()) {
      console.warn('⚠️  Supabase offline. Retornando NPCs mockados.');
      const mockNPCs = getMockNPCs();
      return res.json({ npcs: mockNPCs, _isOffline: true });
    }
    
    const npcs = await npcService.getAllNPCs();
    res.json({ npcs });
  } catch (error) {
    // ✅ Em caso de erro, retornar dados mockados em vez de erro 500
    console.error('Erro ao buscar todos os NPCs:', error.message);
    const mockNPCs = getMockNPCs();
    res.json({ npcs: mockNPCs, _isOffline: true, error: error.message });
  }
};

export const createInitialNPCs = async (req, res) => {
  try {
    const { countryId, countryName, count = 5 } = req.body;

    if (!countryId || !countryName) {
      return res.status(400).json({ error: 'countryId e countryName são obrigatórios' });
    }

    // Obter centro aproximado do país (será melhorado depois com GeoJSON)
    // Por enquanto, usar coordenadas genéricas baseadas no countryId
    const hash = countryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseLat = (hash % 180) - 90;
    const baseLng = ((hash * 7) % 360) - 180;

    // Verificar se já existem NPCs neste país
    const existingNPCs = await npcService.getNPCsByCountry(countryId);
    if (existingNPCs.length > 0) {
      return res.json({
        success: true,
        created: 0,
        message: `Já existem ${existingNPCs.length} NPCs em ${countryName}`,
        npcs: existingNPCs.length
      });
    }

    let created = 0;
    for (let i = 0; i < count; i++) {
      // Criar NPCs em posições aleatórias próximas ao centro do país
      const randomOffsetLat = (Math.random() - 0.5) * 5; // ~5 graus de variação
      const randomOffsetLng = (Math.random() - 0.5) * 5;
      const position = {
        lat: baseLat + randomOffsetLat,
        lng: baseLng + randomOffsetLng
      };

      try {
        await npcService.createNPC(countryId, countryName, null, position);
        created++;
      } catch (error) {
        console.error(`Erro ao criar NPC ${i + 1}:`, error);
      }
    }

    res.json({
      success: true,
      created,
      message: `Criados ${created} NPCs iniciais para ${countryName}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

