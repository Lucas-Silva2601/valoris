import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache para dados GeoJSON
let countriesGeoJSONCache = null;

// ✅ FALLBACK: GeoJSON mínimo com alguns países principais
const getFallbackGeoJSON = () => {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Brazil',
          ISO_A3: 'BRA',
          ADM0_A3: 'BRA',
          ISO_A2: 'BR'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-73.987235, -33.751277],
            [-34.729993, -33.751277],
            [-34.729993, 5.272388],
            [-73.987235, 5.272388],
            [-73.987235, -33.751277]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'United States',
          ISO_A3: 'USA',
          ADM0_A3: 'USA',
          ISO_A2: 'US'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-125.0, 24.0],
            [-66.0, 24.0],
            [-66.0, 49.0],
            [-125.0, 49.0],
            [-125.0, 24.0]
          ]]
        }
      }
    ]
  };
};

// Função para carregar dados GeoJSON
const loadCountriesGeoJSON = () => {
  if (countriesGeoJSONCache) {
    return countriesGeoJSONCache;
  }

  try {
    // Tentar carregar arquivo local se existir
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (fs.existsSync(geoJsonPath)) {
      const data = fs.readFileSync(geoJsonPath, 'utf8');
      countriesGeoJSONCache = JSON.parse(data);
      return countriesGeoJSONCache;
    } else {
      // ✅ Retornar GeoJSON fallback em vez de vazio
      console.warn('⚠️  Arquivo GeoJSON não encontrado. Usando dados fallback.');
      const fallback = getFallbackGeoJSON();
      countriesGeoJSONCache = fallback;
      return fallback;
    }
  } catch (error) {
    console.error('Erro ao carregar GeoJSON:', error);
    // ✅ Retornar GeoJSON fallback em vez de vazio
    const fallback = getFallbackGeoJSON();
    countriesGeoJSONCache = fallback;
    return fallback;
  }
};

// Endpoint para obter dados GeoJSON dos países
router.get('/geojson', (req, res) => {
  try {
    const geoJsonData = loadCountriesGeoJSON();
    
    // ✅ Sempre retornar dados (mesmo que seja fallback)
    res.json(geoJsonData);
  } catch (error) {
    console.error('Erro ao servir GeoJSON:', error);
    // ✅ Retornar fallback em vez de erro 500
    const fallback = getFallbackGeoJSON();
    res.json(fallback);
  }
});

// Endpoint para obter informações de um país específico
router.get('/:countryId', (req, res) => {
  try {
    const { countryId } = req.params;
    const geoJsonData = loadCountriesGeoJSON();
    
    const country = geoJsonData.features.find(
      feature => 
        feature.properties.ISO_A3 === countryId ||
        feature.properties.ADM0_A3 === countryId ||
        feature.properties.ISO_A2 === countryId
    );

    if (!country) {
      return res.status(404).json({ error: 'País não encontrado' });
    }

    res.json(country);
  } catch (error) {
    console.error('Erro ao buscar país:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar informações do país',
      message: error.message 
    });
  }
});

// Endpoint para obter dados econômicos de um país
router.get('/:countryId/economic', async (req, res) => {
  try {
    const { countryId } = req.params;
    const { getCountryEconomicData, getCostCategory } = await import('../data/countryEconomicData.js');
    
    const economicData = getCountryEconomicData(countryId);
    const costCategory = getCostCategory(countryId);
    
    res.json({
      ...economicData,
      costCategory
    });
  } catch (error) {
    console.error('Erro ao buscar dados econômicos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados econômicos',
      message: error.message 
    });
  }
});

export default router;

