import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do Leaflet
global.L = {
  icon: vi.fn(() => ({})),
  Marker: {
    prototype: {
      options: {}
    }
  }
};

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

