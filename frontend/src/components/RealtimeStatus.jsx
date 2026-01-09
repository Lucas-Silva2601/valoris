import { useSocket } from '../hooks/useSocket';

export default function RealtimeStatus() {
  const { isConnected, socketId, reconnectAttempts } = useSocket();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className="text-gray-300">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      {socketId && (
        <div className="text-gray-400 mt-1">
          ID: {socketId.substr(0, 8)}...
        </div>
      )}
      {reconnectAttempts > 0 && (
        <div className="text-yellow-400 mt-1">
          Tentativas: {reconnectAttempts}
        </div>
      )}
    </div>
  );
}

