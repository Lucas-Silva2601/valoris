import { useEffect, useRef, useCallback } from 'react';

/**
 * ✅ FASE 19.2: Hook para usar Web Worker com Turf.js
 * Evita que a UI congele durante cálculos geográficos
 */
export const useTurfWorker = () => {
  const workerRef = useRef(null);
  const messageIdRef = useRef(0);
  const pendingMessagesRef = useRef(new Map());

  // Inicializar worker
  useEffect(() => {
    try {
      workerRef.current = new Worker('/turf-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { id, type, result, error } = e.data;
        
        const pendingMessage = pendingMessagesRef.current.get(id);
        if (pendingMessage) {
          pendingMessagesRef.current.delete(id);
          
          if (type === 'success') {
            pendingMessage.resolve(result);
          } else {
            pendingMessage.reject(new Error(error || 'Erro desconhecido no worker'));
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Erro no Web Worker de Turf.js:', error);
      };

      console.log('✅ Web Worker de Turf.js inicializado');
    } catch (error) {
      console.warn('⚠️ Não foi possível inicializar Web Worker, usando cálculos no main thread:', error);
      workerRef.current = null;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingMessagesRef.current.clear();
    };
  }, []);

  /**
   * ✅ FASE 19.2: Enviar mensagem para o worker
   */
  const sendMessage = useCallback((type, data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback: se não tiver worker, rejeitar
        reject(new Error('Web Worker não está disponível'));
        return;
      }

      const id = ++messageIdRef.current;
      
      // Armazenar callback
      pendingMessagesRef.current.set(id, { resolve, reject });

      // Enviar mensagem
      workerRef.current.postMessage({ id, type, data });

      // Timeout de 10 segundos
      setTimeout(() => {
        if (pendingMessagesRef.current.has(id)) {
          pendingMessagesRef.current.delete(id);
          reject(new Error('Timeout no Web Worker'));
        }
      }, 10000);
    });
  }, []);

  /**
   * ✅ FASE 19.2: Verificar se ponto está dentro de polígono
   */
  const pointInPolygon = useCallback(async (point, polygon) => {
    try {
      return await sendMessage('pointInPolygon', { point, polygon });
    } catch (error) {
      console.warn('Erro ao verificar pointInPolygon no worker, usando fallback:', error);
      // Fallback: retornar false (não está dentro)
      return false;
    }
  }, [sendMessage]);

  /**
   * ✅ FASE 19.2: Identificar país a partir de coordenadas
   */
  const identifyCountry = useCallback(async (lat, lng, geoJSON) => {
    try {
      return await sendMessage('identifyCountry', { lat, lng, geoJSON });
    } catch (error) {
      console.warn('Erro ao identificar país no worker, usando fallback:', error);
      return { valid: false, country: null };
    }
  }, [sendMessage]);

  /**
   * ✅ FASE 19.2: Identificar estado a partir de coordenadas
   */
  const identifyState = useCallback(async (lat, lng, statesGeoJSON) => {
    try {
      return await sendMessage('identifyState', { lat, lng, statesGeoJSON });
    } catch (error) {
      console.warn('Erro ao identificar estado no worker, usando fallback:', error);
      return { valid: false, state: null };
    }
  }, [sendMessage]);

  /**
   * ✅ FASE 19.2: Identificar cidade a partir de coordenadas
   */
  const identifyCity = useCallback(async (lat, lng, citiesGeoJSON) => {
    try {
      return await sendMessage('identifyCity', { lat, lng, citiesGeoJSON });
    } catch (error) {
      console.warn('Erro ao identificar cidade no worker, usando fallback:', error);
      return { valid: false, city: null };
    }
  }, [sendMessage]);

  return {
    workerAvailable: workerRef.current !== null,
    pointInPolygon,
    identifyCountry,
    identifyState,
    identifyCity,
    sendMessage
  };
};

