import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MilitaryUnitModal({ country, onClose, onSuccess }) {
  const [unitType, setUnitType] = useState('tank');
  const [unitStats, setUnitStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUnitStats();
  }, []);

  const loadUnitStats = async () => {
    try {
      const response = await fetch(`${API_URL}/military/units/stats`);
      if (response.ok) {
        const data = await response.json();
        setUnitStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreateUnit = async () => {
    if (!country) return;

    setLoading(true);
    setError(null);

    try {
      const stats = unitStats?.[unitType];
      if (!stats) {
        throw new Error('Estatísticas não carregadas');
      }

      // Usar centro do país como posição inicial
      const position = {
        lat: country.geometry?.coordinates?.[0]?.[0]?.[1] || 0,
        lng: country.geometry?.coordinates?.[0]?.[0]?.[0] || 0
      };

      const headers = {
        'Content-Type': 'application/json',
        'user-id': '507f1f77bcf86cd799439011',
        'username': 'testuser'
      };

      const response = await fetch(`${API_URL}/military/units`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          countryId: country.id,
          countryName: country.name,
          type: unitType,
          position
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess(data);
        }
        onClose();
      } else {
        setError(data.error || 'Erro ao criar unidade');
      }
    } catch (error) {
      setError('Erro ao processar criação');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!country || !unitStats) return null;

  const stats = unitStats[unitType];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Comprar Unidade Militar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Unidade
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['tank', 'ship', 'plane'].map(type => (
              <button
                key={type}
                onClick={() => setUnitType(type)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  unitType === type
                    ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">
                  {type === 'tank' ? '🚗' : type === 'ship' ? '🚢' : '✈️'}
                </div>
                <div className="text-xs text-gray-300 capitalize">{unitStats[type]?.name}</div>
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Saúde:</span>
                <span className="text-white ml-2">{stats.health}</span>
              </div>
              <div>
                <span className="text-gray-400">Ataque:</span>
                <span className="text-white ml-2">{stats.attack}</span>
              </div>
              <div>
                <span className="text-gray-400">Defesa:</span>
                <span className="text-white ml-2">{stats.defense}</span>
              </div>
              <div>
                <span className="text-gray-400">Velocidade:</span>
                <span className="text-white ml-2">{stats.speed}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Custo:</span>
            <span className="text-xl font-bold text-blue-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'VAL'
              }).format(stats?.cost || 0)}
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
            onClick={handleCreateUnit}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Criando...' : 'Comprar Unidade'}
          </button>
        </div>
      </div>
    </div>
  );
}

