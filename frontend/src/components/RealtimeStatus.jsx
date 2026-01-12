import { useSocket } from '../hooks/useSocket';
import { useState } from 'react';

/**
 * ✅ FASE 18.6: Indicador de Conexão sempre visível com melhor feedback visual
 */
export default function RealtimeStatus() {
  const { isConnected, socketId, reconnectAttempts } = useSocket();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
      className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-lg z-50"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full transition-all ${
            isConnected 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`}
          title={isConnected ? 'Conectado ao servidor' : 'Desconectado do servidor'}
        ></div>
        <span className={`font-semibold transition-colors ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
          {socketId && (
            <div className="text-gray-400">
              <span className="text-gray-500">ID:</span> {socketId.substr(0, 8)}...
            </div>
          )}
          {reconnectAttempts > 0 && (
            <div className="text-yellow-400">
              <span className="text-gray-500">Tentativas:</span> {reconnectAttempts}
            </div>
          )}
          <div className="text-gray-400 text-xs mt-1">
            {isConnected 
              ? '✅ Sincronização em tempo real ativa' 
              : '⚠️ Reconectando automaticamente...'}
          </div>
        </div>
      )}
    </div>
  );
}

