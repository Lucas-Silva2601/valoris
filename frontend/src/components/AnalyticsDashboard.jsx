import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      // Calcular datas baseado no período
      const endDate = new Date();
      const startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate.setDate(startDate.getDate() - 90);
      }

      const [statsRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/analytics/stats`, { headers }),
        fetch(`${API_URL}/analytics/metrics/period?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando analytics...</div>
      </div>
    );
  }

  // Dados para gráfico de jogadores ativos
  const activePlayersData = {
    labels: metrics.map(m => new Date(m.date).toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Jogadores Ativos',
      data: metrics.map(m => m.activePlayers || 0),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  // Dados para gráfico de transações
  const transactionsData = {
    labels: metrics.map(m => new Date(m.date).toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Valor Total (VAL)',
      data: metrics.map(m => m.totalTransactionValue || 0),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1
    }]
  };

  // Dados para países mais investidos
  const topCountriesData = stats?.topCountries?.slice(0, 5) || [];
  const countriesChartData = {
    labels: topCountriesData.map(c => c.countryId),
    datasets: [{
      label: 'Investimento Total (VAL)',
      data: topCountriesData.map(c => c.totalValue || 0),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard de Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
        </select>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total de Jogadores</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">
            {stats?.totalPlayers || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Ativos (24h)</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.activeLast24h || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Transações</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {stats?.totalTransactions || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Combates</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {stats?.totalCombats || 0}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Jogadores Ativos</h3>
          <Line data={activePlayersData} options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transações</h3>
          <Bar data={transactionsData} options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            }
          }} />
        </div>
      </div>

      {/* Países mais investidos */}
      {topCountriesData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 5 Países Mais Investidos</h3>
          <div className="max-w-md mx-auto">
            <Doughnut data={countriesChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} />
          </div>
          <div className="mt-4 space-y-2">
            {topCountriesData.map((country, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{country.countryId}</span>
                <span className="text-gray-600">
                  {country.totalValue?.toLocaleString('pt-BR')} VAL
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

