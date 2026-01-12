import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useSocket } from '../hooks/useSocket';

/**
 * ✅ FASE 19.2: Componente para rastrear viewport do mapa e enviar bounds ao servidor
 * Permite que o servidor envie apenas NPCs visíveis, reduzindo payload de Socket.io
 */
export default function ViewportTracker() {
  const map = useMap();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Função para atualizar viewport
    const updateViewport = () => {
      try {
        const bounds = map.getBounds();
        
        if (!bounds || !bounds.isValid()) {
          return;
        }

        // Enviar bounds ao servidor
        socket.emit('update_viewport', {
          southWest: {
            lat: bounds.getSouth(),
            lng: bounds.getWest()
          },
          northEast: {
            lat: bounds.getNorth(),
            lng: bounds.getEast()
          }
        });
      } catch (error) {
        console.warn('Erro ao atualizar viewport:', error);
      }
    };

    // Atualizar quando mapa mover ou fazer zoom
    map.on('moveend', updateViewport);
    map.on('zoomend', updateViewport);
    
    // Atualizar imediatamente
    updateViewport();

    // Atualizar periodicamente (a cada 2 segundos) para garantir sincronização
    const interval = setInterval(updateViewport, 2000);

    return () => {
      map.off('moveend', updateViewport);
      map.off('zoomend', updateViewport);
      clearInterval(interval);
    };
  }, [map, socket]);

  return null;
}

