import { describe, it, expect } from 'vitest';
import {
  latLngToPixels,
  pixelsToLatLng,
  calculateDistance,
  isPointInPolygon,
  getPolygonCentroid
} from '../../utils/geography';

describe('Geography Utils', () => {
  describe('latLngToPixels', () => {
    it('deve converter coordenadas para pixels', () => {
      const result = latLngToPixels(0, 0, 2);
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });
  });

  describe('pixelsToLatLng', () => {
    it('deve converter pixels para coordenadas', () => {
      const result = pixelsToLatLng(256, 256, 2);
      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lng');
      expect(result.lat).toBeGreaterThanOrEqual(-90);
      expect(result.lat).toBeLessThanOrEqual(90);
    });
  });

  describe('calculateDistance', () => {
    it('deve calcular distância entre dois pontos', () => {
      // Distância aproximada entre São Paulo e Rio de Janeiro
      const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
      expect(distance).toBeGreaterThan(300); // ~350km
      expect(distance).toBeLessThan(400);
    });

    it('deve retornar 0 para o mesmo ponto', () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });
  });

  describe('isPointInPolygon', () => {
    it('deve verificar se ponto está dentro de polígono', () => {
      const polygon = {
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
            [-1, -1]
          ]]
        }
      };

      expect(isPointInPolygon(0, 0, polygon)).toBe(true);
      expect(isPointInPolygon(2, 2, polygon)).toBe(false);
    });
  });
});

