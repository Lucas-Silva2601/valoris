import * as missionService from '../services/missionService.js';

export const createMission = async (req, res) => {
  try {
    const userId = req.user.id;
    const missionData = req.body;

    if (!missionData.title || !missionData.description || !missionData.reward) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const mission = await missionService.createMission(userId, missionData);

    res.status(201).json({
      success: true,
      mission,
      message: 'Missão criada com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const acceptMission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { missionId } = req.params;

    const mission = await missionService.acceptMission(missionId, userId);

    res.json({
      success: true,
      mission,
      message: 'Missão aceita com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { missionId } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
      return res.status(400).json({ error: 'Progresso necessário' });
    }

    const mission = await missionService.updateMissionProgress(missionId, progress);

    res.json({
      success: true,
      mission,
      message: 'Progresso atualizado'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAvailableMissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const missions = await missionService.getAvailableMissions(limit);

    res.json({ missions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || null;

    const missions = await missionService.getUserMissions(userId, status);

    res.json({ missions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

