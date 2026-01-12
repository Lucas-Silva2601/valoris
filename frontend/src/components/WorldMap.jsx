import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import UnitMarkers from './UnitMarkers';
import InvestmentMarkers from './InvestmentMarkers';
import BuildingMarkers from './BuildingMarkers';
import NPCMarkers from './NPCMarkers';
import StateBoundaries from './StateBoundaries';
import CityBoundaries from './CityBoundaries';
import LotVisualization from './LotVisualization';
import MapLegend from './MapLegend';
import ViewportUpdater from './ViewportUpdater';
import { getCountryId, getCountryName } from '../utils/countryUtils';

// Fix para ícones padrão do Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para ajustar o mapa quando necessário
function MapController({ center, zoom, selectedFeature, onZoomChange, socket }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  // Zoom automático quando um país é selecionado
  useEffect(() => {
    if (selectedFeature && selectedFeature.geometry) {
      try {
        const polygon = turf.feature(selectedFeature.geometry);
        const bbox = turf.bbox(polygon);
        const bounds = [
          [bbox[1], bbox[0]], // [lat, lng] southwest
          [bbox[3], bbox[2]]  // [lat, lng] northeast
        ];
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      } catch (error) {
        console.error('Erro ao fazer zoom no país:', error);
      }
    }
  }, [selectedFeature, map]);

  // ✅ FASE 18.5: Rastrear mudanças de zoom para mostrar NPCs apenas em zoom alto
  // ✅ FASE 19.2: Atualizar viewport no servidor para filtragem de NPCs
  useEffect(() => {
    const updateZoomAndViewport = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
      
      // ✅ FASE 19.2: Enviar viewport atual para o servidor (throttling)
      if (socket && socket.connected) {
        try {
          const bounds = map.getBounds();
          const viewport = {
            bounds: [
              [bounds.getSouth(), bounds.getWest()], // [south, west]
              [bounds.getNorth(), bounds.getEast()]  // [north, east]
            ],
            zoom: map.getZoom(),
            center: [map.getCenter().lat, map.getCenter().lng]
          };
          
          socket.emit('update_viewport', viewport);
        } catch (error) {
          console.warn('Erro ao atualizar viewport:', error);
        }
      }
    };
    
    // Throttle para evitar muitas atualizações
    let timeoutId = null;
    const throttledUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateZoomAndViewport, 500); // Atualizar a cada 500ms
    };
    
    map.on('zoomend', throttledUpdate);
    map.on('moveend', throttledUpdate);
    // Atualizar zoom inicial
    updateZoomAndViewport();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      map.off('zoomend', throttledUpdate);
      map.off('moveend', throttledUpdate);
    };
  }, [map, onZoomChange, socket]);

  return null;
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onMapClick }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      if (onMapClick) {
        onMapClick(e);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

// 🚨 DEBUG VISUAL
console.log('✅ WorldMap.jsx carregado');

/**
 * ✅ WorldMap - Componente principal do mapa
 * Renderiza Leaflet com altura 100vh garantida
 */
export default function WorldMap({ 
  onCountryClick, 
  onCountryHover, 
  selectedCountry,
  countriesData,
  selectedCountryFeature,
  units = [],
  unitPositions = {},
  onInvestmentClick,
  buildings = [],
  socket = null,
  onMapClick,
  selectedStateId = null,
  selectedCityId = null
}) {
  const [mapCenter] = useState([20, 0]); // Centro do mundo
  const [mapZoom, setMapZoom] = useState(2);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const geoJsonLayerRef = useRef(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const mapInitializedRef = useRef(false);

  // Estilo padrão para países - cores diferentes para cada país (mapa político)
  const getCountryColor = (countryId) => {
    // Gerar cor consistente baseada no ID do país
    if (!countryId) return '#94a3b8';
    
    // Paleta de cores para mapa político (cores distintas e vibrantes)
    const colors = [
      '#3b82f6', // Azul
      '#ef4444', // Vermelho
      '#10b981', // Verde
      '#f59e0b', // Amarelo/Laranja
      '#8b5cf6', // Roxo
      '#ec4899', // Rosa
      '#06b6d4', // Ciano
      '#84cc16', // Verde limão
      '#f97316', // Laranja
      '#6366f1', // Índigo
      '#14b8a6', // Turquesa
      '#a855f7', // Violeta
      '#22c55e', // Verde esmeralda
      '#eab308', // Amarelo
      '#f43f5e', // Rosa escuro
    ];
    
    // Hash simples para gerar cor consistente baseada no ID
    let hash = 0;
    for (let i = 0; i < countryId.length; i++) {
      hash = countryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };


  // Função para obter estilo baseado no estado
  const getStyle = (feature) => {
    const countryId = getCountryId(feature) || 'UNK';
    const baseColor = getCountryColor(countryId);
    
    // Estilo para país selecionado
    if (selectedCountry && countryId === selectedCountry) {
      return {
        fillColor: '#fbbf24',
        fillOpacity: 0.7,
        color: '#f59e0b',
        weight: 3,
        opacity: 1
      };
    }
    
    // Estilo para país em hover
    if (hoveredCountry && countryId === hoveredCountry) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.95,
        color: '#ffffff',
        weight: 2.5,
        opacity: 1
      };
    }
    
    // Estilo padrão - cada país com sua cor única (mapa político sólido)
    return {
      fillColor: baseColor,
      fillOpacity: 0.9, // Muito opaco para parecer mapa político sólido
      color: '#ffffff',
      weight: 1.5,
      opacity: 1
    };
  };

  // Event handlers
  const handleEachFeature = (feature, layer) => {
    const countryName = getCountryName(feature);
    const countryId = getCountryId(feature) || 'UNK';

    // Popup com informações básicas
    layer.bindPopup(`
      <div class="text-sm">
        <strong>${countryName}</strong>
        <br/>
        <span class="text-gray-600">Clique para mais detalhes</span>
      </div>
    `);

    // Eventos de mouse
    layer.on({
      mouseover: (e) => {
        setHoveredCountry(countryId);
        if (onCountryHover) {
          onCountryHover(feature, countryId);
        }
        // Aplicar estilo de hover dinâmico
        const baseColor = getCountryColor(countryId);
        e.target.setStyle({
          fillColor: baseColor,
          fillOpacity: 0.95,
          color: '#ffffff',
          weight: 2.5,
          opacity: 1
        });
      },
      mouseout: (e) => {
        setHoveredCountry(null);
        e.target.setStyle(getStyle(feature));
      },
      click: (e) => {
        // ✅ Garantir que countryId seja extraído corretamente do GeoJSON
        const extractedCountryId = getCountryId(feature);
        const extractedCountryName = getCountryName(feature);
        
        // ✅ Usar o ID extraído (não o fallback 'UNK')
        const finalCountryId = extractedCountryId || countryId || 'UNK';
        
        console.log('📍 Clique no país:', {
          feature: feature.properties,
          countryId: finalCountryId,
          countryName: extractedCountryName,
          extractedId: extractedCountryId
        });
        
        if (onCountryClick) {
          // ✅ Passar o ID correto extraído do GeoJSON
          onCountryClick(feature, finalCountryId);
        }
        // Zoom no país
        const bounds = e.target.getBounds();
        e.target._map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  };

  // Limpar mapa quando componente for desmontado
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          // Verificar se o mapa ainda existe antes de remover
          if (mapRef.current._container && mapRef.current._container._leaflet_id) {
            mapRef.current.remove();
          }
          mapRef.current = null;
          mapInitializedRef.current = false;
          setMapReady(false);
        } catch (error) {
          console.warn('Erro ao limpar mapa:', error);
        }
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative" 
      id="world-map-container"
    >
      <MapContainer
        key="world-map-leaflet"
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={true}
        preferCanvas={true}
        whenCreated={(mapInstance) => {
          // Garantir que o mapa seja inicializado corretamente apenas uma vez
          if (!mapInitializedRef.current && !mapRef.current) {
            mapRef.current = mapInstance;
            mapInitializedRef.current = true;
            setMapReady(true);
            console.log('✅ Mapa inicializado com sucesso');
          } else {
            console.warn('⚠️ Tentativa de inicializar mapa já existente, ignorando...');
            // Destruir a instância duplicada
            try {
              mapInstance.remove();
            } catch (error) {
              console.warn('Erro ao remover instância duplicada:', error);
            }
          }
        }}
      >
        {/* ✅ FASE 19.2: Componente para atualizar viewport do jogador no servidor */}
        <ViewportUpdater />
        
        {/* TileLayer com opacidade muito baixa para servir como fundo */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          opacity={0.1}
        />
        
        {countriesData && (
          <GeoJSON
            ref={geoJsonLayerRef}
            data={countriesData}
            style={getStyle}
            onEachFeature={handleEachFeature}
          />
        )}

        {/* Marcadores de investimento (bolinhas nos países) */}
        {countriesData && mapReady && (
          <InvestmentMarkers
            countriesData={countriesData}
            onCountryClick={onInvestmentClick || onCountryClick}
            selectedCountry={selectedCountry}
          />
        )}

        {/* Marcadores de unidades militares */}
        {units.length > 0 && (
          <UnitMarkers units={units} unitPositions={unitPositions} />
        )}

        {/* ✅ Marcadores de edifícios - Mostrar TODOS os edifícios, não apenas do país selecionado */}
        {buildings.length > 0 && (
          <BuildingMarkers countryId={selectedCountry} buildings={buildings} />
        )}

        {/* ✅ FASE 18.5: Marcadores de NPCs - Mostrar apenas em zoom alto (>= 10) */}
        <NPCMarkers 
          cityId={null} 
          countryId={selectedCountry} 
          zoom={mapZoom}
        />

        {/* ✅ FASE 18.6: Limites de Estados - Mostrar quando zoom >= 6 */}
        {selectedCountry && (
          <StateBoundaries 
            countryId={selectedCountry} 
            zoom={mapZoom}
          />
        )}

        {/* ✅ FASE 18.6: Limites de Cidades - Mostrar quando zoom >= 10 */}
        {selectedStateId && (
          <CityBoundaries 
            stateId={selectedStateId} 
            zoom={mapZoom}
          />
        )}

        {/* ✅ FASE 18.6: Visualização de Lotes - Mostrar quando zoom >= 12 */}
        {selectedCityId && (
          <LotVisualization 
            cityId={selectedCityId} 
            zoom={mapZoom}
          />
        )}

        {/* ✅ FASE 18.6: Legenda do Mapa */}
        <MapLegend zoom={mapZoom} />

        {/* Handler de clique no mapa */}
        {onMapClick && (
          <MapClickHandler onMapClick={onMapClick} />
        )}

        <MapController 
          center={mapCenter}
          zoom={mapZoom}
          selectedFeature={selectedCountryFeature}
          onZoomChange={setMapZoom}
          socket={socket}
        />
      </MapContainer>
    </div>
  );
}

