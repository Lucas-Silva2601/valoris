/**
 * ✅ CONFIGURAÇÃO DINÂMICA DA API - 100% SINCRONIZADA
 * Aguarda backend-config.json antes de permitir requisições
 */

// ✅ CORREÇÃO: Variáveis começam NULAS para evitar uso antes de carregar
let backendConfig = null;
let configPromise = null;
let isLoading = false;

// ✅ URLs globais começam NULAS
export let API_BASE_URL = null;
export let SOCKET_URL = null;

/**
 * 🔍 Carrega configuração dinâmica do backend
 */
async function loadBackendConfig() {
  // Evitar múltiplas chamadas simultâneas
  if (isLoading && configPromise) {
    return configPromise;
  }
  
  isLoading = true;
  
  configPromise = (async () => {
    try {
      console.log('🔍 Buscando configuração do backend...');
      
      const response = await fetch('/backend-config.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const config = await response.json();
        console.log('✅ Configuração dinâmica carregada:', config);
        console.log(`   API: ${config.apiUrl}`);
        console.log(`   Socket: ${config.socketUrl}`);
        
        // ✅ Atualizar variáveis globais
        backendConfig = config;
        API_BASE_URL = config.apiUrl;
        SOCKET_URL = config.socketUrl;
        isLoading = false;
        
        return config;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn('⚠️  backend-config.json não encontrado, usando fallback porta 3001');
      console.warn('   Certifique-se de que o backend está rodando');
      
      // Fallback para configuração padrão (porta 3001)
      const fallbackConfig = {
        port: 3001,
        apiUrl: 'http://localhost:3001/api',
        socketUrl: 'http://localhost:3001',
        timestamp: new Date().toISOString()
      };
      
      // ✅ Atualizar variáveis globais mesmo com fallback
      backendConfig = fallbackConfig;
      API_BASE_URL = fallbackConfig.apiUrl;
      SOCKET_URL = fallbackConfig.socketUrl;
      isLoading = false;
      
      return fallbackConfig;
    }
  })();
  
  return configPromise;
}

/**
 * 🔗 Obtém configuração do backend (aguarda se necessário)
 */
export async function getBackendConfig() {
  if (!backendConfig) {
    await loadBackendConfig();
  }
  return backendConfig;
}

/**
 * 🔗 Obtém URL da API (aguarda config se necessário)
 */
export async function getApiUrl() {
  if (!API_BASE_URL) {
    const config = await getBackendConfig();
    return config.apiUrl;
  }
  return API_BASE_URL;
}

/**
 * ⚡ Obtém URL do Socket.io (aguarda config se necessário)
 */
export async function getSocketUrl() {
  if (!SOCKET_URL) {
    const config = await getBackendConfig();
    return config.socketUrl;
  }
  return SOCKET_URL;
}

/**
 * 📡 Obtém porta do backend
 */
export async function getBackendPort() {
  const config = await getBackendConfig();
  return config.port;
}

/**
 * ✅ Verifica se configuração já foi carregada
 */
export function isConfigLoaded() {
  return backendConfig !== null && API_BASE_URL !== null && SOCKET_URL !== null;
}

/**
 * 🔄 Inicializar configuração (chamar ao carregar app)
 */
export async function initializeConfig() {
  console.log('🚀 Inicializando configuração da API...');
  await loadBackendConfig();
  console.log('✅ Configuração inicializada!');
  return backendConfig;
}

/**
 * 📡 Função helper para fazer requisições com tratamento de erro
 */
export const apiRequest = async (endpoint, options = {}) => {
  // ✅ PROTEÇÃO: Aguardar configuração estar pronta
  const apiUrl = await getApiUrl();
  
  if (!apiUrl) {
    throw new Error('API URL não configurada. Aguarde a inicialização.');
  }
  
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'user-id': localStorage.getItem('userId') || 'test-user-id'
  };

  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Erro HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
    }

    return { data, response };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const port = backendConfig?.port || 3001;
      throw new Error(`Backend não respondeu na porta ${port}. Verifique se o servidor está rodando.`);
    }
    throw error;
  }
};

// ✅ Inicializar automaticamente ao carregar módulo
initializeConfig().catch(err => {
  console.error('❌ Erro ao inicializar configuração:', err);
});
