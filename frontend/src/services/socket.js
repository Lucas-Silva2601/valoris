import { io } from 'socket.io-client';

// ✅ URL do Socket.io - Porta 3001
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Obter userId do localStorage ou usar padrão para testes
const getUserId = () => {
  return localStorage.getItem('userId') || '507f1f77bcf86cd799439011';
};

const getUsername = () => {
  return localStorage.getItem('username') || 'testuser';
};

// ✅ CONFIGURAÇÃO RESILIENTE - NÃO TRAVA A APLICAÇÃO
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 5000, // ✅ Aumentado para 5 segundos (era 1 segundo)
  reconnectionDelayMax: 30000, // ✅ Máximo de 30 segundos entre tentativas
  reconnectionAttempts: Infinity, // Tentar infinitamente
  timeout: 20000,
  transports: ['websocket', 'polling'], // Tentar websocket primeiro, depois polling
  upgrade: true,
  rememberUpgrade: true,
  // ✅ Desabilitar logs excessivos em produção
  forceNew: false,
  auth: {
    userId: getUserId(),
    username: getUsername(),
    token: localStorage.getItem('token') || null
  },
  // Headers adicionais para autenticação
  extraHeaders: {
    'user-id': getUserId()
  }
});

// ✅ Eventos de conexão - Logs reduzidos para não travar aplicação
let reconnectAttemptCount = 0;
const MAX_LOGS = 5; // Limitar logs para não encher o console

socket.on('connect', () => {
  reconnectAttemptCount = 0; // Resetar contador ao conectar
  console.log('✅ Socket.io CONECTADO:', socket.id);
});

socket.on('disconnect', (reason) => {
  // ✅ Log apenas se não for reconexão automática
  if (reason !== 'io client disconnect') {
    if (reconnectAttemptCount < MAX_LOGS) {
      console.log('⚠️  Socket.io desconectado:', reason);
    }
  }
  
  if (reason === 'io server disconnect') {
    // Servidor forçou desconexão, reconectar manualmente após delay
    setTimeout(() => {
      socket.connect();
    }, 5000);
  }
});

socket.on('connect_error', (error) => {
  reconnectAttemptCount++;
  // ✅ Log apenas as primeiras tentativas para não encher o console
  if (reconnectAttemptCount <= MAX_LOGS) {
    console.warn(`⚠️  Erro de conexão Socket.io (tentativa ${reconnectAttemptCount}):`, error.message);
  }
  // Não travar a aplicação - apenas logar
});

socket.on('reconnect_attempt', (attemptNumber) => {
  // ✅ Log apenas a cada 5 tentativas para não encher o console
  if (attemptNumber % 5 === 0 || attemptNumber <= MAX_LOGS) {
    console.log(`🔄 Tentativa de reconexão ${attemptNumber}...`);
  }
});

socket.on('reconnect_failed', () => {
  console.warn('⚠️  Falha ao reconectar Socket.io. Continuando em modo offline.');
  // ✅ Não travar - aplicação continua funcionando
});

socket.on('reconnect_error', (error) => {
  reconnectAttemptCount++;
  // ✅ Log apenas as primeiras tentativas
  if (reconnectAttemptCount <= MAX_LOGS) {
    console.warn(`⚠️  Erro na reconexão (tentativa ${reconnectAttemptCount}):`, error.message);
  }
});

socket.on('reconnect', (attemptNumber) => {
  reconnectAttemptCount = 0;
  console.log(`✅ Socket.io reconectado após ${attemptNumber} tentativas`);
});

export default socket;

