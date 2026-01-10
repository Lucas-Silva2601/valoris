import { createLogger } from './logger.js';
import { checkConnection } from '../config/supabase.js';
import walletRepository from '../repositories/walletRepository.js';
import npcRepository from '../repositories/npcRepository.js';

const logger = createLogger('SeedDatabase');

// ✅ Cores de pele diversificadas (tons de marrom, bege e bronze)
const SKIN_COLORS = [
  '#8d5524', '#c68642', '#e0ac69', '#f1c27d',
  '#ffdbac', '#c68642', '#9d7a5a', '#6b4e3d',
  '#5c4a3a', '#7a5c42', '#a6896d', '#b8916d'
];

/**
 * ✅ Função de Auto-Seed para dados de teste
 * Executada automaticamente após conexão com MongoDB
 */
export const seedDatabase = async () => {
  try {
    logger.info('🌱 Iniciando seed automático do banco de dados...');

    // Verificar se Supabase está conectado
    if (!checkConnection()) {
      logger.warn('⚠️  Supabase não está conectado. Seed não será executado.');
      return { success: false, message: 'Supabase não conectado' };
    }

    // 1. ✅ GARANTIR SALDO DE 100.000 VAL PARA USUÁRIO DE TESTE
    const testUserId = 'test-user-id';
    
    let wallet = await walletRepository.findByUserId(testUserId);
    
    if (!wallet) {
      // Criar carteira com saldo inicial
      wallet = await walletRepository.create({
        user_id: testUserId,
        balance: 100000,
        total_earned: 100000,
        total_spent: 0
      });
      logger.info(`💰 Carteira criada para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else if (parseFloat(wallet.balance) < 100000) {
      // Garantir saldo mínimo de 100.000 VAL
      const amountToAdd = 100000 - parseFloat(wallet.balance);
      wallet = await walletRepository.update(wallet.id, {
        balance: 100000,
        total_earned: parseFloat(wallet.total_earned || 0) + amountToAdd
      });
      logger.info(`💰 Saldo garantido para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else {
      logger.info(`💰 Usuário de teste já possui saldo suficiente: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    }

    // 2. ✅ CRIAR NPCs SE A COLEÇÃO ESTIVER VAZIA OU POUCOS NPCs
    const npcCount = await npcRepository.count();
    
    if (npcCount < 500) {
      const targetCount = 1000; // ✅ AUMENTAR para 1000 NPCs para melhor distribuição
      const npcsToAdd = targetCount - npcCount;
      logger.info(`👥 Criando ${npcsToAdd} NPCs (total: ${targetCount})...`);
      
      const npcsToCreate = [];
      
      // ✅ CARREGAR TODOS OS PAÍSES DO GeoJSON
      let countriesGeoJSON = null;
      let countries = [];
      
      try {
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
        
        logger.info(`📍 Tentando carregar GeoJSON de: ${geoJsonPath}`);
        
        if (fs.existsSync(geoJsonPath)) {
          logger.info('✅ Arquivo GeoJSON encontrado!');
          const data = fs.readFileSync(geoJsonPath, 'utf8');
          countriesGeoJSON = JSON.parse(data);
          
          logger.info(`📊 GeoJSON carregado: ${countriesGeoJSON?.features?.length || 0} features encontradas`);
          
          // Extrair todos os países do GeoJSON
          if (countriesGeoJSON && countriesGeoJSON.features && Array.isArray(countriesGeoJSON.features) && countriesGeoJSON.features.length > 0) {
            for (const feature of countriesGeoJSON.features) {
              if (!feature.geometry || !feature.properties) continue;
              
              // Obter ID do país
              const countryId = feature.properties.ISO_A3 || 
                               feature.properties.ADM0_A3 || 
                               feature.properties.ISO3 || 
                               null;
              
              // Obter nome do país
              const countryName = feature.properties.NAME || 
                                  feature.properties.NAME_EN || 
                                  feature.properties.NAME_LONG || 
                                  feature.properties.ADMIN || 
                                  'País Desconhecido';
              
              if (!countryId) continue; // Pular se não tiver ID
              
              // ✅ Calcular centro do país (centroide do polígono) com tratamento robusto
              let center = { lat: 0, lng: 0 };
              try {
                const turf = await import('@turf/turf');
                let polygon = null;
                
                if (feature.geometry && feature.geometry.type === 'Polygon') {
                  if (feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates)) {
                    try {
                      polygon = turf.polygon(feature.geometry.coordinates);
                    } catch (polyError) {
                      logger.warn(`Erro ao criar polígono para ${countryName}:`, polyError.message);
                    }
                  }
                } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                  // Usar o primeiro polígono do MultiPolygon (geralmente o maior)
                  if (feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates) &&
                      feature.geometry.coordinates.length > 0) {
                    try {
                      // Escolher o polígono com mais coordenadas (geralmente o principal)
                      const largestPolygon = feature.geometry.coordinates.reduce((largest, current) => {
                        const currentSize = current[0]?.length || 0;
                        const largestSize = largest[0]?.length || 0;
                        return currentSize > largestSize ? current : largest;
                      }, feature.geometry.coordinates[0]);
                      
                      if (largestPolygon && Array.isArray(largestPolygon)) {
                        polygon = turf.polygon(largestPolygon);
                      }
                    } catch (polyError) {
                      logger.warn(`Erro ao criar MultiPolygon para ${countryName}:`, polyError.message);
                      // Tentar usar o primeiro polígono como fallback
                      try {
                        if (feature.geometry.coordinates[0] && Array.isArray(feature.geometry.coordinates[0])) {
                          polygon = turf.polygon(feature.geometry.coordinates[0]);
                        }
                      } catch (fallbackError) {
                        logger.warn(`Erro no fallback de polígono para ${countryName}`);
                      }
                    }
                  }
                }
                
                if (polygon) {
                  try {
                    const centroid = turf.centroid(polygon);
                    if (centroid && centroid.geometry && centroid.geometry.coordinates &&
                        Array.isArray(centroid.geometry.coordinates) && centroid.geometry.coordinates.length >= 2) {
                      center = { 
                        lat: parseFloat(centroid.geometry.coordinates[1]), 
                        lng: parseFloat(centroid.geometry.coordinates[0]) 
                      };
                      
                      // ✅ Validar centroide calculado
                      if (isNaN(center.lat) || isNaN(center.lng) ||
                          center.lat < -90 || center.lat > 90 ||
                          center.lng < -180 || center.lng > 180) {
                        logger.warn(`Centroide inválido calculado para ${countryName}:`, center);
                        center = { lat: 0, lng: 0 }; // Resetar para usar fallback
                      }
                    }
                  } catch (centroidError) {
                    logger.warn(`Erro ao calcular centroide para ${countryName}:`, centroidError.message);
                    center = { lat: 0, lng: 0 };
                  }
                }
              } catch (error) {
                // Se não conseguir calcular centroide, usar coordenadas aproximadas
                logger.warn(`Não foi possível calcular centroide para ${countryName}:`, error.message);
                center = { lat: 0, lng: 0 };
              }
              
              // ✅ Se centroide não foi calculado (0,0 ou inválido), usar coordenadas conhecidas do país
              if ((center.lat === 0 && center.lng === 0) || isNaN(center.lat) || isNaN(center.lng)) {
                // Coordenadas aproximadas conhecidas de países comuns
                const countryCoords = {
                  'BRA': { lat: -14.2350, lng: -51.9253 }, // Brasil
                  'USA': { lat: 37.0902, lng: -95.7129 }, // EUA
                  'CHN': { lat: 35.8617, lng: 104.1954 }, // China
                  'ARG': { lat: -38.4161, lng: -63.6167 }, // Argentina
                  'PER': { lat: -9.1900, lng: -75.0152 }, // Peru
                  'BOL': { lat: -16.2902, lng: -63.5887 }, // Bolívia
                  'COL': { lat: 4.5709, lng: -74.2973 }, // Colômbia
                  'VEN': { lat: 6.4238, lng: -66.5897 }, // Venezuela
                  'URY': { lat: -32.5228, lng: -55.7658 }, // Uruguai
                  'PRY': { lat: -23.4425, lng: -58.4438 }, // Paraguai
                };
                
                const knownCoords = countryCoords[countryId?.toUpperCase()] || countryCoords[countryId?.substring(0, 3)?.toUpperCase()];
                if (knownCoords) {
                  center = knownCoords;
                  logger.info(`Usando coordenadas conhecidas para ${countryName}:`, center);
                } else {
                  // Fallback: usar hash do país para gerar coordenadas únicas mas determinísticas
                  const hash = countryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  center.lat = (hash % 180) - 90;
                  center.lng = ((hash * 7) % 360) - 180;
                  logger.warn(`Usando coordenadas baseadas em hash para ${countryName}:`, center);
                }
              }
              
              countries.push({
                id: countryId.toUpperCase(),
                name: countryName,
                center: center,
                feature: feature
              });
            }
            
            logger.info(`✅ Carregados ${countries.length} países do GeoJSON`);
          } else {
            logger.warn(`⚠️  GeoJSON não tem features válidas. Features count: ${countriesGeoJSON?.features?.length || 0}`);
          }
        } else {
          logger.warn(`⚠️  Arquivo GeoJSON não encontrado em: ${geoJsonPath}`);
        }
      } catch (error) {
        logger.error('❌ Erro ao carregar GeoJSON:', {
          message: error.message,
          stack: error.stack?.substring(0, 300)
        });
      }
      
      // ✅ Se não conseguiu carregar países do GeoJSON, usar lista padrão expandida
      if (!countries || countries.length === 0) {
        logger.warn('⚠️  Usando lista padrão de países (GeoJSON não disponível ou vazio)');
        countries = [
          { id: 'BRA', name: 'Brasil', center: { lat: -14.2350, lng: -51.9253 } },
          { id: 'USA', name: 'Estados Unidos', center: { lat: 37.0902, lng: -95.7129 } },
          { id: 'CHN', name: 'China', center: { lat: 35.8617, lng: 104.1954 } },
          { id: 'ARG', name: 'Argentina', center: { lat: -38.4161, lng: -63.6167 } },
          { id: 'PER', name: 'Peru', center: { lat: -9.1900, lng: -75.0152 } },
          { id: 'BOL', name: 'Bolívia', center: { lat: -16.2902, lng: -63.5887 } },
          { id: 'COL', name: 'Colômbia', center: { lat: 4.5709, lng: -74.2973 } },
          { id: 'VEN', name: 'Venezuela', center: { lat: 6.4238, lng: -66.5897 } },
          { id: 'URY', name: 'Uruguai', center: { lat: -32.5228, lng: -55.7658 } },
          { id: 'PRY', name: 'Paraguai', center: { lat: -23.4425, lng: -58.4438 } },
          { id: 'CHL', name: 'Chile', center: { lat: -35.6751, lng: -71.5430 } },
          { id: 'ECU', name: 'Equador', center: { lat: -1.8312, lng: -78.1834 } }
        ];
        logger.info(`✅ Usando ${countries.length} países da lista padrão`);
      }
      
      // ✅ GARANTIR que temos pelo menos alguns países para distribuir NPCs
      if (!countries || countries.length === 0) {
        logger.error('❌ Nenhum país disponível para criar NPCs!');
        throw new Error('Não foi possível carregar países do GeoJSON nem usar lista padrão');
      }
      
      logger.info(`🌍 Total de países disponíveis para distribuir NPCs: ${countries.length}`);

      const names = [
        'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia',
        'Lucas', 'Fernanda', 'Rafael', 'Mariana', 'Gabriel', 'Beatriz',
        'Thiago', 'Camila', 'Felipe', 'Isabela', 'Bruno', 'Larissa',
        'Ricardo', 'Patricia', 'André', 'Juliana', 'Rodrigo', 'Vanessa',
        'Roberto', 'Amanda', 'Diego', 'Carolina', 'Marcos', 'Leticia',
        'Paulo', 'Renata', 'Gustavo', 'Priscila', 'Daniel', 'Tatiana'
      ];

      // ✅ Criar NPCs distribuídos por TODOS os países
      // Distribuir NPCs igualmente entre todos os países
      const npcsPerCountry = Math.max(1, Math.floor(npcsToAdd / countries.length));
      let npcIndex = 0;
      
      logger.info(`📊 Distribuindo NPCs: ${npcsPerCountry} por país, ${countries.length} países disponíveis`);
      
      for (const country of countries) {
        if (npcIndex >= npcsToAdd) break;
        
        // Criar alguns NPCs para este país
        const npcsForThisCountry = Math.min(npcsPerCountry, npcsToAdd - npcIndex);
        
        // ✅ GARANTIR que cada país tenha coordenadas únicas ANTES de criar NPCs
        let centerLat = country.center?.lat || 0;
        let centerLng = country.center?.lng || 0;
        
        // ✅ Se centroide não foi calculado ou é inválido (0,0), usar coordenadas conhecidas ou hash único
        if ((centerLat === 0 && centerLng === 0) || isNaN(centerLat) || isNaN(centerLng)) {
          logger.warn(`⚠️  Centroide inválido para ${country.name} (${country.id}). Usando coordenadas conhecidas ou hash.`);
          
          // Coordenadas conhecidas expandidas de países comuns (principalmente América do Sul)
          const countryCoords = {
            'BRA': { lat: -14.2350, lng: -51.9253 }, // Brasil
            'USA': { lat: 37.0902, lng: -95.7129 }, // EUA
            'CHN': { lat: 35.8617, lng: 104.1954 }, // China
            'ARG': { lat: -38.4161, lng: -63.6167 }, // Argentina
            'PER': { lat: -9.1900, lng: -75.0152 }, // Peru
            'BOL': { lat: -16.2902, lng: -63.5887 }, // Bolívia
            'COL': { lat: 4.5709, lng: -74.2973 }, // Colômbia
            'VEN': { lat: 6.4238, lng: -66.5897 }, // Venezuela
            'URY': { lat: -32.5228, lng: -55.7658 }, // Uruguai
            'PRY': { lat: -23.4425, lng: -58.4438 }, // Paraguai
            'CHL': { lat: -35.6751, lng: -71.5430 }, // Chile
            'ECU': { lat: -1.8312, lng: -78.1834 }, // Equador
            'GUY': { lat: 4.8604, lng: -58.9302 }, // Guiana
            'SUR': { lat: 3.9193, lng: -56.0278 }, // Suriname
            'GUF': { lat: 3.9339, lng: -53.1258 }, // Guiana Francesa
          };
          
          const knownCoords = countryCoords[country.id?.toUpperCase()] || 
                             countryCoords[country.id?.substring(0, 3)?.toUpperCase()];
          
          if (knownCoords) {
            centerLat = knownCoords.lat;
            centerLng = knownCoords.lng;
            logger.info(`✅ Usando coordenadas conhecidas para ${country.name} (${country.id}):`, { centerLat, centerLng });
          } else {
            // ✅ Fallback: usar hash único do countryId para gerar coordenadas determinísticas mas únicas
            const hash = country.id.split('').reduce((acc, char, idx) => acc + (char.charCodeAt(0) * (idx + 1)), 0);
            // Usar hash para gerar coordenadas espalhadas pelo globo
            centerLat = ((hash % 180) - 90) + ((hash % 17) / 10); // -90 a 90 com variação
            centerLng = (((hash * 7) % 360) - 180) + ((hash % 23) / 10); // -180 a 180 com variação
            logger.warn(`⚠️  Usando coordenadas baseadas em hash para ${country.name} (${country.id}):`, { centerLat, centerLng });
          }
          
          // ✅ Atualizar o center do país para usar nas próximas iterações
          country.center = { lat: centerLat, lng: centerLng };
        }
        
        // ✅ Validar que o centroide final é válido
        if (isNaN(centerLat) || isNaN(centerLng) || 
            centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
          logger.error(`❌ Centroide final inválido para ${country.name}:`, { centerLat, centerLng });
          // Usar Brasil como fallback final
          centerLat = -14.2350;
          centerLng = -51.9253;
          country.center = { lat: centerLat, lng: centerLng };
        }
        
        logger.info(`🌍 Criando ${npcsForThisCountry} NPCs para ${country.name} (${country.id}) em posição:`, { centerLat, centerLng });
        
        for (let i = 0; i < npcsForThisCountry; i++) {
          // ✅ AUMENTAR variação para melhor distribuição geográfica
          // Variação aumentada para ~1-5 graus (~110-550km) para espalhar NPCs pelo país inteiro
          // Usar distribuição em círculo com variação aleatória para evitar concentração
          const baseAngle = (i / npcsForThisCountry) * 2 * Math.PI; // Distribuir em círculo base
          const angleVariation = (Math.random() - 0.5) * 0.5; // Variação de até 90 graus
          const angle = baseAngle + angleVariation;
          const radius = 1 + (Math.random() * 4); // 1-5 graus de raio (~110-550km) - MAIOR VARIAÇÃO
          const randomOffsetLat = Math.cos(angle) * radius;
          const randomOffsetLng = Math.sin(angle) * radius;
          
          const npcId = `npc_${Date.now()}_${npcIndex}_${Math.random().toString(36).substr(2, 9)}`;
          const randomName = names[Math.floor(Math.random() * names.length)];
          const randomSkinColor = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)];
          
          const npcPosition = {
            lat: parseFloat((centerLat + randomOffsetLat).toFixed(7)),
            lng: parseFloat((centerLng + randomOffsetLng).toFixed(7))
          };
          
          // ✅ Garantir que a posição seja válida E dentro dos limites do planeta
          if (isNaN(npcPosition.lat) || isNaN(npcPosition.lng)) {
            logger.error(`Posição NaN gerada para NPC em ${country.name}. Usando centroide.`);
            npcPosition.lat = centerLat;
            npcPosition.lng = centerLng;
          }
          
          // ✅ Ajustar para limites válidos se necessário (sem gerar erro, apenas ajustar)
          if (npcPosition.lat < -90) npcPosition.lat = -89.999;
          if (npcPosition.lat > 90) npcPosition.lat = 89.999;
          if (npcPosition.lng < -180) npcPosition.lng = -179.999;
          if (npcPosition.lng > 180) npcPosition.lng = 179.999;
          
          npcsToCreate.push({
            npcId,
            name: randomName,
            countryId: country.id,
            countryName: country.name,
            position: npcPosition,
            skinColor: randomSkinColor,
            currentTask: 'idle',
            status: 'idle',
            npcType: Math.random() > 0.5 ? 'resident' : 'worker',
            speed: 5,
            direction: Math.random() * 360,
            lastMovementTime: new Date(),
            nextActionTime: new Date(Date.now() + (30000 + Math.random() * 90000))
          });
          
          npcIndex++;
        }
      }

      // ✅ Inserir todos os NPCs de uma vez (mais eficiente)
      if (npcsToCreate.length > 0) {
        // ✅ Converter para formato Supabase e GARANTIR que todos têm posição válida
        const npcsForSupabase = npcsToCreate.map(npc => {
          const formatted = npcRepository.formatToSupabase(npc);
          
          // ✅ GARANTIR que position_lat e position_lng sempre existam e sejam válidos
          if (!formatted.position_lat || !formatted.position_lng ||
              isNaN(formatted.position_lat) || isNaN(formatted.position_lng)) {
            logger.error(`NPC ${npc.npcId} sem posição válida antes de inserir. Tentando usar coordenadas do país.`);
            
            // ✅ Usar coordenadas do país (npc.countryId) se disponível, senão usar hash único baseado no npcId
            const countryCoords = {
              'BRA': { lat: -14.2350, lng: -51.9253 },
              'USA': { lat: 37.0902, lng: -95.7129 },
              'ARG': { lat: -38.4161, lng: -63.6167 },
              'PER': { lat: -9.1900, lng: -75.0152 },
              'BOL': { lat: -16.2902, lng: -63.5887 },
              'COL': { lat: 4.5709, lng: -74.2973 },
              'VEN': { lat: 6.4238, lng: -66.5897 },
            };
            
            const knownCoords = countryCoords[npc.countryId?.toUpperCase()];
            if (knownCoords) {
              formatted.position_lat = knownCoords.lat;
              formatted.position_lng = knownCoords.lng;
            } else {
              // ✅ Fallback: usar hash do npcId para gerar coordenadas únicas mas válidas
              const hash = npc.npcId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              formatted.position_lat = (hash % 180) - 90; // -90 a 90
              formatted.position_lng = ((hash * 7) % 360) - 180; // -180 a 180
            }
          }
          
          // ✅ Garantir que valores são números válidos
          formatted.position_lat = parseFloat(formatted.position_lat);
          formatted.position_lng = parseFloat(formatted.position_lng);
          
          // ✅ Validar limites
          if (formatted.position_lat < -90 || formatted.position_lat > 90 ||
              formatted.position_lng < -180 || formatted.position_lng > 180) {
            logger.error(`NPC ${npc.npcId} com posição fora dos limites. Ajustando...`);
            formatted.position_lat = Math.max(-90, Math.min(90, formatted.position_lat));
            formatted.position_lng = Math.max(-180, Math.min(180, formatted.position_lng));
          }
          
          return formatted;
        });
        
        try {
          await npcRepository.createMany(npcsForSupabase);
          logger.info(`✅ ${npcsToCreate.length} NPCs criados com sucesso!`);
        } catch (error) {
          logger.error(`Erro ao criar NPCs em lote:`, error.message || error);
          // Tentar criar um por um para identificar qual está causando problema
          logger.warn('Tentando criar NPCs individualmente para identificar problema...');
          let successCount = 0;
          for (const npcData of npcsForSupabase) {
            try {
              await npcRepository.create(npcData);
              successCount++;
            } catch (individualError) {
              logger.error(`Erro ao criar NPC individual:`, individualError.message || individualError);
            }
          }
          logger.info(`✅ ${successCount}/${npcsToCreate.length} NPCs criados com sucesso!`);
        }
      }
    } else {
      logger.info(`👥 Já existem ${npcCount} NPCs no banco de dados`);
    }

    logger.info('✅ Seed automático concluído com sucesso!');
    return { success: true, walletBalance: wallet.balance, npcCount: await npcRepository.count() };
  } catch (error) {
    logger.error('❌ Erro no seed automático:', error);
    throw error;
  }
};

