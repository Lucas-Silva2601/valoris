/**
 * ✅ FASE 19.4: Componente de Log de Eventos no Frontend
 * Mostra erros do Socket.io e API em tempo real (apenas em desenvolvimento)
 */

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { API_BASE_URL } from '../config/api';

const MAX_LOGS = 100;
const LOG_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SOCKET: 'socket',
  API: 'api'
};

export default function EventLog() {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'error', 'warning', 'info', 'socket', 'api'
  const { socket } = useSocket();
  const logsEndRef = useRef(null);
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // Scroll automático para o último log
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Toggle on/off com tecla de atalho (Ctrl+Shift+L ou Cmd+Shift+L)
  useEffect(() => {
    if (!isDevelopment) return;

    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDevelopment]);

  // Interceptar erros do Socket.io
  useEffect(() => {
    if (!socket || !isDevelopment) return;

    const addSocketLog = (type, message, data = null) => {
      addLog(LOG_TYPES.SOCKET, type, message, data);
    };

    // Eventos de conexão
    socket.on('connect', () => {
      addSocketLog('info', 'Socket.io conectado', { socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      addSocketLog('warning', `Socket.io desconectado: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      addSocketLog('error', `Erro de conexão Socket.io: ${error.message}`, error);
    });

    // Interceptar todos os eventos de erro do Socket.io
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('error') || eventName.includes('Error')) {
        addSocketLog('error', `Evento de erro: ${eventName}`, args);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket, isDevelopment]);

  // Interceptar erros de API
  useEffect(() => {
    if (!isDevelopment) return;

    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          const errorData = await response.clone().json().catch(() => ({}));
          addLog(
            LOG_TYPES.API,
            'error',
            `API Error: ${response.status} ${response.statusText}`,
            {
              url: args[0],
              status: response.status,
              statusText: response.statusText,
              error: errorData
            }
          );
        }
        
        return response;
      } catch (error) {
        addLog(
          LOG_TYPES.API,
          'error',
          `API Request Failed: ${error.message}`,
          {
            url: args[0],
            error: error.message
          }
        );
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isDevelopment]);

  // Interceptar erros globais do JavaScript
  useEffect(() => {
    if (!isDevelopment) return;

    const handleError = (event) => {
      addLog(
        LOG_TYPES.ERROR,
        'error',
        `JavaScript Error: ${event.message}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      );
    };

    const handleUnhandledRejection = (event) => {
      addLog(
        LOG_TYPES.ERROR,
        'error',
        `Unhandled Promise Rejection: ${event.reason}`,
        { reason: event.reason }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isDevelopment]);

  const addLog = (source, type, message, data = null) => {
    const log = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      source,
      type,
      message,
      data
    };

    setLogs(prev => {
      const newLogs = [...prev, log];
      // Manter apenas os últimos N logs
      return newLogs.slice(-MAX_LOGS);
    });
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter || log.source === filter);

  const getLogColor = (type, source) => {
    if (type === 'error') return 'text-red-400';
    if (type === 'warning') return 'text-yellow-400';
    if (source === 'socket') return 'text-blue-400';
    if (source === 'api') return 'text-purple-400';
    return 'text-gray-300';
  };

  const getLogBgColor = (type) => {
    if (type === 'error') return 'bg-red-900/20';
    if (type === 'warning') return 'bg-yellow-900/20';
    return 'bg-gray-800/20';
  };

  // Não renderizar em produção
  if (!isDevelopment) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity"
          title="Abrir Log de Eventos (Ctrl+Shift+L)"
        >
          📋 Log
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">📋 Event Log</span>
          <span className="text-gray-400 text-xs">({filteredLogs.length}/{logs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
          >
            <option value="all">Todos</option>
            <option value="error">Erros</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="socket">Socket.io</option>
            <option value="api">API</option>
          </select>
          <button
            onClick={() => setLogs([])}
            className="text-gray-400 hover:text-white text-xs"
            title="Limpar logs"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
            title="Fechar (Ctrl+Shift+L)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Nenhum log encontrado</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2 rounded ${getLogBgColor(log.type)} ${getLogColor(log.type, log.source)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs">{log.timestamp}</span>
                <span className="font-semibold">[{log.source.toUpperCase()}]</span>
              </div>
              <div className="mt-1">{log.message}</div>
              {log.data && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                    Detalhes
                  </summary>
                  <pre className="mt-1 text-xs overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

