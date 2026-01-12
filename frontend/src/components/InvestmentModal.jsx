import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { API_BASE_URL } from '../config/api';

export default function InvestmentModal({ country, onClose, onSuccess }) {
  const [shares, setShares] = useState(1);
  const [sharePrice, setSharePrice] = useState(1000);
  const [totalCost, setTotalCost] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ownershipInfo, setOwnershipInfo] = useState(null);
  const [economicData, setEconomicData] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (country) {
      loadOwnershipInfo();
      loadEconomicData();
    }
  }, [country]);

  const loadOwnershipInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ownership/${country.id}/info`);
      if (response.ok) {
        const data = await response.json();
        setOwnershipInfo(data);
        setSharePrice(data.currentSharePrice);
        setTotalCost(shares * data.currentSharePrice);
        
        // Se vier dados econômicos na resposta
        if (data.economicData) {
          setEconomicData(data.economicData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    }
  };

  const loadEconomicData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/countries/${country.id}/economic`);
      if (response.ok) {
        const data = await response.json();
        setEconomicData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados econômicos:', error);
    }
  };

  const handleSharesChange = (value) => {
    const newShares = Math.max(0.1, Math.min(100, value));
    setShares(newShares);
    const currentPrice = sharePrice || (ownershipInfo?.currentSharePrice || 1000);
    setTotalCost(newShares * currentPrice);
  };

  // Atualizar total quando sharePrice mudar
  useEffect(() => {
    if (sharePrice) {
      setTotalCost(shares * sharePrice);
    }
  }, [sharePrice, shares]);

  const handleBuy = async () => {
    if (!country || shares <= 0) {
      setError('Quantidade de ações inválida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'user-id': userId
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/ownership/buy`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          countryId: country.id,
          countryName: country.name,
          shares
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(`Compra realizada com sucesso! ${shares}% de ações adquiridas.`);
        if (onSuccess) {
          onSuccess(data);
        }
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorMsg = data.error || 'Erro ao comprar ações';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      setError('Erro ao processar compra');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!country) return null;

  const availableShares = ownershipInfo ? ownershipInfo.availableShares : 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Investir em {country.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Informações econômicas do país */}
        {economicData && (
          <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-semibold">Economia do País</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                economicData.multiplier >= 3.0 ? 'bg-red-900 text-red-200' :
                economicData.multiplier >= 2.0 ? 'bg-orange-900 text-orange-200' :
                economicData.multiplier >= 1.0 ? 'bg-yellow-900 text-yellow-200' :
                'bg-green-900 text-green-200'
              }`}>
                {economicData.costCategory}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">PIB (milhões USD):</span>
                <span className="text-white ml-1 block">
                  {new Intl.NumberFormat('pt-BR').format(economicData.gdp)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">IDH:</span>
                <span className="text-white ml-1 block">{economicData.hdi.toFixed(3)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Categoria:</span>
                <span className="text-white ml-1">{economicData.category}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Multiplicador de custo:</span>
                <span className="text-yellow-400 ml-1 font-bold">{economicData.multiplier.toFixed(1)}x</span>
                <span className="text-gray-500 text-xs ml-1">
                  ({economicData.multiplier >= 2.0 ? 'Investimento mais caro' : 
                    economicData.multiplier >= 1.0 ? 'Investimento moderado' : 
                    'Investimento mais barato'})
                </span>
              </div>
            </div>
          </div>
        )}

        {ownershipInfo && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Preço por ação:</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'VAL'
                }).format(sharePrice)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Ações disponíveis:</span>
              <span className="text-white">{availableShares.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total investido:</span>
              <span className="text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'VAL'
                }).format(ownershipInfo.totalInvested)}
              </span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantidade de ações (%)
          </label>
          <input
            type="number"
            min="0.1"
            max={availableShares}
            step="0.1"
            value={shares}
            onChange={(e) => handleSharesChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-400 mt-1">
            Máximo: {availableShares.toFixed(1)}%
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Custo total:</span>
            <span className="text-xl font-bold text-blue-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'VAL'
              }).format(totalCost)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-30 rounded border border-red-700 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleBuy}
            disabled={loading || shares <= 0 || shares > availableShares}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processando...' : 'Comprar Ações'}
          </button>
        </div>
      </div>
    </div>
  );
}

