import * as playerProfileService from '../services/playerProfileService.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await playerProfileService.getOrCreateProfile(userId);

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await playerProfileService.getActionHistory(userId, limit);

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

