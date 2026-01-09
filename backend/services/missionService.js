import Mission from '../models/Mission.js';
import PlayerProfile from '../models/PlayerProfile.js';
import { addBalance } from './walletService.js';
import { updateStatistics } from './playerProfileService.js';

/**
 * Criar nova missão
 */
export const createMission = async (creatorId, missionData) => {
  const missionId = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const mission = new Mission({
    missionId,
    creatorId,
    title: missionData.title,
    description: missionData.description,
    type: missionData.type || 'military',
    targetCountry: missionData.targetCountry || null,
    requirements: missionData.requirements || {},
    reward: missionData.reward,
    progress: {
      current: 0,
      target: missionData.progressTarget || 100
    },
    expiresAt: missionData.expiresAt || null
  });

  await mission.save();

  // Atualizar estatísticas do criador
  await updateStatistics(creatorId, { missionsCreated: 1 });

  return mission;
};

/**
 * Aceitar missão
 */
export const acceptMission = async (missionId, userId) => {
  const mission = await Mission.findOne({ missionId });

  if (!mission) {
    throw new Error('Missão não encontrada');
  }

  if (mission.status !== 'open') {
    throw new Error('Missão não está disponível');
  }

  if (mission.creatorId.toString() === userId.toString()) {
    throw new Error('Não pode aceitar sua própria missão');
  }

  // Verificar requisitos
  if (mission.requirements.requiredRole !== 'any') {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (user.role !== mission.requirements.requiredRole) {
      throw new Error('Você não tem a role necessária para esta missão');
    }
  }

  mission.status = 'accepted';
  mission.acceptedBy = userId;
  mission.acceptedAt = new Date();

  await mission.save();

  return mission;
};

/**
 * Atualizar progresso da missão
 */
export const updateMissionProgress = async (missionId, progress) => {
  const mission = await Mission.findOne({ missionId });

  if (!mission) {
    throw new Error('Missão não encontrada');
  }

  if (mission.status !== 'accepted' && mission.status !== 'in_progress') {
    throw new Error('Missão não está em progresso');
  }

  mission.progress.current = Math.min(progress, mission.progress.target);
  mission.status = 'in_progress';

  // Verificar se completou
  if (mission.progress.current >= mission.progress.target) {
    await completeMission(mission);
  } else {
    await mission.save();
  }

  return mission;
};

/**
 * Completar missão
 */
const completeMission = async (mission) => {
  mission.status = 'completed';
  mission.completedAt = new Date();
  await mission.save();

  // Dar recompensa ao aceitador
  if (mission.acceptedBy) {
    await addBalance(
      mission.acceptedBy,
      mission.reward.amount,
      `Recompensa da missão: ${mission.title}`,
      { missionId: mission.missionId }
    );

    // Atualizar estatísticas
    await updateStatistics(mission.acceptedBy, { missionsCompleted: 1 });
  }

  return mission;
};

/**
 * Obter missões disponíveis
 */
export const getAvailableMissions = async (limit = 50) => {
  return await Mission.find({
    status: 'open',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .populate('creatorId', 'username')
  .sort({ createdAt: -1 })
  .limit(limit);
};

/**
 * Obter missões do usuário
 */
export const getUserMissions = async (userId, status = null) => {
  const query = {
    $or: [
      { creatorId: userId },
      { acceptedBy: userId }
    ]
  };

  if (status) {
    query.status = status;
  }

  return await Mission.find(query)
    .populate('creatorId', 'username')
    .populate('acceptedBy', 'username')
    .sort({ createdAt: -1 });
};

