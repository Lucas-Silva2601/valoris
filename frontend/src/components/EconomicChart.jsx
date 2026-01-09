import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EconomicChart({ countryId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (countryId) {
      loadHistory();
    }
  }, [countryId]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/economic/${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!countryId || loading) {
    return (
      <div className="h-32 bg-gray-700 rounded flex items-center justify-center">
        <div className="text-gray-400 text-sm">Carregando gráfico...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-32 bg-gray-700 rounded flex items-center justify-center">
        <div className="text-gray-400 text-sm">Sem dados históricos</div>
      </div>
    );
  }

  // Preparar dados para o gráfico (últimos 10 pontos)
  const chartData = history.slice(-10);
  const maxHealth = Math.max(...chartData.map(h => h.healthScore || 0), 100);
  const minHealth = Math.min(...chartData.map(h => h.healthScore || 0), 0);

  return (
    <div className="bg-gray-700 rounded p-3">
      <div className="text-xs font-semibold text-gray-300 mb-2">Histórico de Saúde Econômica</div>
      <div className="h-24 relative">
        <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
          {/* Linha de fundo */}
          <line
            x1="0"
            y1="40"
            x2="200"
            y2="40"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          
          {/* Linha do gráfico */}
          <polyline
            points={chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 200;
              const y = 80 - ((point.healthScore || 0) / 100) * 80;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Área preenchida */}
          <polygon
            points={`0,80 ${chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 200;
              const y = 80 - ((point.healthScore || 0) / 100) * 80;
              return `${x},${y}`;
            }).join(' ')} 200,80`}
            fill="rgba(59, 130, 246, 0.2)"
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Mín: {minHealth.toFixed(0)}</span>
        <span>Máx: {maxHealth.toFixed(0)}</span>
      </div>
    </div>
  );
}

