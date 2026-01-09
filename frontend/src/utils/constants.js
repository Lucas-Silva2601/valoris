// Constantes do jogo
// ✅ URLs atualizadas para porta 3001
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Configurações do jogo
export const INITIAL_BALANCE = 10000;
export const DIVIDEND_INTERVAL_HOURS = 24;
export const TREASURY_PERCENTAGE = 5;

// Tipos de unidades militares
export const UNIT_TYPES = {
  TANK: 'tank',
  SHIP: 'ship',
  PLANE: 'plane',
};

// Estados de jogo
export const GAME_STATES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  PAUSED: 'paused',
};

