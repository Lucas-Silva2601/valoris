import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);



export default function SystemHealthDashboard() {
  const [health, setHealth] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [dbMetrics, setDbMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const [healthRes, systemRes, dbRes] = await Promise.all([
        fetch(`${await getApiUrl()}/monitoring/health`, { headers }),
        fetch(`${await getApiUrl()}/monitoring/system`, { headers }),
        fetch(`${await getApiUrl()}/monitoring/database`, { headers })
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemMetrics(systemData);
      }

      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbMetrics(dbData);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas do sistema:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando métricas do sistema...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Monitoramento do Sistema</h2>

      {/* Status Geral */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Status Geral do Sistema</h3>
          <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(health?.status)}`}>
            {health?.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Checks de Saúde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health?.checks && Object.entries(health.checks).map(([key, check]) => (
          <div key={key} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold capitalize">{key}</h4>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(check.status)}`}>
                {check.status}
              </span>
            </div>
            {check.message && (
              <p className="text-sm text-gray-600">{check.message}</p>
            )}
            {check.percent && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      check.percent > 80 ? 'bg-red-500' :
                      check.percent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${check.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{check.percent.toFixed(2)}%</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Métricas do Node.js */}
      {systemMetrics?.node && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Métricas do Node.js</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Heap Usado</div>
              <div className="text-lg font-semibold">
                {formatBytes(systemMetrics.node.memory.heapUsed)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Heap Total</div>
              <div className="text-lg font-semibold">
                {formatBytes(systemMetrics.node.memory.heapTotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">RSS</div>
              <div className="text-lg font-semibold">
                {formatBytes(systemMetrics.node.memory.rss)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Uptime</div>
              <div className="text-lg font-semibold">
                {Math.floor(systemMetrics.node.uptime / 3600)}h
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Métricas do Sistema */}
      {systemMetrics?.system && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Métricas do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Memória Total</div>
              <div className="text-lg font-semibold">
                {formatBytes(systemMetrics.system.totalMemory)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Memória Usada</div>
              <div className="text-lg font-semibold">
                {formatBytes(systemMetrics.system.usedMemory)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Uso de Memória</div>
              <div className="text-lg font-semibold">
                {systemMetrics.system.memoryUsagePercent?.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">CPUs</div>
              <div className="text-lg font-semibold">
                {systemMetrics.system.cpuCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Métricas do Banco de Dados */}
      {dbMetrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Métricas do Banco de Dados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbMetrics.server && (
              <>
                <div>
                  <div className="text-sm text-gray-500">Versão MongoDB</div>
                  <div className="text-lg font-semibold">
                    {dbMetrics.server.version}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Conexões Ativas</div>
                  <div className="text-lg font-semibold">
                    {dbMetrics.server.connections?.current || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Uptime</div>
                  <div className="text-lg font-semibold">
                    {Math.floor((dbMetrics.server.uptime || 0) / 3600)}h
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Coleções</div>
                  <div className="text-lg font-semibold">
                    {dbMetrics.collections?.length || 0}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

