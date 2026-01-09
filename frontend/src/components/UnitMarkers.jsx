import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Criar ícones customizados para cada tipo de unidade
const createUnitIcon = (type) => {
  const icons = {
    tank: '🚗',
    ship: '🚢',
    plane: '✈️'
  };

  return L.divIcon({
    className: 'custom-unit-icon',
    html: `<div style="font-size: 24px; text-align: center;">${icons[type] || '⚔️'}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

export default function UnitMarkers({ units, unitPositions }) {
  const map = useMap();

  // Combinar unidades com posições atualizadas
  const unitsWithPositions = units.map(unit => {
    const updatedPosition = unitPositions[unit.unitId];
    return {
      ...unit,
      position: updatedPosition?.position || unit.position,
      status: updatedPosition?.status || unit.status,
      health: updatedPosition?.health || unit.health
    };
  });

  return (
    <>
      {unitsWithPositions.map((unit) => (
        <Marker
          key={unit.unitId}
          position={[unit.position.lat, unit.position.lng]}
          icon={createUnitIcon(unit.type)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold mb-1">{unit.name}</div>
              <div>Tipo: {unit.type}</div>
              <div>Saúde: {unit.health.current}/{unit.health.max}</div>
              <div>Status: {unit.status}</div>
              <div>País: {unit.countryId}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

