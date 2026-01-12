import lotRepository from '../repositories/lotRepository.js';
import cityRepository from '../repositories/cityRepository.js';
import * as turf from '@turf/turf';

/**
 * ✅ FASE 18.2: Serviço de Grid/Lotes
 * Gerencia o sistema de grade dentro de cidades para evitar sobreposição de construções
 */

/**
 * Calcular grade/lotes dentro de uma cidade baseado no polígono
 * @param {string} cityId - ID da cidade
 * @param {Object} cityGeometry - GeoJSON geometry da cidade
 * @param {number} gridSize - Tamanho da grade em graus (padrão: 0.001 ~111m)
 */
export const generateCityGrid = async (cityId, cityGeometry, gridSize = 0.001) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    // Calcular bounding box da cidade
    let bbox;
    try {
      const feature = turf.feature(cityGeometry);
      bbox = turf.bbox(feature);
    } catch (error) {
      // Se não conseguir calcular bbox, usar geometria aproximada
      console.warn(`Erro ao calcular bbox para cidade ${cityId}:`, error);
      return [];
    }

    // Criar grade dentro do bbox
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const lots = [];

    // Gerar pontos da grade
    for (let lat = minLat; lat <= maxLat; lat += gridSize) {
      for (let lng = minLng; lng <= maxLng; lng += gridSize) {
        const point = turf.point([lng, lat]);

        // Verificar se o ponto está dentro do polígono da cidade
        let isInside = false;
        try {
          if (cityGeometry.type === 'Polygon') {
            const polygon = turf.polygon(cityGeometry.coordinates);
            isInside = turf.booleanPointInPolygon(point, polygon);
          } else if (cityGeometry.type === 'MultiPolygon') {
            for (const coords of cityGeometry.coordinates) {
              const polygon = turf.polygon(coords);
              if (turf.booleanPointInPolygon(point, polygon)) {
                isInside = true;
                break;
              }
            }
          }
        } catch (error) {
          continue; // Pular pontos inválidos
        }

        if (isInside) {
          // Calcular grid_x e grid_y baseado na posição
          const gridX = Math.round((lng - minLng) / gridSize);
          const gridY = Math.round((lat - minLat) / gridSize);

          const lotId = `lot_${cityId}_${gridX}_${gridY}`;

          lots.push({
            lotId: lotId,
            cityId: cityId,
            positionLat: parseFloat(lat.toFixed(7)),
            positionLng: parseFloat(lng.toFixed(7)),
            gridX: gridX,
            gridY: gridY,
            isOccupied: false
          });
        }
      }
    }

    // Salvar lotes no banco de dados (apenas os que não existem)
    const existingLots = await lotRepository.findByCityId(cityId);
    const existingGridPositions = new Set(
      existingLots.map(lot => `${lot.gridX}_${lot.gridY}`)
    );

    const lotsToCreate = lots.filter(lot => {
      const gridKey = `${lot.gridX}_${lot.gridY}`;
      return !existingGridPositions.has(gridKey);
    });

    if (lotsToCreate.length > 0) {
      try {
        // Criar lotes em lote (batch)
        await lotRepository.createMany(lotsToCreate);
        console.log(`✅ Criados ${lotsToCreate.length} lotes para cidade ${cityId}`);
      } catch (error) {
        console.error(`Erro ao criar lotes em lote:`, error);
        // Tentar criar um por um
        let createdCount = 0;
        for (const lot of lotsToCreate) {
          try {
            // Verificar se já existe antes de criar
            const existing = await lotRepository.findByGridPosition(cityId, lot.gridX, lot.gridY);
            if (!existing) {
              await lotRepository.create(lot);
              createdCount++;
            }
          } catch (individualError) {
            console.error(`Erro ao criar lote individual:`, individualError);
          }
        }
        console.log(`✅ Criados ${createdCount} lotes individuais para cidade ${cityId}`);
      }
    }

    return lots;
  } catch (error) {
    console.error(`Erro ao gerar grade para cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Obter ou gerar lotes para uma cidade
 * @param {string} cityId - ID da cidade
 */
export const getOrGenerateCityLots = async (cityId) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city) {
      throw new Error(`Cidade ${cityId} não encontrada`);
    }

    // Verificar se já existem lotes
    const existingLots = await lotRepository.findByCityId(cityId);
    
    if (existingLots && existingLots.length > 0) {
      return existingLots;
    }

    // Se não existem lotes e temos geometria, gerar grade
    if (city.geometry) {
      return await generateCityGrid(cityId, city.geometry);
    }

    return [];
  } catch (error) {
    console.error(`Erro ao obter lotes para cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Encontrar um lote disponível na cidade
 * @param {string} cityId - ID da cidade
 * @param {number} lat - Latitude preferencial (opcional)
 * @param {number} lng - Longitude preferencial (opcional)
 */
export const findAvailableLot = async (cityId, lat = null, lng = null) => {
  try {
    // Garantir que existem lotes
    await getOrGenerateCityLots(cityId);

    // Se há coordenadas preferenciais, buscar lote mais próximo disponível
    if (lat !== null && lng !== null) {
      const allLots = await lotRepository.findByCityId(cityId);
      const availableLots = allLots.filter(lot => !lot.isOccupied);

      if (availableLots.length === 0) {
        throw new Error(`Nenhum lote disponível na cidade ${cityId}`);
      }

      // Encontrar lote mais próximo
      let closestLot = availableLots[0];
      let minDistance = Infinity;

      for (const lot of availableLots) {
        const distance = turf.distance(
          turf.point([lng, lat]),
          turf.point([lot.positionLng, lot.positionLat]),
          { units: 'kilometers' }
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestLot = lot;
        }
      }

      return closestLot;
    }

    // Se não há preferência, buscar primeiro disponível
    const availableLot = await lotRepository.findAvailableLotByCityId(cityId);
    if (!availableLot) {
      throw new Error(`Nenhum lote disponível na cidade ${cityId}`);
    }

    return availableLot;
  } catch (error) {
    console.error(`Erro ao encontrar lote disponível para cidade ${cityId}:`, error);
    throw error;
  }
};

/**
 * Ocupar um lote
 * @param {string} lotId - ID do lote
 * @param {string} buildingId - ID do edifício que vai ocupar
 */
export const occupyLot = async (lotId, buildingId) => {
  try {
    return await lotRepository.occupyLot(lotId, buildingId);
  } catch (error) {
    console.error(`Erro ao ocupar lote ${lotId}:`, error);
    throw error;
  }
};

/**
 * Liberar um lote
 * @param {string} lotId - ID do lote
 */
export const freeLot = async (lotId) => {
  try {
    return await lotRepository.freeLot(lotId);
  } catch (error) {
    console.error(`Erro ao liberar lote ${lotId}:`, error);
    throw error;
  }
};

/**
 * Validar se uma posição pode ter um edifício (não está ocupada)
 * @param {string} cityId - ID da cidade
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export const validateLotAvailability = async (cityId, lat, lng) => {
  try {
    const city = await cityRepository.findByCityId(cityId);
    if (!city || !city.geometry) {
      return { available: false, reason: 'Cidade não encontrada ou sem geometria' };
    }

    const point = turf.point([lng, lat]);
    
    // Verificar se ponto está dentro da cidade
    let isInside = false;
    if (city.geometry.type === 'Polygon') {
      const polygon = turf.polygon(city.geometry.coordinates);
      isInside = turf.booleanPointInPolygon(point, polygon);
    } else if (city.geometry.type === 'MultiPolygon') {
      for (const coords of city.geometry.coordinates) {
        const polygon = turf.polygon(coords);
        if (turf.booleanPointInPolygon(point, polygon)) {
          isInside = true;
          break;
        }
      }
    }

    if (!isInside) {
      return { available: false, reason: 'Ponto fora dos limites da cidade' };
    }

    // Buscar lote mais próximo e verificar se está ocupado
    const lots = await lotRepository.findByCityId(cityId);
    if (!lots || lots.length === 0) {
      // Se não há lotes, criar grade primeiro
      await getOrGenerateCityLots(cityId);
      return { available: true, reason: 'Lotes criados, posição disponível' };
    }

    // Encontrar lote mais próximo
    let closestLot = lots[0];
    let minDistance = Infinity;

    for (const lot of lots) {
      const distance = turf.distance(
        point,
        turf.point([lot.positionLng, lot.positionLat]),
        { units: 'kilometers' }
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestLot = lot;
      }
    }

    // Se o lote mais próximo está a menos de 100m e está ocupado, não disponível
    if (minDistance < 0.1 && closestLot.isOccupied) {
      return { 
        available: false, 
        reason: 'Lote mais próximo já está ocupado',
        lotId: closestLot.lotId
      };
    }

    return { 
      available: true, 
      reason: 'Posição disponível',
      lotId: closestLot.lotId,
      distance: minDistance
    };
  } catch (error) {
    console.error(`Erro ao validar disponibilidade de lote:`, error);
    return { available: false, reason: error.message };
  }
};

