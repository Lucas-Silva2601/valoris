import * as countryOwnershipService from '../services/countryOwnershipService.js';

export const buyShares = async (req, res) => {
  try {
    const userId = req.user.id;
    const { countryId, countryName, shares } = req.body;
    
    if (!countryId || !countryName || !shares) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    if (shares <= 0 || shares > 100) {
      return res.status(400).json({ error: 'Número de ações inválido' });
    }
    
    // Obter preço atual das ações
    const ownership = await countryOwnershipService.getOrCreateCountryOwnership(
      countryId,
      countryName
    );
    const sharePrice = ownership.currentSharePrice;
    
    const result = await countryOwnershipService.buyShares(
      userId,
      countryId,
      countryName,
      shares,
      sharePrice
    );
    
    res.json({
      success: true,
      ownership: result,
      message: `Compra de ${shares}% de ações realizada com sucesso`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getShareholders = async (req, res) => {
  try {
    const { countryId } = req.params;
    const shareholders = await countryOwnershipService.getShareholders(countryId);
    
    res.json({ shareholders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCountryOwnershipInfo = async (req, res) => {
  try {
    const { countryId } = req.params;
    const info = await countryOwnershipService.getCountryOwnershipInfo(countryId);
    
    if (!info) {
      return res.status(404).json({ error: 'País não encontrado' });
    }
    
    // Adicionar dados econômicos reais
    const { getCountryEconomicData, getCostCategory } = await import('../data/countryEconomicData.js');
    const economicData = getCountryEconomicData(countryId);
    const costCategory = getCostCategory(countryId);
    
    res.json({
      ...info,
      economicData: {
        ...economicData,
        costCategory
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVotingPower = async (req, res) => {
  try {
    const userId = req.user.id;
    const { countryId } = req.params;
    
    const votingPower = await countryOwnershipService.calculateVotingPower(countryId, userId);
    
    res.json({ votingPower });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

