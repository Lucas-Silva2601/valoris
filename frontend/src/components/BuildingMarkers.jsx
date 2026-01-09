import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Criar ícones customizados para cada tipo de edifício
const createBuildingIcon = (type, level) => {
  const icons = {
    house: '🏠',
    apartment: '🏢',
    office: '🏛️',
    skyscraper: '🏙️',
    factory: '🏭',
    mall: '🏬'
  };

  const emoji = icons[type] || '🏗️';
  const size = Math.min(20 + level * 2, 40); // Tamanho baseado no nível

  return L.divIcon({
    className: 'custom-building-icon',
    html: `<div style="font-size: ${size}px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function BuildingMarkers({ countryId, buildings = [] }) {
  const map = useMap();
  const [visibleBuildings, setVisibleBuildings] = useState(buildings);

  // Filtrar edifícios visíveis baseado no zoom
  useEffect(() => {
    const updateVisibleBuildings = () => {
      const zoom = map.getZoom();
      // Mostrar todos os edifícios se zoom >= 8, senão apenas os maiores
      if (zoom >= 8) {
        setVisibleBuildings(buildings);
      } else {
        setVisibleBuildings(buildings.filter(b => b.type === 'skyscraper' || b.level >= 5));
      }
    };

    updateVisibleBuildings();
    map.on('zoomend', updateVisibleBuildings);

    return () => {
      map.off('zoomend', updateVisibleBuildings);
    };
  }, [map, buildings]);

  if (!countryId || visibleBuildings.length === 0) {
    return null;
  }

  return (
    <>
      {visibleBuildings.map((building) => (
        <Marker
          key={building.buildingId}
          position={[building.position.lat, building.position.lng]}
          icon={createBuildingIcon(building.type, building.level)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold mb-1">{building.name}</div>
              <div>Tipo: {building.type}</div>
              <div>Nível: {building.level}</div>
              <div>Capacidade: {building.capacity} pessoas</div>
              {building.revenuePerHour > 0 && (
                <div>Receita: {building.revenuePerHour.toFixed(2)} VAL/hora</div>
              )}
              <div>Condição: {building.condition}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {building.countryName}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

