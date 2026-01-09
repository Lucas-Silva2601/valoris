import * as defenseService from '../services/defenseService.js';

export const getDefenseInfo = async (req, res) => {
  try {
    const { countryId } = req.params;
    const defense = await defenseService.getOrCreateDefense(countryId, '');

    res.json(defense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const upgradeTechnology = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { level } = req.body;

    if (!level || level < 1) {
      return res.status(400).json({ error: 'Nível inválido' });
    }

    const defense = await defenseService.upgradeTechnology(countryId, level);

    res.json({
      success: true,
      defense,
      message: `Tecnologia melhorada para nível ${defense.technologyLevel}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDefensePower = async (req, res) => {
  try {
    const { countryId } = req.params;
    const power = await defenseService.getDefensePower(countryId);

    res.json({ defensePower: power });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

