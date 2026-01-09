import { useState, useEffect } from 'react';
import UnitsList from './UnitsList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function UnitControlPanel({ countryId, onUnitSelect }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);

  const handleMoveUnit = async () => {
    if (!selectedUnit || !targetPosition) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/military/units/${selectedUnit.unitId}/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetLat: targetPosition.lat,
          targetLng: targetPosition.lng
        })
      });

      if (response.ok) {
        alert('Unidade em movimento!');
        setSelectedUnit(null);
        setTargetPosition(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao mover unidade');
      }
    } catch (error) {
      console.error('Erro ao mover unidade:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Controle de Unidades</h3>
      
      <UnitsList />

      {selectedUnit && (
        <div className="mt-4 p-3 bg-gray-700 rounded">
          <div className="text-sm text-white mb-2">
            Unidade selecionada: {selectedUnit.name}
          </div>
          <div className="text-xs text-gray-400 mb-2">
            Posição: {selectedUnit.position.lat.toFixed(2)}, {selectedUnit.position.lng.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Saúde: {selectedUnit.health.current}/{selectedUnit.health.max}
          </div>
          
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Latitude"
              step="0.01"
              className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
              onChange={(e) => setTargetPosition(prev => ({
                ...prev,
                lat: parseFloat(e.target.value)
              }))}
            />
            <input
              type="number"
              placeholder="Longitude"
              step="0.01"
              className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
              onChange={(e) => setTargetPosition(prev => ({
                ...prev,
                lng: parseFloat(e.target.value)
              }))}
            />
            <button
              onClick={handleMoveUnit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded transition-colors"
            >
              Mover Unidade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

