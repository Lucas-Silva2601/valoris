import * as dividendService from '../services/dividendService.js';

export const getDividendHistory = async (req, res) => {
  try {
    const { countryId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await dividendService.getDividendHistory(countryId, limit);
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserDividends = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const dividends = await dividendService.getUserDividends(userId, limit);
    
    res.json({ dividends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

