import { useEffect, useState } from 'react';
import { CircleMarker, useMap } from 'react-leaflet';
import { API_BASE_URL } from '../config/api';

/**
 * ✅ FASE 18.6: Componente para visualizar lotes ocupados/vazios nas cidades
 * Aparece quando zoom >= 12
 */
export default function LotVisualization({ cityId, zoom }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mostrar lotes apenas em zoom muito alto (>= 12)
    if (zoom < 12 || !cityId) {
      setLots([]);
      return;
    }

    const loadLots = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/geography/cities/${cityId}/lots`);
        if (response.ok) {
          const data = await response.json();
          setLots(data.lots || data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar lotes:', error);
        // Se a rota não existir, não mostrar erro (feature opcional)
      } finally {
        setLoading(false);
      }
    };

    loadLots();
  }, [cityId, zoom]);

  if (loading || lots.length === 0) {
    return null;
  }

  return (
    <>
      {lots.map((lot) => {
        if (!lot.position_lat || !lot.position_lng) return null;
        
        const isOccupied = lot.is_occupied || lot.isOccupied;
        const color = isOccupied ? '#EF4444' : '#10B981'; // Vermelho ocupado, Verde vazio
        const radius = isOccupied ? 4 : 3;
        
        return (
          <CircleMarker
            key={lot.id || lot.lot_id}
            center={[lot.position_lat, lot.position_lng]}
            radius={radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 1,
              opacity: 0.8
            }}
          >
            <Tooltip>
              <div>
                <strong>Lote {lot.lot_id || lot.id}</strong><br/>
                Status: {isOccupied ? 'Ocupado' : 'Disponível'}<br/>
                {lot.building_id && `Edifício: ${lot.building_id}`}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

