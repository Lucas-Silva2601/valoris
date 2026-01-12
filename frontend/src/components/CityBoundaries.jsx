import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { API_BASE_URL } from '../config/api';
import { geoJsonCache } from '../utils/geoJsonCache';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * ✅ FASE 18.6: Componente para mostrar limites de cidades no mapa
 * Aparece quando zoom >= 10
 */
export default function CityBoundaries({ stateId, zoom }) {
  const [citiesGeoJSON, setCitiesGeoJSON] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mostrar cidades apenas em zoom >= 10
    // ✅ Validar stateId antes de fazer requisição
    if (zoom < 10 || !stateId || stateId === 'undefined' || stateId === 'null') {
      setCitiesGeoJSON(null);
      return;
    }

    const loadCities = async () => {
      // ✅ FASE 18.7: Verificar cache primeiro
      const cached = geoJsonCache.get('city', stateId);
      if (cached) {
        setCitiesGeoJSON(cached);
        return;
      }

      setLoading(true);
      performanceMonitor.start(`geoJson:cities:${stateId}`);

      try {
        const response = await fetch(`${API_BASE_URL}/geography/cities/${stateId}`);
        if (response.ok) {
          const data = await response.json();
          
          let geoJSON = null;
          
          // Converter cidades do banco para GeoJSON FeatureCollection
          if (data.features) {
            geoJSON = data;
          } else if (Array.isArray(data)) {
            // Se vier array, converter para FeatureCollection
            const features = data
              .filter(city => city.geometry)
              .map(city => ({
                type: 'Feature',
                properties: {
                  name: city.name,
                  cityId: city.cityId || city.city_id,
                  population: city.population || 0,
                  landValue: city.landValue || city.land_value || 0
                },
                geometry: typeof city.geometry === 'string' ? JSON.parse(city.geometry) : city.geometry
              }));
            
            geoJSON = {
              type: 'FeatureCollection',
              features
            };
          }

          if (geoJSON) {
            // ✅ FASE 18.7: Armazenar no cache
            geoJsonCache.set('city', stateId, geoJSON);
            setCitiesGeoJSON(geoJSON);
          } else {
            // ✅ FASE 19.1: Fallback - dados padrão vazios se API não retornar GeoJSON válido
            console.warn('⚠️ API de cidades não retornou GeoJSON válido, usando fallback vazio');
            setCitiesGeoJSON({ type: 'FeatureCollection', features: [] });
          }
        } else {
          // ✅ FASE 19.1: Fallback - resposta não OK, usar dados padrão vazios
          console.warn('⚠️ API de cidades retornou erro, usando fallback vazio');
          setCitiesGeoJSON({ type: 'FeatureCollection', features: [] });
        }
      } catch (error) {
        // ✅ FASE 19.1: Fallback - erro de fetch, usar dados padrão vazios
        console.warn('⚠️ Erro ao carregar cidades, usando fallback vazio:', error.message);
        setCitiesGeoJSON({ type: 'FeatureCollection', features: [] });
      } finally {
        setLoading(false);
        performanceMonitor.end(`geoJson:cities:${stateId}`);
      }
    };

    loadCities();
  }, [stateId, zoom]);

  if (!citiesGeoJSON || loading) {
    return null;
  }

  const getCityStyle = (feature) => {
    const population = feature.properties?.population || 0;
    const landValue = feature.properties?.landValue || 0;
    
    // Cor baseada na população e land_value
    let fillColor = '#10B981'; // Verde padrão
    let opacity = 0.15;
    
    if (population > 1000) {
      fillColor = '#F59E0B'; // Laranja para cidades grandes
      opacity = 0.2;
    }
    if (landValue > 5000) {
      fillColor = '#EF4444'; // Vermelho para áreas caras
      opacity = 0.25;
    }
    
    return {
      fillColor,
      fillOpacity: opacity,
      color: '#059669',
      weight: 1.5,
      opacity: 0.5,
      dashArray: '3, 3'
    };
  };

  return (
    <GeoJSON
      data={citiesGeoJSON}
      style={getCityStyle}
      onEachFeature={(feature, layer) => {
        const props = feature.properties || {};
        const population = props.population || 0;
        const landValue = props.landValue || 0;
        
        layer.bindTooltip(
          `<div>
            <strong>${props.name || 'Cidade'}</strong><br/>
            População: ${population.toLocaleString()}<br/>
            Land Value: ${landValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
          </div>`,
          {
            permanent: false,
            direction: 'top'
          }
        );
      }}
    />
  );
}

