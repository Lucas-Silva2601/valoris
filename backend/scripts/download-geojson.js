import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL para dados GeoJSON de países - Fonte completa e atualizada
// Usando dados do Natural Earth via GitHub (mais completo e preciso)
const GEOJSON_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

// Alternativas (comentadas - descomente se a primeira não funcionar):
// const GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
// const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

const OUTPUT_PATH = path.join(__dirname, '../data/countries.geojson');

/**
 * Baixa dados GeoJSON de países
 */
async function downloadGeoJSON() {
  return new Promise((resolve, reject) => {
    console.log('📥 Baixando dados GeoJSON de países...');
    
    https.get(GEOJSON_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Erro ao baixar: ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const geoJson = JSON.parse(data);
          
          // Garantir que o diretório existe
          const dir = path.dirname(OUTPUT_PATH);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          // Salvar arquivo
          fs.writeFileSync(OUTPUT_PATH, JSON.stringify(geoJson, null, 2));
          console.log(`✅ Dados GeoJSON salvos em: ${OUTPUT_PATH}`);
          console.log(`📊 Total de países: ${geoJson.features?.length || 0}`);
          
          resolve(geoJson);
        } catch (error) {
          reject(new Error(`Erro ao processar JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Executar se chamado diretamente
downloadGeoJSON()
  .then(() => {
    console.log('✅ Download concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });

export default downloadGeoJSON;

