import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MissionsPanel() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('available'); // available, my, accepted

  useEffect(() => {
    loadMissions();
  }, [filter]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      let endpoint = '/missions/available';
      if (filter === 'my') {
        endpoint = '/missions/my';
      }

      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        { headers: filter === 'available' ? {} : headers },
        3000
      );

      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
      } else {
        setMissions([]);
      }
    } catch (error) {
      // Silenciar erros de conexão
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMission = async (missionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/missions/${missionId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadMissions();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao aceitar missão');
      }
    } catch (error) {
      console.error('Erro ao aceitar missão:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'military': return '⚔️';
      case 'economic': return '💰';
      case 'diplomatic': return '🤝';
      case 'exploration': return '🗺️';
      default: return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-400';
      case 'accepted': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-gray-400 text-sm">Carregando missões...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Missões</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('available')}
            className={`text-xs px-2 py-1 rounded ${
              filter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`text-xs px-2 py-1 rounded ${
              filter === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Minhas
          </button>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-4">
          Nenhuma missão disponível
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {missions.map((mission) => (
            <div
              key={mission.missionId}
              className="bg-gray-700 rounded p-3 text-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(mission.type)}</span>
                  <div>
                    <div className="text-white font-medium">{mission.title}</div>
                    <div className="text-xs text-gray-400">
                      Por: {mission.creatorId?.username || 'Desconhecido'}
                    </div>
                  </div>
                </div>
                <span className={`text-xs ${getStatusColor(mission.status)}`}>
                  {mission.status}
                </span>
              </div>

              <div className="text-xs text-gray-300 mb-2">
                {mission.description}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Recompensa:{' '}
                  <span className="text-green-400 font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'VAL'
                    }).format(mission.reward.amount)}
                  </span>
                </div>

                {mission.status === 'open' && filter === 'available' && (
                  <button
                    onClick={() => handleAcceptMission(mission.missionId)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    Aceitar
                  </button>
                )}

                {mission.status === 'in_progress' && (
                  <div className="text-xs text-gray-400">
                    Progresso: {mission.progress.current}/{mission.progress.target}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

