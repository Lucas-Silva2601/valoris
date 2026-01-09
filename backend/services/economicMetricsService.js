import EconomicMetrics from '../models/EconomicMetrics.js';
import CountryOwnership from '../models/CountryOwnership.js';
import Treasury from '../models/Treasury.js';
import { emitEconomicHealthUpdate } from '../socket/socketHandler.js';

/**
 * Obter ou criar métricas econômicas
 */
export const getOrCreateEconomicMetrics = async (countryId, countryName) => {
  let metrics = await EconomicMetrics.findOne({ countryId });
  
  if (!metrics) {
    metrics = new EconomicMetrics({
      countryId,
      countryName,
      healthScore: 50,
      investmentLevel: 0,
      politicalStability: 50,
      infrastructure: {
        level: 1,
        condition: 100
      },
      resources: {
        virtual: 100,
        exploitationRate: 1
      }
    });
    await metrics.save();
  }
  
  return metrics;
};

/**
 * Calcular saúde econômica
 */
export const calculateEconomicHealth = async (countryId) => {
  const metrics = await getOrCreateEconomicMetrics(countryId, '');
  const ownership = await CountryOwnership.findOne({ countryId });
  const treasury = await Treasury.findOne({ countryId });
  
  // Fatores que influenciam a saúde econômica
  let healthScore = 50; // Base
  
  // Investimento (0-30 pontos)
  const investmentLevel = ownership ? ownership.totalInvested / 10000 : 0;
  healthScore += Math.min(investmentLevel * 0.3, 30);
  
  // Estabilidade política (0-20 pontos)
  healthScore += metrics.politicalStability * 0.2;
  
  // Infraestrutura (0-20 pontos)
  const infrastructureScore = treasury 
    ? (treasury.infrastructureLevel / 10) * 20 
    : 10;
  healthScore += infrastructureScore;
  
  // Condição da infraestrutura (0-10 pontos)
  healthScore += (metrics.infrastructure.condition / 100) * 10;
  
  // Recursos (0-10 pontos)
  const resourceScore = (metrics.resources.virtual / 100) * 10;
  healthScore += resourceScore;
  
  // Aplicar eventos ativos
  for (const event of metrics.events.filter(e => e.active)) {
    healthScore += event.impact;
  }
  
  // Garantir que está entre 0 e 100
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  metrics.healthScore = healthScore;
  metrics.investmentLevel = ownership ? ownership.totalInvested : 0;
  
  // Adicionar ao histórico
  metrics.history.push({
    date: new Date(),
    healthScore,
    investmentLevel: metrics.investmentLevel,
    politicalStability: metrics.politicalStability
  });
  
  // Manter apenas últimos 100 registros
  if (metrics.history.length > 100) {
    metrics.history = metrics.history.slice(-100);
  }
  
  await metrics.save();
  
  // Emitir atualização via Socket.io
  emitEconomicHealthUpdate(countryId, metrics);
  
  return metrics;
};

/**
 * Criar evento econômico aleatório
 */
export const createRandomEvent = async (countryId) => {
  const metrics = await getOrCreateEconomicMetrics(countryId, '');
  
  const eventTypes = [
    { type: 'economic_boom', impact: 10, description: 'Boom econômico!' },
    { type: 'recession', impact: -15, description: 'Recessão econômica' },
    { type: 'political_crisis', impact: -20, description: 'Crise política' },
    { type: 'natural_disaster', impact: -25, description: 'Desastre natural' },
    { type: 'war', impact: -30, description: 'Guerra declarada' }
  ];
  
  const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const duration = Math.random() * 7 + 1; // 1-8 dias
  
  metrics.events.push({
    type: randomEvent.type,
    impact: randomEvent.impact,
    description: randomEvent.description,
    startDate: new Date(),
    endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    active: true
  });
  
  await metrics.save();
  
  return metrics;
};

/**
 * Aplicar impacto de guerra na economia
 */
export const applyWarImpact = async (countryId, damageLevel) => {
  const metrics = await getOrCreateEconomicMetrics(countryId, '');
  
  // Reduzir saúde econômica
  metrics.healthScore = Math.max(0, metrics.healthScore - damageLevel);
  
  // Reduzir condição da infraestrutura
  metrics.infrastructure.condition = Math.max(0, metrics.infrastructure.condition - damageLevel);
  
  // Reduzir estabilidade política
  metrics.politicalStability = Math.max(0, metrics.politicalStability - damageLevel * 0.5);
  
  // Adicionar evento de guerra se não existir
  const hasWarEvent = metrics.events.some(
    e => e.type === 'war' && e.active
  );
  
  if (!hasWarEvent) {
    metrics.events.push({
      type: 'war',
      impact: -30,
      description: 'País em guerra',
      startDate: new Date(),
      active: true
    });
  }
  
  await metrics.save();
  
  return metrics;
};

