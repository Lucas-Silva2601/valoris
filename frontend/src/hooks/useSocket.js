import { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const listenersRef = useRef([]);

  useEffect(() => {
    // Conectar
    socket.connect();

    // Eventos de conexão
    const onConnect = () => {
      console.log('✅ Conectado ao servidor Socket.io');
      setIsConnected(true);
      setSocketId(socket.id);
      setReconnectAttempts(0);
    };

    const onDisconnect = () => {
      console.log('❌ Desconectado do servidor Socket.io');
      setIsConnected(false);
      setSocketId(null);
    };

    const onReconnect = (attemptNumber) => {
      console.log(`🔄 Reconectado (tentativa ${attemptNumber})`);
      setReconnectAttempts(attemptNumber);
    };

    const onConnected = (data) => {
      console.log('📡 Dados de conexão recebidos:', data);
      setSocketId(data.socketId);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('connected', onConnected);

    // Limpar listeners ao desmontar
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('connected', onConnected);
      
      // Remover todos os listeners registrados
      listenersRef.current.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      
      socket.disconnect();
    };
  }, []);

  // Função para adicionar listener
  const addListener = (event, handler) => {
    socket.on(event, handler);
    listenersRef.current.push({ event, handler });
  };

  // Função para remover listener
  const removeListener = (event, handler) => {
    socket.off(event, handler);
    listenersRef.current = listenersRef.current.filter(
      l => l.event !== event || l.handler !== handler
    );
  };

  // Função para emitir evento
  const emit = (event, data) => {
    socket.emit(event, data);
  };

  // Função para entrar em sala de país
  const joinCountry = (countryId) => {
    emit('join_country', countryId);
  };

  // Função para sair de sala de país
  const leaveCountry = (countryId) => {
    emit('leave_country', countryId);
  };

  // Solicitar sincronização inicial
  const requestSync = (data = {}) => {
    emit('request_sync', data);
  };

  return {
    isConnected,
    socketId,
    reconnectAttempts,
    socket,
    addListener,
    removeListener,
    emit,
    joinCountry,
    leaveCountry,
    requestSync
  };
};

