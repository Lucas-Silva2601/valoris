import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import { API_BASE_URL } from '../config/api';
import { geoJsonCache } from '../utils/geoJsonCache';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * ✅ FASE 18.6: Componente para mostrar limites de estados no mapa
 * Aparece quando zoom >= 6
 */
export default function StateBoundaries({ countryId, zoom }) {
  const [statesGeoJSON, setStatesGeoJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const map = useMap();

  useEffect(() => {
    // Mostrar estados apenas em zoom >= 6
    // ✅ Validar countryId antes de fazer requisição
    if (zoom < 6 || !countryId || countryId === 'undefined' || countryId === 'null') {
      setStatesGeoJSON(null);
      return;
    }

    const loadStates = async () => {
      // ✅ FASE 18.7: Verificar cache primeiro
      const cached = geoJsonCache.get('state', countryId);
      if (cached) {
        setStatesGeoJSON(cached);
        return;
      }

      setLoading(true);
      performanceMonitor.start(`geoJson:states:${countryId}`);

      try {
        const response = await fetch(`${API_BASE_URL}/geography/states/${countryId}`);
        if (response.ok) {
          const data = await response.json();
          
          let geoJSON = null;
          
          // Converter estados do banco para GeoJSON FeatureCollection
          if (data.features) {
            geoJSON = data;
          } else if (Array.isArray(data)) {
            // Se vier array, converter para FeatureCollection
            const features = data
              .filter(state => state.geometry)
              .map(state => ({
                type: 'Feature',
                properties: {
                  name: state.name,
                  stateId: state.stateId || state.state_id,
                  code: state.code
                },
                geometry: typeof state.geometry === 'string' ? JSON.parse(state.geometry) : state.geometry
              }));
            
            geoJSON = {
              type: 'FeatureCollection',
              features
            };
          }

          if (geoJSON) {
            // ✅ FASE 18.7: Armazenar no cache
            geoJsonCache.set('state', countryId, geoJSON);
            setStatesGeoJSON(geoJSON);
          } else {
            // ✅ FASE 19.1: Fallback - dados padrão vazios se API não retornar GeoJSON válido
            console.warn('⚠️ API de estados não retornou GeoJSON válido, usando fallback vazio');
            setStatesGeoJSON({ type: 'FeatureCollection', features: [] });
          }
        } else {
          // ✅ FASE 19.1: Fallback - resposta não OK, usar dados padrão vazios
          console.warn('⚠️ API de estados retornou erro, usando fallback vazio');
          setStatesGeoJSON({ type: 'FeatureCollection', features: [] });
        }
      } catch (error) {
        // ✅ FASE 19.1: Fallback - erro de fetch, usar dados padrão vazios
        console.warn('⚠️ Erro ao carregar estados, usando fallback vazio:', error.message);
        setStatesGeoJSON({ type: 'FeatureCollection', features: [] });
      } finally {
        setLoading(false);
        performanceMonitor.end(`geoJson:states:${countryId}`);
      }
    };

    loadStates();
  }, [countryId, zoom]);

  if (!statesGeoJSON || loading) {
    return null;
  }

  const getStateStyle = (feature) => {
    return {
      fillColor: '#4A90E2',
      fillOpacity: 0.1,
      color: '#2563EB',
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 5'
    };
  };

  return (
    <GeoJSON
      data={statesGeoJSON}
      style={getStateStyle}
      onEachFeature={(feature, layer) => {
        const props = feature.properties || {};
        layer.bindTooltip(`Estado: ${props.name || 'Desconhecido'}`, {
          permanent: false,
          direction: 'top'
        });
      }}
    />
  );
}

