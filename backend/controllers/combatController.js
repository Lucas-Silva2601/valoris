import * as combatService from '../services/combatService.js';
import MilitaryUnit from '../models/MilitaryUnit.js';

export const initiateCombat = async (req, res) => {
  try {
    const { unitIds, targetCountryId, countriesGeoJSON } = req.body;
    const userId = req.user.id;

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({ error: 'Unidades necessárias' });
    }

    if (!targetCountryId) {
      return res.status(400).json({ error: 'País alvo necessário' });
    }

    // Verificar se as unidades pertencem ao usuário
    const units = await MilitaryUnit.find({
      unitId: { $in: unitIds },
      ownerId: userId,
      status: { $ne: 'destroyed' }
    });

    if (units.length !== unitIds.length) {
      return res.status(400).json({ error: 'Algumas unidades não foram encontradas' });
    }

    const combat = await combatService.initiateCombat(
      units,
      targetCountryId,
      countriesGeoJSON
    );

    res.json({
      success: true,
      combat,
      message: 'Combate iniciado'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const processCombatRound = async (req, res) => {
  try {
    const { combatId } = req.params;
    const combat = await combatService.processCombatRound(combatId);

    if (!combat) {
      return res.status(404).json({ error: 'Combate não encontrado' });
    }

    res.json({
      success: true,
      combat,
      message: 'Rodada de combate processada'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCombatHistory = async (req, res) => {
  try {
    const { countryId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await combatService.getCombatHistory(countryId, limit);

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

