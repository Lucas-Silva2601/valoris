import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useSocket } from '../hooks/useSocket';

/**
 * ✅ FASE 19.2: Componente para atualizar viewport do jogador no servidor
 * Envia o bounding box (viewport) do mapa para o servidor filtrar NPCs
 */
export default function ViewportUpdater() {
  const map = useMap();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const updateViewport = () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) {
          return;
        }

        // ✅ Enviar bounding box do viewport para o servidor (formato esperado pelo backend)
        const viewportBounds = {
          southwest: {
            lat: bounds.getSouth(),
            lng: bounds.getWest()
          },
          northeast: {
            lat: bounds.getNorth(),
            lng: bounds.getEast()
          },
          zoom: map.getZoom()
        };

        socket.emit('update_viewport', viewportBounds);
      } catch (error) {
        console.warn('Erro ao atualizar viewport:', error);
      }
    };

    // Atualizar viewport quando o mapa for movido ou zoom mudar
    map.on('moveend', updateViewport);
    map.on('zoomend', updateViewport);

    // Atualizar viewport inicial
    updateViewport();

    return () => {
      map.off('moveend', updateViewport);
      map.off('zoomend', updateViewport);
    };
  }, [map, socket, isConnected]);

  return null;
}

