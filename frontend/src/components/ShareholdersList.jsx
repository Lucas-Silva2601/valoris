import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';



export default function ShareholdersList({ countryId }) {
  const [shareholders, setShareholders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (countryId) {
      loadShareholders();
    }
  }, [countryId]);

  const loadShareholders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${await getApiUrl()}/ownership/${countryId}/shareholders`);
      
      if (response.ok) {
        const data = await response.json();
        setShareholders(data.shareholders || []);
      }
    } catch (error) {
      console.error('Erro ao carregar acionistas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!countryId) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-sm">Carregando acionistas...</div>
    );
  }

  if (shareholders.length === 0) {
    return (
      <div className="text-gray-400 text-sm">Nenhum acionista encontrado</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-400 mb-2">Acionistas</div>
      {shareholders.map((shareholder, index) => (
        <div
          key={index}
          className="flex justify-between items-center bg-gray-700 rounded p-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {shareholder.userId?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div className="text-white font-medium">
                {shareholder.userId?.username || 'Desconhecido'}
              </div>
              <div className="text-xs text-gray-400">
                Comprado em: {new Date(shareholder.purchasedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-semibold">
              {shareholder.shares.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              {((shareholder.shares / 100) * 100).toFixed(1)}% do total
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

