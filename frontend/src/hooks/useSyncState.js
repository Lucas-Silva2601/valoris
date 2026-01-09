import { useEffect, useState, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * Hook para sincronização de estado inicial e delta updates
 */
export const useSyncState = () => {
  const { isConnected, addListener, removeListener, requestSync } = useSocket();
  const [syncData, setSyncData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const cacheRef = useRef({});
  const deltaQueueRef = useRef([]);

  useEffect(() => {
    if (!isConnected) return;

    // Listener para dados de sincronização
    const handleSyncData = (data) => {
      console.log('📥 Dados de sincronização recebidos:', data);
      
      // Aplicar dados ao cache
      cacheRef.current = {
        ...cacheRef.current,
        ...data,
        lastSync: new Date().toISOString()
      };

      setSyncData(data);
      setIsSyncing(false);
      setLastSyncTime(new Date().toISOString());
    };

    // Listener para delta updates
    const handleDeltaUpdate = (delta) => {
      console.log('📥 Delta update recebido:', delta);
      
      // Adicionar à fila de deltas
      deltaQueueRef.current.push(delta);
      
      // Aplicar delta ao cache
      applyDeltaToCache(delta);
    };

    // Listener para erros de sincronização
    const handleSyncError = (error) => {
      console.error('❌ Erro na sincronização:', error);
      setIsSyncing(false);
    };

    // Registrar listeners
    addListener('sync_data', handleSyncData);
    addListener('delta_update', handleDeltaUpdate);
    addListener('sync_error', handleSyncError);

    // Solicitar sincronização inicial
    if (isConnected && !syncData) {
      setIsSyncing(true);
      requestSync();
    }

    // Limpar ao desmontar
    return () => {
      removeListener('sync_data', handleSyncData);
      removeListener('delta_update', handleDeltaUpdate);
      removeListener('sync_error', handleSyncError);
    };
  }, [isConnected, syncData, addListener, removeListener, requestSync]);

  // Aplicar delta ao cache
  const applyDeltaToCache = (delta) => {
    const { type, data, timestamp } = delta;

    switch (type) {
      case 'unit_update':
        cacheRef.current.units = cacheRef.current.units || [];
        const unitIndex = cacheRef.current.units.findIndex(u => u.unitId === data.unitId);
        if (unitIndex >= 0) {
          cacheRef.current.units[unitIndex] = { ...cacheRef.current.units[unitIndex], ...data };
        } else {
          cacheRef.current.units.push(data);
        }
        break;

      case 'balance_update':
        cacheRef.current.wallet = {
          ...cacheRef.current.wallet,
          balance: data.balance
        };
        break;

      case 'ownership_update':
        cacheRef.current.ownerships = cacheRef.current.ownerships || [];
        const ownershipIndex = cacheRef.current.ownerships.findIndex(
          o => o.countryId === data.countryId
        );
        if (ownershipIndex >= 0) {
          cacheRef.current.ownerships[ownershipIndex] = data;
        } else {
          cacheRef.current.ownerships.push(data);
        }
        break;

      default:
        cacheRef.current[type] = data;
    }

    cacheRef.current.lastDelta = timestamp;
  };

  // Resolver conflitos (estratégia simples: último vence)
  const resolveConflict = (localData, serverData) => {
    const localTimestamp = new Date(localData.timestamp || 0).getTime();
    const serverTimestamp = new Date(serverData.timestamp || 0).getTime();

    return serverTimestamp > localTimestamp ? serverData : localData;
  };

  // Obter dados do cache
  const getCachedData = (key) => {
    return cacheRef.current[key];
  };

  // Limpar cache
  const clearCache = () => {
    cacheRef.current = {};
    setSyncData(null);
  };

  return {
    syncData,
    isSyncing,
    lastSyncTime,
    getCachedData,
    clearCache,
    resolveConflict
  };
};

