import MilitaryUnit from '../models/MilitaryUnit.js';
import Wallet from '../models/Wallet.js';
import { subtractBalance } from './walletService.js';
import * as turf from '@turf/turf';
// import { detectCountryByCoordinates } from '../utils/geography.js';
// Nota: detectCountryByCoordinates será implementado quando necessário com dados GeoJSON

// Estatísticas base por tipo de unidade
const UNIT_STATS = {
  tank: {
    name: 'Tanque',
    health: 100,
    attack: 25,
    defense: 15,
    speed: 0.5, // graus por minuto
    range: 0.1, // graus
    cost: 500,
    fuelCapacity: 100,
    fuelConsumptionPerKm: 0.5 // litros por km
  },
  ship: {
    name: 'Navio',
    health: 150,
    attack: 30,
    defense: 20,
    speed: 0.8,
    range: 0.15,
    cost: 800,
    fuelCapacity: 200,
    fuelConsumptionPerKm: 0.3 // navios consomem menos por km
  },
  plane: {
    name: 'Avião',
    health: 80,
    attack: 35,
    defense: 10,
    speed: 1.2,
    range: 0.2,
    cost: 1000,
    fuelCapacity: 150,
    fuelConsumptionPerKm: 1.0 // aviões consomem mais
  }
};

/**
 * Criar uma nova unidade militar
 */
export const createMilitaryUnit = async (userId, countryId, countryName, type, position) => {
  if (!UNIT_STATS[type]) {
    throw new Error('Tipo de unidade inválido');
  }

  const stats = UNIT_STATS[type];
  const cost = stats.cost;

  // Verificar saldo
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < cost) {
    throw new Error('Saldo insuficiente para criar unidade');
  }

  // Subtrair saldo
  await subtractBalance(
    userId,
    cost,
    `Compra de ${stats.name}`,
    { countryId, type }
  );

  // Gerar ID único
  const unitId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Criar unidade
  const unit = new MilitaryUnit({
    unitId,
    type,
    name: `${stats.name} ${unitId.substr(-6)}`,
    ownerId: userId,
    countryId,
    position: {
      lat: position.lat,
      lng: position.lng
    },
    health: {
      current: stats.health,
      max: stats.health
    },
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    range: stats.range,
    status: 'idle',
    currentCountry: countryId,
    fuel: {
      current: stats.fuelCapacity,
      capacity: stats.fuelCapacity
    }
  });

  await unit.save();

  // Registrar evento de analytics
  try {
    const { trackEvent } = await import('./analyticsService.js');
    await trackEvent('unit_created', {
      userId: userId.toString(),
      countryId,
      metadata: {
        unitId: unit.unitId,
        type,
        cost,
        position: unit.position
      }
    });
  } catch (error) {
    console.warn('Erro ao registrar evento de criação de unidade:', error);
  }

  return unit;
};

/**
 * Obter unidades de um jogador
 */
export const getUserUnits = async (userId) => {
  return await MilitaryUnit.find({ 
    ownerId: userId,
    status: { $ne: 'destroyed' }
  });
};

/**
 * Obter unidades em um país
 */
export const getUnitsInCountry = async (countryId) => {
  return await MilitaryUnit.find({
    currentCountry: countryId,
    status: { $ne: 'destroyed' }
  }).populate('ownerId', 'username');
};

/**
 * Mover unidade para nova posição
 */
export const moveUnit = async (unitId, targetLat, targetLng, countriesGeoJSON) => {
  const unit = await MilitaryUnit.findOne({ unitId });

  if (!unit) {
    throw new Error('Unidade não encontrada');
  }

  if (unit.status === 'destroyed') {
    throw new Error('Unidade destruída');
  }

  if (unit.status === 'moving' || unit.status === 'attacking') {
    throw new Error('Unidade já está em movimento ou combate');
  }

  // Verificar combustível antes de iniciar movimento
  if (unit.fuel.current <= 0) {
    throw new Error('Unidade sem combustível. Reabasteça antes de mover.');
  }

  // Calcular distância usando turf.js (em km)
  const from = turf.point([unit.position.lng, unit.position.lat]);
  const to = turf.point([targetLng, targetLat]);
  const distanceKm = turf.distance(from, to, { units: 'kilometers' });

  // Obter fator de consumo do tipo de unidade
  const stats = UNIT_STATS[unit.type];
  if (!stats) {
    throw new Error('Tipo de unidade inválido');
  }

  // Calcular combustível necessário para a viagem
  const fuelNeeded = distanceKm * stats.fuelConsumptionPerKm;

  // Verificar se há combustível suficiente
  if (unit.fuel.current < fuelNeeded) {
    throw new Error(`Combustível insuficiente. Necessário: ${fuelNeeded.toFixed(1)}L, Disponível: ${unit.fuel.current.toFixed(1)}L`);
  }

  // Validar alcance (usando distância em graus para compatibilidade)
  const distance = calculateDistance(
    unit.position.lat,
    unit.position.lng,
    targetLat,
    targetLng
  );

  if (distance > unit.range * 10) { // Ajustar conforme necessário
    throw new Error('Destino fora do alcance da unidade');
  }

  // Detectar país de destino
  // Por enquanto, manter o país atual (em produção usar detectCountryByCoordinates)
  const targetCountryId = unit.currentCountry;

  // Atualizar unidade
  unit.targetPosition = {
    lat: targetLat,
    lng: targetLng
  };
  unit.status = 'moving';
  unit.currentCountry = targetCountryId || unit.currentCountry;
  unit.lastMovementTime = new Date();

  await unit.save();

  // Registrar evento de analytics
  try {
    const { trackEvent } = await import('./analyticsService.js');
    await trackEvent('unit_created', {
      userId: userId.toString(),
      countryId,
      metadata: {
        unitId: unit.unitId,
        type,
        cost,
        position: unit.position
      }
    });
  } catch (error) {
    console.warn('Erro ao registrar evento de criação de unidade:', error);
  }

  return unit;
};

/**
 * Atualizar posição da unidade (chamado periodicamente)
 */
export const updateUnitPosition = async (unitId) => {
  const unit = await MilitaryUnit.findOne({ unitId });

  if (!unit || unit.status !== 'moving' || !unit.targetPosition) {
    return null;
  }

  // Verificar se a unidade tem combustível
  if (unit.fuel.current <= 0) {
    // Sem combustível - parar a unidade
    unit.status = 'idle';
    unit.targetPosition = null;
    await unit.save();
    return unit;
  }

  const currentLat = unit.position.lat;
  const currentLng = unit.position.lng;
  const targetLat = unit.targetPosition.lat;
  const targetLng = unit.targetPosition.lng;

  // Calcular distância usando turf.js (em km)
  const from = turf.point([currentLng, currentLat]);
  const to = turf.point([targetLng, targetLat]);
  const distanceKm = turf.distance(from, to, { units: 'kilometers' });

  // Calcular direção (em graus para movimento)
  const latDiff = targetLat - currentLat;
  const lngDiff = targetLng - currentLng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // Se chegou ao destino
  if (distance < 0.01) {
    unit.position.lat = targetLat;
    unit.position.lng = targetLng;
    unit.targetPosition = null;
    unit.status = 'idle';
    unit.lastMovementTime = null;
    await unit.save();
    return unit;
  }

  // Obter fator de consumo do tipo de unidade
  const stats = UNIT_STATS[unit.type];
  if (!stats) {
    console.error(`Tipo de unidade inválido: ${unit.type}`);
    unit.status = 'idle';
    unit.targetPosition = null;
    await unit.save();
    return unit;
  }

  // Calcular distância que será percorrida neste ciclo
  const moveDistance = unit.speed * 0.01; // Ajustar velocidade
  const ratio = Math.min(moveDistance / distance, 1);
  
  // Calcular nova posição
  const newLat = currentLat + latDiff * ratio;
  const newLng = currentLng + lngDiff * ratio;

  // Calcular distância percorrida neste ciclo (em km)
  const fromNew = turf.point([currentLng, currentLat]);
  const toNew = turf.point([newLng, newLat]);
  const distanceTraveledKm = turf.distance(fromNew, toNew, { units: 'kilometers' });

  // Consumir combustível baseado na distância percorrida
  const fuelConsumed = distanceTraveledKm * stats.fuelConsumptionPerKm;
  unit.fuel.current = Math.max(0, unit.fuel.current - fuelConsumed);

  // Queimar 100% das taxas de combustível (remover do sistema)
  if (fuelConsumed > 0) {
    try {
      const { burnFuelCosts } = await import('./currencyBurnService.js');
      // Calcular custo do combustível (assumindo 1 VAL por litro)
      const fuelCost = fuelConsumed * 1; // 1 VAL por litro
      await burnFuelCosts(fuelCost);
    } catch (error) {
      console.warn('Erro ao queimar custos de combustível:', error);
    }
  }

  // Se acabou o combustível durante o movimento, parar
  if (unit.fuel.current <= 0) {
    unit.status = 'idle';
    unit.targetPosition = null;
    unit.fuel.current = 0;
  } else {
    // Atualizar posição
    unit.position.lat = newLat;
    unit.position.lng = newLng;
  }

  unit.lastMovementTime = new Date();
  await unit.save();

  // Registrar evento de analytics
  try {
    const { trackEvent } = await import('./analyticsService.js');
    await trackEvent('unit_created', {
      userId: userId.toString(),
      countryId,
      metadata: {
        unitId: unit.unitId,
        type,
        cost,
        position: unit.position
      }
    });
  } catch (error) {
    console.warn('Erro ao registrar evento de criação de unidade:', error);
  }

  return unit;
};

/**
 * Calcular distância entre dois pontos
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Obter estatísticas de uma unidade
 */
export const getUnitStats = (type) => {
  return UNIT_STATS[type] || null;
};

/**
 * Obter todas as estatísticas
 */
export const getAllUnitStats = () => {
  return UNIT_STATS;
};

