import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/api';

// Obter userId do localStorage ou usar padrão para testes
const getUserId = () => {
  return localStorage.getItem('userId') || '507f1f77bcf86cd799439011';
};

const getUsername = () => {
  return localStorage.getItem('username') || 'testuser';
};

// ✅ CONEXÃO DINÂMICA - Aguarda config do backend
let socketInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * ✅ Inicializa Socket.io com URL dinâmica do backend
 */
async function initializeSocket() {
  // Se já está inicializando, aguardar a promise existente
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  // Se já foi inicializado, retornar instância
  if (socketInstance) {
    return socketInstance;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      console.log('⚡ Inicializando Socket.io...');
      
      // ✅ PROTEÇÃO: Aguardar URL estar pronta
      const socketUrl = await getSocketUrl();
      
      if (!socketUrl) {
        throw new Error('Socket URL não configurada');
      }
      
      console.log(`   Conectando em: ${socketUrl}`);
      
      socketInstance = io(socketUrl, {
        autoConnect: false,  // ✅ Não conectar automaticamente
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false,
        auth: {
          userId: getUserId(),
          username: getUsername(),
          token: localStorage.getItem('token') || null
        },
        extraHeaders: {
          'user-id': getUserId()
        }
      });
      
      setupSocketEvents(socketInstance);
      
      console.log('✅ Socket.io instanciado com sucesso');
      isInitializing = false;
      return socketInstance;
    } catch (error) {
      console.error('❌ Erro ao inicializar Socket.io:', error);
      isInitializing = false;
      initPromise = null;
      return null;
    }
  })();
  
  return initPromise;
}

/**
 * ✅ Configurar event listeners do Socket.io
 */
function setupSocketEvents(socket) {
  let reconnectAttemptCount = 0;
  const MAX_LOGS = 5;
  
  socket.on('connect', () => {
    reconnectAttemptCount = 0;
    console.log('✅ Socket.io CONECTADO:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    if (reason !== 'io client disconnect') {
      if (reconnectAttemptCount < MAX_LOGS) {
        console.log('⚠️  Socket.io desconectado:', reason);
      }
    }
    
    // Se o servidor forçar desconexão, reconectar após delay
    if (reason === 'io server disconnect') {
      setTimeout(() => {
        if (socket && !socket.connected) {
          console.log('🔄 Tentando reconectar...');
          socket.connect();
        }
      }, 5000);
    }
  });
  
  socket.on('connect_error', (error) => {
    reconnectAttemptCount++;
    if (reconnectAttemptCount <= MAX_LOGS) {
      console.warn(`⚠️  Erro de conexão Socket.io (tentativa ${reconnectAttemptCount}):`, error.message);
    }
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    if (attemptNumber % 5 === 0 || attemptNumber <= MAX_LOGS) {
      console.log(`🔄 Tentativa de reconexão ${attemptNumber}...`);
    }
  });
  
  socket.on('reconnect_failed', () => {
    console.warn('⚠️  Falha ao reconectar Socket.io. Sistema continuará em modo offline.');
  });
  
  socket.on('reconnect_error', (error) => {
    reconnectAttemptCount++;
    if (reconnectAttemptCount <= MAX_LOGS) {
      console.warn(`⚠️  Erro na reconexão (tentativa ${reconnectAttemptCount}):`, error.message);
    }
  });
  
  socket.on('reconnect', (attemptNumber) => {
    reconnectAttemptCount = 0;
    console.log(`✅ Socket.io reconectado após ${attemptNumber} tentativas`);
  });
}

/**
 * ✅ Obtém instância do Socket.io (aguarda inicialização se necessário)
 */
export async function getSocket() {
  if (!socketInstance) {
    await initializeSocket();
  }
  return socketInstance;
}

/**
 * ✅ Exportar instância síncrona (pode ser null inicialmente)
 * USE getSocket() para aguardar inicialização completa
 */
export let socket = null;

// ⚠️ NÃO inicializar automaticamente ao carregar módulo
// A inicialização será feita apenas quando getSocket() for chamado
// Isso evita tentativas de conexão antes da configuração estar pronta

export default socket;
