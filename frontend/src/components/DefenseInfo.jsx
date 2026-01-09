import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DefenseInfo({ countryId }) {
  const [defenseInfo, setDefenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (countryId) {
      loadDefenseInfo();
    }
  }, [countryId]);

  const loadDefenseInfo = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(`${API_URL}/defense/${countryId}`, {}, 3000);
      
      if (response.ok) {
        const data = await response.json();
        setDefenseInfo(data);
      }
    } catch (error) {
      // Silenciar erros de conexão
      setDefenseInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (!countryId || loading) {
    return null;
  }

  if (!defenseInfo) {
    return null;
  }

  return (
    <div className="bg-gray-700 rounded-lg p-3 text-sm">
      <div className="text-xs font-semibold text-gray-300 mb-2">Sistema de Defesa</div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Nível de Defesa:</span>
          <span className="text-white">{defenseInfo.defenseLevel}/10</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Nível Tecnológico:</span>
          <span className="text-white">{defenseInfo.technologyLevel}/10</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Poder de Defesa:</span>
          <span className="text-green-400 font-semibold">{defenseInfo.defensePower}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Defesa Automática:</span>
          <span className={defenseInfo.autoDefenseEnabled ? 'text-green-400' : 'text-red-400'}>
            {defenseInfo.autoDefenseEnabled ? 'Ativada' : 'Desativada'}
          </span>
        </div>
      </div>
    </div>
  );
}

