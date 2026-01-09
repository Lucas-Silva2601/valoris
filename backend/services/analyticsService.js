/**
 * Serviço de Analytics e Tracking
 */

import GameEvent from '../models/GameEvent.js';
import AnalyticsMetrics from '../models/AnalyticsMetrics.js';
import User from '../models/User.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Analytics');

/**
 * Registrar evento do jogo
 */
export const trackEvent = async (eventType, data = {}) => {
  try {
    const event = new GameEvent({
      eventType,
      userId: data.userId || null,
      countryId: data.countryId || null,
      metadata: data.metadata || {},
      sessionId: data.sessionId || null
    });

    await event.save();
    return event;
  } catch (error) {
    logger.error(`Erro ao registrar evento ${eventType}:`, error);
    // Não lançar erro para não quebrar o fluxo principal
    return null;
  }
};

/**
 * Obter eventos por tipo e período
 */
export const getEventsByType = async (eventType, startDate, endDate, limit = 100) => {
  try {
    const query = {
      eventType,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    return await GameEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username email')
      .lean();
  } catch (error) {
    logger.error('Erro ao buscar eventos:', error);
    throw error;
  }
};

/**
 * Calcular métricas do dia
 */
export const calculateDailyMetrics = async (date = new Date()) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Jogadores ativos
    const activePlayers = await GameEvent.distinct('userId', {
      eventType: { $in: ['player_login'] },
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    // Novos jogadores
    const newPlayers = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Transações
    const transactions = await GameEvent.find({
      eventType: 'investment_made',
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalTransactionValue = transactions.reduce((sum, t) => {
      return sum + (t.metadata?.amount || 0);
    }, 0);

    // Combates
    const combats = await GameEvent.find({
      eventType: { $in: ['combat_started', 'combat_ended'] },
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    // Investimentos por país
    const investmentsByCountry = await GameEvent.aggregate([
      {
        $match: {
          eventType: 'investment_made',
          timestamp: { $gte: startOfDay, $lte: endOfDay },
          countryId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$countryId',
          totalValue: { $sum: '$metadata.amount' },
          investorCount: { $addToSet: '$userId' },
          countryName: { $first: '$metadata.countryName' }
        }
      },
      {
        $project: {
          countryId: '$_id',
          countryName: 1,
          investmentValue: '$totalValue',
          investorCount: { $size: '$investorCount' }
        }
      },
      {
        $sort: { investmentValue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Unidades criadas
    const unitsCreated = await GameEvent.countDocuments({
      eventType: 'unit_created',
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    // Criar ou atualizar métricas do dia
    const metrics = {
      date: startOfDay,
      activePlayers: activePlayers.length,
      newPlayers,
      totalTransactions: transactions.length,
      totalTransactionValue,
      averageTransactionValue: transactions.length > 0 
        ? totalTransactionValue / transactions.length 
        : 0,
      totalCombats: combats.filter(c => c.eventType === 'combat_started').length,
      totalInvestments: transactions.length,
      totalInvestmentValue: totalTransactionValue,
      topInvestedCountries: investmentsByCountry,
      unitsCreated
    };

    await AnalyticsMetrics.findOneAndUpdate(
      { date: startOfDay },
      metrics,
      { upsert: true, new: true }
    );

    logger.info(`Métricas do dia ${date.toISOString()} calculadas`);
    return metrics;
  } catch (error) {
    logger.error('Erro ao calcular métricas diárias:', error);
    throw error;
  }
};

/**
 * Obter métricas por período
 */
export const getMetricsByPeriod = async (startDate, endDate) => {
  try {
    return await AnalyticsMetrics.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
  } catch (error) {
    logger.error('Erro ao buscar métricas:', error);
    throw error;
  }
};

/**
 * Obter heatmap de atividade
 */
export const getActivityHeatmap = async (startDate, endDate) => {
  try {
    const events = await GameEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          countryId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            countryId: '$countryId',
            hour: { $hour: '$timestamp' },
            dayOfWeek: { $dayOfWeek: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.countryId',
          activity: {
            $push: {
              hour: '$_id.hour',
              dayOfWeek: '$_id.dayOfWeek',
              count: '$count'
            }
          },
          totalActivity: { $sum: '$count' }
        }
      },
      {
        $sort: { totalActivity: -1 }
      }
    ]);

    return events;
  } catch (error) {
    logger.error('Erro ao gerar heatmap:', error);
    throw error;
  }
};

/**
 * Obter estatísticas gerais
 */
export const getGeneralStats = async () => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPlayers,
      activeLast24h,
      activeLast7d,
      totalTransactions,
      totalCombats,
      topCountries
    ] = await Promise.all([
      User.countDocuments(),
      GameEvent.distinct('userId', {
        eventType: 'player_login',
        timestamp: { $gte: last24h }
      }).then(users => users.length),
      GameEvent.distinct('userId', {
        eventType: 'player_login',
        timestamp: { $gte: last7d }
      }).then(users => users.length),
      GameEvent.countDocuments({ eventType: 'investment_made' }),
      GameEvent.countDocuments({ eventType: 'combat_started' }),
      GameEvent.aggregate([
        {
          $match: {
            eventType: 'investment_made',
            countryId: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$countryId',
            totalValue: { $sum: '$metadata.amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalValue: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalPlayers,
      activeLast24h,
      activeLast7d,
      totalTransactions,
      totalCombats,
      topCountries: topCountries.map(c => ({
        countryId: c._id,
        totalValue: c.totalValue,
        transactionCount: c.count
      }))
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas gerais:', error);
    throw error;
  }
};

