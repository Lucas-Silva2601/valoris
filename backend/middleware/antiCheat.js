import { createLogger } from '../utils/logger.js';
import Wallet from '../models/Wallet.js';
import MilitaryUnit from '../models/MilitaryUnit.js';

const logger = createLogger('AntiCheat');

/**
 * Middleware para verificar se o usuário tem recursos suficientes
 */
export const validateResources = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Verificar saldo para ações
    if (req.path.includes('/ownership/buy')) {
      const { shares } = req.body;
      const ownershipInfo = await getOwnershipInfo(req.body.countryId);
      const cost = shares * (ownershipInfo?.currentSharePrice || 1000);

      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < cost) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
    }

    // Verificar saldo para unidades
    if (req.path.includes('/military/units') && req.method === 'POST') {
      const unitCosts = { tank: 500, ship: 800, plane: 1000 };
      const cost = unitCosts[req.body.type] || 0;

      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < cost) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
    }

    next();
  } catch (error) {
    logger.error('Erro na validação de recursos:', error);
    res.status(500).json({ error: 'Erro ao validar recursos' });
  }
};

/**
 * Middleware para verificar propriedade de unidade
 */
export const validateUnitOwnership = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unitId } = req.params;

    const unit = await MilitaryUnit.findOne({ unitId });

    if (!unit) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    if (unit.ownerId.toString() !== userId.toString()) {
      logger.warn(`Tentativa de acesso não autorizado à unidade ${unitId} por usuário ${userId}`);
      return res.status(403).json({ error: 'Você não possui esta unidade' });
    }

    req.unit = unit;
    next();
  } catch (error) {
    logger.error('Erro na validação de propriedade:', error);
    res.status(500).json({ error: 'Erro ao validar propriedade' });
  }
};

/**
 * Helper para obter informações de propriedade
 */
const getOwnershipInfo = async (countryId) => {
  const CountryOwnership = (await import('../models/CountryOwnership.js')).default;
  return await CountryOwnership.findOne({ countryId });
};

/**
 * Middleware para detectar comportamento suspeito
 */
export const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Verificar frequência de ações
    const recentActions = await getRecentActions(userId);
    
    if (recentActions.length > 50) {
      logger.warn(`Usuário ${userId} realizou ${recentActions.length} ações recentes - possível bot`);
      // Não bloquear, apenas logar
    }

    next();
  } catch (error) {
    // Não bloquear por erro de detecção
    next();
  }
};

/**
 * Obter ações recentes do usuário
 */
const getRecentActions = async (userId) => {
  const AuditLog = (await import('../models/AuditLog.js')).default;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return await AuditLog.find({
    userId,
    timestamp: { $gte: fiveMinutesAgo }
  });
};

