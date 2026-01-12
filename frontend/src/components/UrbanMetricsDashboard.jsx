import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
import { API_BASE_URL } from '../config/api';

/**
 * ✅ FASE 18.5: Dashboard de Métricas Urbanas
 * Exibe qualidade de vida, felicidade e métricas urbanas de uma cidade
 */
export default function UrbanMetricsDashboard({ cityId, cityName }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cityId) {
      loadMetrics();
    }
  }, [cityId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/urban-life/cities/${cityId}/metrics`, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId') || 'test-user-id'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas urbanas');
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando métricas urbanas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">Nenhuma métrica disponível para esta cidade</p>
      </div>
    );
  }

  // Gráfico de Qualidade de Vida
  const qualityOfLifeData = {
    labels: ['Equilíbrio Casas/Empregos', 'Diversidade de Edifícios', 'População'],
    datasets: [{
      label: 'Pontuação',
      data: [
        metrics.factors?.housingJobsBalance || 0,
        (metrics.factors?.buildingDiversity || 0) * 100,
        Math.min((metrics.factors?.population || 0) / 50, 20)
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Gráfico de Distribuição de Edifícios
  const buildingDistributionData = {
    labels: ['Residencial', 'Comercial', 'Industrial', 'Serviços'],
    datasets: [{
      data: [
        metrics.factors?.residentialBuildings || 0,
        metrics.factors?.commercialBuildings || 0,
        metrics.factors?.industrialBuildings || 0,
        metrics.factors?.serviceBuildings || 0
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Função para obter cor baseada em valor
  const getColorForValue = (value) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColorForValue = (value) => {
    if (value >= 80) return 'bg-green-100 border-green-300';
    if (value >= 60) return 'bg-blue-100 border-blue-300';
    if (value >= 40) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-300">
          📊 Métricas Urbanas - {cityName || metrics.cityName || 'Cidade'}
        </h3>
        <button
          onClick={loadMetrics}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
          title="Atualizar métricas"
        >
          🔄
        </button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-3 rounded-lg border ${getBgColorForValue(metrics.qualityOfLife)}`}>
          <div className="text-gray-300 text-xs font-medium">Qualidade de Vida</div>
          <div className={`text-xl font-bold mt-1 ${getColorForValue(metrics.qualityOfLife)}`}>
            {metrics.qualityOfLife.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">/ 100</div>
        </div>

        <div className={`p-3 rounded-lg border ${getBgColorForValue(metrics.happiness)}`}>
          <div className="text-gray-300 text-xs font-medium">Felicidade</div>
          <div className={`text-xl font-bold mt-1 ${getColorForValue(metrics.happiness)}`}>
            {metrics.happiness.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">/ 100</div>
        </div>

        <div className="p-3 rounded-lg border bg-purple-900 border-purple-700">
          <div className="text-gray-300 text-xs font-medium">Bônus Impostos</div>
          <div className="text-xl font-bold mt-1 text-purple-300">
            {metrics.taxMultiplier.toFixed(2)}x
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {metrics.taxMultiplier > 1 ? '+' : ''}{((metrics.taxMultiplier - 1) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-indigo-900 border-indigo-700">
          <div className="text-gray-300 text-xs font-medium">Bônus Yield</div>
          <div className="text-xl font-bold mt-1 text-indigo-300">
            {metrics.yieldMultiplier.toFixed(2)}x
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {metrics.yieldMultiplier > 1 ? '+' : ''}{((metrics.yieldMultiplier - 1) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-gray-600 rounded">
          <div className="text-gray-300">Edifícios</div>
          <div className="text-white font-bold mt-1">
            {metrics.factors?.totalBuildings || 0}
          </div>
        </div>

        <div className="p-2 bg-gray-600 rounded">
          <div className="text-gray-300">População</div>
          <div className="text-white font-bold mt-1">
            {metrics.factors?.population || 0}
          </div>
        </div>

        <div className="p-2 bg-gray-600 rounded">
          <div className="text-gray-300">Equilíbrio</div>
          <div className="text-white font-bold mt-1">
            {metrics.factors?.housingJobsBalance?.toFixed(0) || 0}%
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {metrics.factors?.totalHousing || 0}H/{metrics.factors?.totalJobs || 0}E
          </div>
        </div>
      </div>

      {/* Gráficos (compactos) */}
      <div className="space-y-3">
        <div className="p-2 bg-gray-600 rounded">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">Fatores de Qualidade de Vida</h4>
          <Bar
            data={qualityOfLifeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { font: { size: 10 }, color: '#9CA3AF' },
                  grid: { color: '#4B5563' }
                },
                x: {
                  ticks: { font: { size: 9 }, color: '#9CA3AF' }
                }
              }
            }}
            height={150}
          />
        </div>
      </div>

      {/* Recomendações */}
      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-300 mb-2">💡 Recomendações</h4>
          <ul className="space-y-1">
            {metrics.recommendations.map((rec, index) => (
              <li key={index} className="text-blue-200 text-xs flex items-start">
                <span className="mr-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

