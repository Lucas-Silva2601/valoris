import * as militaryUnitService from '../services/militaryUnitService.js';

export const createUnit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { countryId, countryName, type, position } = req.body;

    if (!countryId || !type || !position) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (!['tank', 'ship', 'plane'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de unidade inválido' });
    }

    const unit = await militaryUnitService.createMilitaryUnit(
      userId,
      countryId,
      countryName || countryId,
      type,
      position
    );

    res.json({
      success: true,
      unit,
      message: 'Unidade criada com sucesso'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserUnits = async (req, res) => {
  try {
    const userId = req.user.id;
    const units = await militaryUnitService.getUserUnits(userId);

    res.json({ units });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnitsInCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const units = await militaryUnitService.getUnitsInCountry(countryId);

    res.json({ units });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const moveUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { targetLat, targetLng, countriesGeoJSON } = req.body;

    if (!targetLat || !targetLng) {
      return res.status(400).json({ error: 'Coordenadas de destino necessárias' });
    }

    const unit = await militaryUnitService.moveUnit(
      unitId,
      targetLat,
      targetLng,
      countriesGeoJSON
    );

    res.json({
      success: true,
      unit,
      message: 'Unidade em movimento'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUnitStats = async (req, res) => {
  try {
    const stats = militaryUnitService.getAllUnitStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

