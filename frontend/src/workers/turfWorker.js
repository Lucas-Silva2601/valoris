/**
 * ✅ FASE 19.2: Web Worker para cálculos geográficos com Turf.js
 * Mover cálculos de "ponto dentro do polígono" para um Web Worker
 * Isso impede que a UI congele enquanto verifica se o clique foi no Brasil ou no mar
 */

import * as turf from '@turf/turf';

/**
 * Worker principal
 */
self.onmessage = function(e) {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'pointInPolygon': {
        const { point, polygon } = payload;
        const turfPoint = turf.point([point[0], point[1]]);
        const turfPolygon = turf.polygon(polygon.coordinates);
        const result = turf.booleanPointInPolygon(turfPoint, turfPolygon);
        
        self.postMessage({
          type: 'pointInPolygon:result',
          payload: {
            result,
            pointId: payload.pointId
          }
        });
        break;
      }

      case 'pointInPolygonBatch': {
        const { points, polygon } = payload;
        const turfPolygon = turf.polygon(polygon.coordinates);
        const results = points.map(point => {
          const turfPoint = turf.point([point[0], point[1]]);
          return {
            point,
            result: turf.booleanPointInPolygon(turfPoint, turfPolygon),
            pointId: point.pointId
          };
        });
        
        self.postMessage({
          type: 'pointInPolygonBatch:result',
          payload: {
            results,
            polygonId: payload.polygonId
          }
        });
        break;
      }

      case 'identifyCountryFromPoint': {
        const { point, features } = payload;
        const turfPoint = turf.point([point[0], point[1]]);
        
        for (const feature of features) {
          if (!feature.geometry) continue;
          
          let polygon = null;
          if (feature.geometry.type === 'Polygon') {
            polygon = turf.polygon(feature.geometry.coordinates);
          } else if (feature.geometry.type === 'MultiPolygon') {
            for (const coords of feature.geometry.coordinates) {
              polygon = turf.polygon(coords);
              if (turf.booleanPointInPolygon(turfPoint, polygon)) {
                break;
              }
            }
          }
          
          if (polygon && turf.booleanPointInPolygon(turfPoint, polygon)) {
            const props = feature.properties || {};
            const countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK';
            const countryName = props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido';
            
            self.postMessage({
              type: 'identifyCountryFromPoint:result',
              payload: {
                valid: true,
                countryId,
                countryName,
                feature: feature
              }
            });
            return;
          }
        }
        
        self.postMessage({
          type: 'identifyCountryFromPoint:result',
          payload: {
            valid: false,
            countryId: null,
            countryName: null
          }
        });
        break;
      }

      default:
        self.postMessage({
          type: 'error',
          payload: {
            message: `Tipo de operação desconhecido: ${type}`
          }
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};
