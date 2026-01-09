import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function UnitsList() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadUnits, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUnits = async () => {
    try {
      const headers = {
        'user-id': '507f1f77bcf86cd799439011',
        'username': 'testuser'
      };

      const response = await fetch(`${API_URL}/military/units`, { headers });
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitIcon = (type) => {
    switch (type) {
      case 'tank': return '🚗';
      case 'ship': return '🚢';
      case 'plane': return '✈️';
      default: return '⚔️';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'text-green-400';
      case 'moving': return 'text-blue-400';
      case 'attacking': return 'text-red-400';
      case 'defending': return 'text-yellow-400';
      case 'destroyed': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-gray-400 text-sm">Carregando unidades...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Unidades Militares</h3>
        <button
          onClick={loadUnits}
          className="text-gray-400 hover:text-white transition-colors"
          title="Atualizar"
        >
          🔄
        </button>
      </div>

      {units.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-4">
          Nenhuma unidade criada
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {units.map((unit) => (
            <div
              key={unit.unitId}
              className="bg-gray-700 rounded p-2 text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getUnitIcon(unit.type)}</span>
                  <span className="text-white font-medium">{unit.name}</span>
                </div>
                <span className={`text-xs ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Saúde: {unit.health.current}/{unit.health.max}
              </div>
              <div className="text-xs text-gray-400">
                Posição: {unit.position.lat.toFixed(2)}, {unit.position.lng.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

