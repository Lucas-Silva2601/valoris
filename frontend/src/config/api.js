/**
 * ✅ CONFIGURAÇÃO CENTRALIZADA DA API
 * 
 * Todas as requisições devem usar estas constantes para garantir
 * que apontem para o backend correto (porta 3001)
 */

// URL base do backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// URL do Socket.io
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

/**
 * Função helper para fazer requisições com tratamento de erro melhorado
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
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
    
    // Verificar se a resposta é JSON
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
    // Melhorar mensagens de erro
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Servidor não está respondendo. Verifique se o backend está rodando na porta 3001.');
    }
    throw error;
  }
};

