import React, { memo, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { debounce } from '../utils/performance';

/**
 * Versão otimizada do WorldMap com memoização
 */
const WorldMapOptimized = memo(({ 
  countriesData, 
  selectedCountry,
  onCountryClick,
  onCountryHover 
}) => {
  // Memoizar estilo para evitar recálculos
  const getStyle = useCallback((feature) => {
    const defaultStyle = {
      fillColor: '#1e40af',
      fillOpacity: 0.3,
      color: '#3b82f6',
      weight: 1
    };

    if (selectedCountry && 
        (feature.properties.ISO_A3 === selectedCountry || 
         feature.properties.ADM0_A3 === selectedCountry)) {
      return {
        ...defaultStyle,
        fillColor: '#fbbf24',
        fillOpacity: 0.6,
        weight: 3
      };
    }

    return defaultStyle;
  }, [selectedCountry]);

  // Debounce de hover para melhor performance
  const debouncedHover = useMemo(
    () => debounce((feature, countryId) => {
      if (onCountryHover) {
        onCountryHover(feature, countryId);
      }
    }, 100),
    [onCountryHover]
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {countriesData && (
        <GeoJSON
          data={countriesData}
          style={getStyle}
          onEachFeature={(feature, layer) => {
            const countryId = feature.properties.ISO_A3 || feature.properties.ADM0_A3;
            
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.5,
                  weight: 2
                });
                debouncedHover(feature, countryId);
              },
              mouseout: (e) => {
                e.target.setStyle(getStyle(feature));
              },
              click: (e) => {
                if (onCountryClick) {
                  onCountryClick(feature, countryId);
                }
              }
            });
          }}
        />
      )}
    </MapContainer>
  );
});

WorldMapOptimized.displayName = 'WorldMapOptimized';

export default WorldMapOptimized;

