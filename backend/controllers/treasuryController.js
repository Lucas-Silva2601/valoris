import * as treasuryService from '../services/treasuryService.js';

export const getTreasuryInfo = async (req, res) => {
  try {
    const { countryId } = req.params;
    const treasury = await treasuryService.getOrCreateTreasury(countryId, '');
    
    res.json({
      countryId: treasury.countryId,
      countryName: treasury.countryName,
      balance: treasury.balance,
      totalDeposited: treasury.totalDeposited,
      totalSpent: treasury.totalSpent,
      infrastructureLevel: treasury.infrastructureLevel,
      defenseLevel: treasury.defenseLevel,
      recentExpenses: treasury.expenses.slice(-10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const upgradeInfrastructure = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { level } = req.body;
    
    if (!level || level < 1) {
      return res.status(400).json({ error: 'Nível inválido' });
    }
    
    const treasury = await treasuryService.upgradeInfrastructure(countryId, level);
    
    res.json({
      success: true,
      treasury,
      message: `Infraestrutura melhorada para nível ${treasury.infrastructureLevel}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const upgradeDefense = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { level } = req.body;
    
    if (!level || level < 1) {
      return res.status(400).json({ error: 'Nível inválido' });
    }
    
    const treasury = await treasuryService.upgradeDefense(countryId, level);
    
    res.json({
      success: true,
      treasury,
      message: `Defesa melhorada para nível ${treasury.defenseLevel}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

