/**
 * ✅ FASE 19.2: Hook para enviar viewport bounds do mapa para o servidor
 * Permite throttling de Socket.io baseado em bounding box
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useSocket } from './useSocket';

export const useViewportBounds = () => {
  const map = useMap();
  const { socket } = useSocket();
  const lastSentBounds = useRef(null);
  const throttleTimer = useRef(null);

  useEffect(() => {
    if (!socket || !map) return;

    const sendViewportBounds = () => {
      try {
        const bounds = map.getBounds();
        const southwest = bounds.getSouthWest();
        const northeast = bounds.getNorthEast();

        const boundsData = {
          southwest: {
            lat: southwest.lat,
            lng: southwest.lng
          },
          northeast: {
            lat: northeast.lat,
            lng: northeast.lng
          },
          zoom: map.getZoom()
        };

        // ✅ Comparar com último bounds enviado (evitar envios desnecessários)
        const lastBounds = lastSentBounds.current;
        if (lastBounds) {
          const latDiff = Math.abs(lastBounds.northeast.lat - boundsData.northeast.lat);
          const lngDiff = Math.abs(lastBounds.northeast.lng - boundsData.northeast.lng);
          const zoomDiff = Math.abs(lastBounds.zoom - boundsData.zoom);

          // Enviar apenas se houver mudança significativa (>= 0.01 graus ou mudança de zoom)
          if (latDiff < 0.01 && lngDiff < 0.01 && zoomDiff === 0) {
            return;
          }
        }

        // ✅ Enviar bounds para o servidor
        socket.emit('update_viewport', boundsData);
        lastSentBounds.current = boundsData;
      } catch (error) {
        console.warn('Erro ao enviar viewport bounds:', error);
      }
    };

    // ✅ Enviar bounds imediatamente ao montar
    sendViewportBounds();

    // ✅ Enviar bounds quando o mapa mover (com throttling de 1 segundo)
    const handleMoveEnd = () => {
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }

      throttleTimer.current = setTimeout(() => {
        sendViewportBounds();
      }, 1000); // Aguardar 1 segundo após movimento parar
    };

    // ✅ Enviar bounds quando o zoom mudar
    const handleZoomEnd = () => {
      sendViewportBounds();
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [socket, map]);

  return null;
};

