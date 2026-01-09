import PlayerProfile from '../models/PlayerProfile.js';
import User from '../models/User.js';

/**
 * Obter ou criar perfil de jogador
 */
export const getOrCreateProfile = async (userId) => {
  let profile = await PlayerProfile.findOne({ userId }).populate('userId', 'username email role');

  if (!profile) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    profile = new PlayerProfile({
      userId,
      role: user.role
    });
    await profile.save();
  }

  return profile;
};

/**
 * Atualizar estatísticas do jogador
 */
export const updateStatistics = async (userId, updates) => {
  const profile = await getOrCreateProfile(userId);

  if (updates.totalInvested !== undefined) {
    profile.statistics.totalInvested += updates.totalInvested;
  }
  if (updates.totalEarned !== undefined) {
    profile.statistics.totalEarned += updates.totalEarned;
  }
  if (updates.countriesOwned !== undefined) {
    profile.statistics.countriesOwned = updates.countriesOwned;
  }
  if (updates.unitsCreated !== undefined) {
    profile.statistics.unitsCreated += updates.unitsCreated;
  }
  if (updates.combatsWon !== undefined) {
    profile.statistics.combatsWon += updates.combatsWon;
  }
  if (updates.combatsLost !== undefined) {
    profile.statistics.combatsLost += updates.combatsLost;
  }
  if (updates.missionsCompleted !== undefined) {
    profile.statistics.missionsCompleted += updates.missionsCompleted;
  }
  if (updates.missionsCreated !== undefined) {
    profile.statistics.missionsCreated += updates.missionsCreated;
  }

  await profile.save();
  return profile;
};

/**
 * Adicionar ação ao histórico
 */
export const addActionToHistory = async (userId, action, description, metadata = {}) => {
  const profile = await getOrCreateProfile(userId);

  profile.actionHistory.push({
    action,
    description,
    metadata,
    timestamp: new Date()
  });

  // Manter apenas últimos 100 ações
  if (profile.actionHistory.length > 100) {
    profile.actionHistory = profile.actionHistory.slice(-100);
  }

  await profile.save();
  return profile;
};

/**
 * Obter histórico de ações
 */
export const getActionHistory = async (userId, limit = 50) => {
  const profile = await getOrCreateProfile(userId);
  
  return profile.actionHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

/**
 * Adicionar conquista
 */
export const addAchievement = async (userId, achievementId, name, description) => {
  const profile = await getOrCreateProfile(userId);

  // Verificar se já tem a conquista
  const hasAchievement = profile.achievements.some(
    a => a.achievementId === achievementId
  );

  if (!hasAchievement) {
    profile.achievements.push({
      achievementId,
      name,
      description,
      unlockedAt: new Date()
    });
    await profile.save();
  }

  return profile;
};

