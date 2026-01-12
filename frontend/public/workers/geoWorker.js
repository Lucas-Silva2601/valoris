/**
 * ✅ FASE 19.2: Web Worker para cálculos geográficos com Turf.js
 * Move cálculos pesados para thread separada, evitando travar a UI
 */

// Importar Turf.js (será bundlado separadamente)
importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');

// Listen for messages from main thread
self.onmessage = function(e) {
  const { type, data, id } = e.data;

  try {
    switch (type) {
      case 'pointInPolygon': {
        const { point, polygon } = data;
        const turfPoint = turf.point(point);
        const turfPolygon = turf.polygon(polygon.coordinates);
        const isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
        
        self.postMessage({
          id,
          success: true,
          result: isInside
        });
        break;
      }

      case 'pointInMultiPolygon': {
        const { point, multiPolygon } = data;
        const turfPoint = turf.point(point);
        let isInside = false;

        for (const coords of multiPolygon.coordinates) {
          const turfPolygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
            isInside = true;
            break;
          }
        }

        self.postMessage({
          id,
          success: true,
          result: isInside
        });
        break;
      }

      case 'findContainingCountry': {
        const { point, countries } = data;
        const turfPoint = turf.point(point);
        
        for (const country of countries) {
          if (!country.geometry) continue;

          let polygon = null;
          if (country.geometry.type === 'Polygon') {
            polygon = turf.polygon(country.geometry.coordinates);
          } else if (country.geometry.type === 'MultiPolygon') {
            for (const coords of country.geometry.coordinates) {
              polygon = turf.polygon(coords);
              if (turf.booleanPointInPolygon(turfPoint, polygon)) {
                break;
              }
            }
          }

          if (polygon && turf.booleanPointInPolygon(turfPoint, polygon)) {
            self.postMessage({
              id,
              success: true,
              result: {
                valid: true,
                country: country.properties,
                countryId: country.properties.ISO_A3 || country.properties.ADM0_A3 || country.properties.ISO3 || 'UNK',
                countryName: country.properties.name || country.properties.NAME || country.properties.NAME_EN || country.properties.ADMIN || 'País Desconhecido'
              }
            });
            return;
          }
        }

        self.postMessage({
          id,
          success: true,
          result: {
            valid: false,
            country: null,
            countryId: null,
            countryName: null
          }
        });
        break;
      }

      default:
        self.postMessage({
          id,
          success: false,
          error: `Tipo de operação desconhecido: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

