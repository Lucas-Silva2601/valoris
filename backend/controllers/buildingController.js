import * as buildingService from '../services/buildingService.js';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ✅ Identificar país a partir de coordenadas usando GeoJSON
 * Mapeia feature.properties.ISO_A3 para countryId
 */
const identifyCountryFromCoordinates = (lat, lng) => {
  try {
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (!fs.existsSync(geoJsonPath)) {
      console.warn('⚠️  GeoJSON não encontrado, usando país genérico');
      return { countryId: 'UNK', countryName: 'Local Desconhecido', valid: false };
    }
    
    const geoJsonData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));
    const point = turf.point([lng, lat]);
    
    // Procurar país que contém o ponto
    for (const feature of geoJsonData.features || []) {
      if (!feature.geometry) continue;
      
      let polygon = null;
      
      if (feature.geometry.type === 'Polygon') {
        polygon = turf.polygon(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          polygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, polygon)) {
            break;
          }
        }
      }
      
      if (polygon && turf.booleanPointInPolygon(point, polygon)) {
        const props = feature.properties || {};
        
        // ✅ MAPEAR ISO_A3 para countryId (como solicitado)
        const countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK';
        const countryName = props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido';
        
        console.log(`✅ País identificado: ${countryName} (${countryId}) para coordenadas ${lat}, ${lng}`);
        return { countryId, countryName, valid: true };
      }
    }
    
    console.warn(`⚠️  País não identificado para coordenadas ${lat}, ${lng}`);
    return { countryId: 'UNK', countryName: 'Local Desconhecido', valid: false };
  } catch (error) {
    console.error('Erro ao identificar país:', error);
    return { countryId: 'UNK', countryName: 'Local Desconhecido', valid: false };
  }
};

export const buildBuilding = async (req, res) => {
  try {
    // FASE DE TESTE: Permitir construção sem autenticação
    const userId = req.user?.id || req.body.userId || 'test-user-id';
    const { type, lat, lng, level, countryId, countryName } = req.body;

    // ✅ Validações básicas
    if (!type || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Tipo e coordenadas são obrigatórios' });
    }

    // ✅ Validar coordenadas
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Coordenadas devem ser números' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    // ✅ Identificar país a partir das coordenadas (mapear ISO_A3)
    const countryInfo = identifyCountryFromCoordinates(lat, lng);
    
    // Usar país identificado ou fornecido
    const finalCountryId = countryId || countryInfo.countryId;
    const finalCountryName = countryName || countryInfo.countryName;

    // ✅ Verificar se o jogador tem saldo
    const { getOrCreateWallet } = await import('../services/walletService.js');
    const wallet = await getOrCreateWallet(userId);
    
    const cost = buildingService.calculateBuildingCost(type, level || 1);
    
    if (wallet.balance < cost) {
      return res.status(400).json({ 
        error: `Saldo insuficiente. Você tem ${wallet.balance.toFixed(2)} VAL, mas precisa de ${cost} VAL` 
      });
    }

    // ✅ Construir edifício
    const building = await buildingService.buildBuilding(
      userId,
      finalCountryId,
      finalCountryName,
      type,
      lat,
      lng,
      level || 1,
      false // Não validar geografia novamente (já validamos)
    );

    // ✅ Emitir atualização via Socket.io para aparecer imediatamente no mapa
    try {
      const { getIO } = await import('../socket/socketHandler.js');
      const io = getIO();
      
      if (io) {
        io.emit('building:created', {
          building: {
            buildingId: building.buildingId,
            type: building.type,
            position: building.position,
            countryId: building.countryId,
            countryName: building.countryName,
            level: building.level,
            ownerId: building.ownerId
          }
        });
      } else {
        console.warn('⚠️ Socket.io não está inicializado. Evento building:created não será enviado.');
      }
    } catch (error) {
      // Não bloquear a resposta se houver erro no Socket.io
      console.error('Erro ao emitir evento Socket.io:', error);
    }

    res.json({
      success: true,
      building,
      message: `Edifício construído com sucesso em ${finalCountryName}! 10 NPCs construtores foram enviados!`
    });
  } catch (error) {
    console.error('Erro ao construir:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getBuildingsByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const buildings = await buildingService.getBuildingsByCountry(countryId);

    res.json({ buildings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyBuildings = async (req, res) => {
  try {
    // ✅ FASE DE TESTE: Permitir userId de parâmetro ou header
    const userId = req.params.userId || req.user?.id || req.headers['user-id'] || 'test-user-id';
    const { countryId } = req.query;
    const buildings = await buildingService.getUserBuildings(userId, countryId);

    res.json({ buildings });
  } catch (error) {
    console.error('Erro ao obter edifícios do usuário:', error);
    res.status(500).json({ error: error.message });
  }
};

export const upgradeBuilding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { buildingId } = req.params;

    const building = await buildingService.upgradeBuilding(userId, buildingId);

    res.json({
      success: true,
      building,
      message: 'Edifício melhorado com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const demolishBuilding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { buildingId } = req.params;

    const result = await buildingService.demolishBuilding(userId, buildingId);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getBuildingCost = async (req, res) => {
  try {
    const { type, level } = req.query;
    const cost = buildingService.calculateBuildingCost(type, parseInt(level) || 1);

    res.json({ type, level: parseInt(level) || 1, cost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

