import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

/**
 * ✅ Hook para usar Socket.io com conexão dinâmica
 * Aguarda configuração do backend antes de conectar
 */
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const listenersRef = useRef({});

  useEffect(() => {
    let mounted = true;
    let connectTimeout = null;
    
    console.log('🔌 useSocket: Inicializando...');
    
    // Inicializar socket de forma assíncrona
    const initSocket = async () => {
      try {
        console.log('🔌 useSocket: Aguardando configuração do backend...');
        const socketInstance = await getSocket();
        
        if (!mounted || !socketInstance) {
          console.warn('⚠️  useSocket: Componente desmontado ou socket inválido');
          return;
        }
        
        console.log('✅ useSocket: Socket instanciado');
        setSocket(socketInstance);
        setIsInitializing(false);
        setError(null);
        
        // Aguardar um momento antes de conectar (dar tempo para o backend estar pronto)
        connectTimeout = setTimeout(() => {
          if (mounted && socketInstance && !socketInstance.connected) {
            console.log('🔌 useSocket: Conectando Socket.io...');
            socketInstance.connect();
          }
        }, 1000);
        
        // Event listeners
        const handleConnect = () => {
          console.log('✅ useSocket: Socket CONECTADO!');
          if (mounted) {
            setIsConnected(true);
            setError(null);
          }
        };
        
        const handleDisconnect = (reason) => {
          console.log('⚠️  useSocket: Socket desconectado:', reason);
          if (mounted) {
            setIsConnected(false);
          }
        };
        
        const handleConnectError = (err) => {
          console.error('❌ useSocket: Erro de conexão:', err.message);
          if (mounted) {
            setError(err.message);
            setIsConnected(false);
          }
        };
        
        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('connect_error', handleConnectError);
        
        // Verificar estado inicial
        if (socketInstance.connected) {
          console.log('✅ useSocket: Socket já estava conectado');
          setIsConnected(true);
        }
        
        // Cleanup
        return () => {
          if (connectTimeout) {
            clearTimeout(connectTimeout);
          }
          socketInstance.off('connect', handleConnect);
          socketInstance.off('disconnect', handleDisconnect);
          socketInstance.off('connect_error', handleConnectError);
        };
      } catch (err) {
        console.error('❌ useSocket: Erro ao inicializar:', err);
        if (mounted) {
          setError(err.message);
          setIsInitializing(false);
        }
      }
    };
    
    initSocket();
    
    return () => {
      mounted = false;
      if (connectTimeout) {
        clearTimeout(connectTimeout);
      }
    };
  }, []);

  // ✅ Funções helper compatíveis com useRealtimeUpdates
  const emit = useCallback((event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
      return true;
    }
    console.warn(`⚠️  Socket não conectado, evento "${event}" não enviado`);
    return false;
  }, [socket]);

  const addListener = useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);
      
      // Armazenar referência para cleanup
      if (!listenersRef.current[event]) {
        listenersRef.current[event] = [];
      }
      listenersRef.current[event].push(handler);
      
      return () => {
        socket.off(event, handler);
        // Remover da lista
        if (listenersRef.current[event]) {
          listenersRef.current[event] = listenersRef.current[event].filter(h => h !== handler);
        }
      };
    }
    return () => {};
  }, [socket]);

  const removeListener = useCallback((event, handler) => {
    if (socket) {
      socket.off(event, handler);
      // Remover da lista
      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter(h => h !== handler);
      }
    }
  }, [socket]);

  // Alias para compatibilidade
  const on = addListener;
  const off = removeListener;

  const requestSync = useCallback(() => {
    if (socket && socket.connected) {
      console.log('🔄 Solicitando sincronização...');
      socket.emit('request_sync');
      return true;
    }
    console.warn('⚠️  Socket não conectado, sync não solicitado');
    return false;
  }, [socket]);

  return {
    socket,
    isConnected,
    isInitializing,
    error,
    emit,
    addListener,
    removeListener,
    on,
    off,
    requestSync
  };
};
