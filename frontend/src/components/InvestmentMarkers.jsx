import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

/**
 * Componente que renderiza bolinhas clicáveis no centro de cada país
 * para permitir investimento
 */
export default function InvestmentMarkers({ 
  countriesData, 
  onCountryClick,
  selectedCountry 
}) {
  const map = useMap();
  const markersRef = useRef([]);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!countriesData || !countriesData.features || !map) return;

    // Aguardar o mapa estar pronto
    if (!map.getContainer()) {
      return;
    }

    // Criar grupo de camadas para os marcadores
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      // Limpar marcadores anteriores
      layerGroupRef.current.clearLayers();
    }

    markersRef.current = [];

    // Criar marcador para cada país
    countriesData.features.forEach((feature) => {
      try {
        const countryId = feature.properties.ISO_A3 || feature.properties.ADM0_A3;
        const countryName = feature.properties.NAME || feature.properties.NAME_EN || 'País';
        
        // Calcular centroide do país
        const polygon = turf.feature(feature.geometry);
        const centroid = turf.centroid(polygon);
        const [lng, lat] = centroid.geometry.coordinates;

        // Criar ícone customizado (bolinha)
        const isSelected = selectedCountry === countryId;
        const iconSize = isSelected ? 16 : 12;
        const iconColor = isSelected ? '#fbbf24' : '#3b82f6';
        
        const customIcon = L.divIcon({
          className: 'investment-marker',
          html: `
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              background-color: ${iconColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s;
            "></div>
          `,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2]
        });

        // Criar marcador
        const marker = L.marker([lat, lng], { icon: customIcon });

        // Adicionar popup com nome do país
        marker.bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <strong>${countryName}</strong><br/>
            <small style="color: #666;">Clique para investir</small>
          </div>
        `);

        // Evento de clique
        marker.on('click', () => {
          if (onCountryClick) {
            onCountryClick(feature, countryId);
          }
        });

        // Efeito hover
        marker.on('mouseover', () => {
          marker.setIcon(L.divIcon({
            className: 'investment-marker',
            html: `
              <div style="
                width: 18px;
                height: 18px;
                background-color: #fbbf24;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                cursor: pointer;
                transition: all 0.2s;
              "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          }));
        });

        marker.on('mouseout', () => {
          marker.setIcon(customIcon);
        });

        // Adicionar ao grupo
        layerGroupRef.current.addLayer(marker);
        markersRef.current.push(marker);
      } catch (error) {
        console.warn('Erro ao criar marcador para país:', feature.properties.NAME, error);
      }
    });

    // Cleanup
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [countriesData, map, onCountryClick, selectedCountry]);

  return null;
}

