import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// ✅ Cores de pele diversificadas (array hexadecimal)
const SKIN_COLORS = [
  '#f4d5bd', '#422d1a', '#d4a574', '#c19a6b',
  '#8b6f47', '#5c4a3a', '#e6c4a0', '#b8916d',
  '#6b4e3d', '#9d7a5a', '#a6896d', '#7a5c42'
];

/**
 * Gerar cor de pele aleatória baseada em tons de marrom, bege e bronze
 * Usa hash determinístico do ID para manter a cor consistente
 */
const generateSkinColor = (npcId, skinColorFromDB = null) => {
  // Se já tem cor no banco, usar ela
  if (skinColorFromDB && SKIN_COLORS.includes(skinColorFromDB)) {
    return skinColorFromDB;
  }
  
  // Caso contrário, gerar baseado no ID
  const hash = (npcId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % SKIN_COLORS.length;
  return SKIN_COLORS[colorIndex];
};

/**
 * ✅ Criar ícone customizado para NPC - retângulos coloridos
 * Retângulo pequeno (6px x 10px) que parece uma pessoa vista de cima
 */
const createNPCIcon = (npcId, status, skinColor = null) => {
  const color = generateSkinColor(npcId, skinColor);
  
  // ✅ Tamanhos diferentes baseados no status
  // Retângulo vertical (6px de largura, 10px de altura) para parecer pessoa
  const width = 6;
  const height = 10;
  
  return L.divIcon({
    className: 'custom-npc-icon',
    html: `<div style="
      width: ${width}px; 
      height: ${height}px; 
      background-color: ${skinColor}; 
      border: 1px solid rgba(0,0,0,0.4);
      border-radius: 2px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      transition: transform 0.3s ease;
    "></div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -height / 2]
  });
};

/**
 * Componente NPCMarkers - Renderiza NPCs no mapa Leaflet
 * 
 * Features:
 * - Retângulos coloridos que representam pessoas vistas de cima
 * - Cores diversificadas (tons de marrom, bege e bronze)
 * - Movimento suave via transições CSS
 * - Atualização via Socket.io em tempo real
 */
export default function NPCMarkers({ countryId, npcs = [], socket = null }) {
  const map = useMap();
  const [visibleNPCs, setVisibleNPCs] = useState(npcs);
  const [npcPositions, setNpcPositions] = useState(new Map());

  // Inicializar posições dos NPCs
  useEffect(() => {
    const positions = new Map();
    npcs.forEach(npc => {
      if (npc.npcId && npc.position) {
        positions.set(npc.npcId, {
          lat: npc.position.lat,
          lng: npc.position.lng,
          timestamp: Date.now()
        });
      }
    });
    setNpcPositions(positions);
    setVisibleNPCs(npcs);
    
    if (npcs.length > 0) {
      console.log(`✅ ${npcs.length} NPCs carregados no mapa`);
    }
  }, [npcs]);

  // Escutar atualizações de posição via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNPCUpdate = (data) => {
      // Atualizar posição de um NPC específico
      if (data.npcId && data.position) {
        setNpcPositions(prev => {
          const newPositions = new Map(prev);
          newPositions.set(data.npcId, {
            lat: data.position.lat,
            lng: data.position.lng,
            timestamp: Date.now()
          });
          return newPositions;
        });

        // Atualizar NPC na lista
        setVisibleNPCs(prev => prev.map(npc => 
          npc.npcId === data.npcId
            ? { ...npc, position: data.position, status: data.status || npc.status }
            : npc
        ));
      }
    };

    const handleNPCsBatchUpdate = (data) => {
      // Atualizar múltiplos NPCs de uma vez
      if (data.npcs && Array.isArray(data.npcs)) {
        setNpcPositions(prev => {
          const newPositions = new Map(prev);
          data.npcs.forEach(npc => {
            if (npc.npcId && npc.position) {
              newPositions.set(npc.npcId, {
                lat: npc.position.lat,
                lng: npc.position.lng,
                timestamp: Date.now()
              });
            }
          });
          return newPositions;
        });

        setVisibleNPCs(prev => {
          const npcMap = new Map(prev.map(n => [n.npcId, n]));
          data.npcs.forEach(updatedNPC => {
            if (updatedNPC.npcId) {
              npcMap.set(updatedNPC.npcId, {
                ...npcMap.get(updatedNPC.npcId),
                ...updatedNPC
              });
            }
          });
          return Array.from(npcMap.values());
        });
      }
    };

    // Registrar listeners
    socket.on('npc:position-updated', handleNPCUpdate);
    socket.on('npc:batch-updated', handleNPCsBatchUpdate);

    // Cleanup
    return () => {
      socket.off('npc:position-updated', handleNPCUpdate);
      socket.off('npc:batch-updated', handleNPCsBatchUpdate);
    };
  }, [socket]);

  // Atualizar posições periodicamente (fallback se Socket.io não funcionar)
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleNPCs(prev => [...prev]);
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Renderizar sempre que houver NPCs, mesmo sem countryId
  if (visibleNPCs.length === 0) {
    return null;
  }

  // Obter posição atualizada do NPC (com transição suave)
  const getNPCPosition = (npc) => {
    if (!npc.npcId) return [npc.position?.lat || 0, npc.position?.lng || 0];
    
    const cached = npcPositions.get(npc.npcId);
    if (cached) {
      return [cached.lat, cached.lng];
    }
    
    return [npc.position?.lat || 0, npc.position?.lng || 0];
  };

  if (visibleNPCs.length === 0) {
    return null;
  }

  return (
    <>
      {visibleNPCs.map((npc) => {
        const position = getNPCPosition(npc);
        const npcId = npc.npcId || npc._id;
        const skinColor = npc.skinColor || null;
        const currentTask = npc.currentTask || npc.status || 'idle';
        
        return (
          <Marker
            key={npcId}
            position={position}
            icon={createNPCIcon(npcId, currentTask, skinColor)}
            // Adicionar transição suave usando Leaflet's setLatLng
            eventHandlers={{
              // Usar CSS transitions para movimento suave
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold mb-1 text-gray-800">{npc.name || 'NPC'}</div>
                <div className="text-xs text-gray-600 mb-1">
                  Status: <span className="font-medium capitalize">{npc.status || 'idle'}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Tipo: <span className="font-medium capitalize">{npc.npcType || 'resident'}</span>
                </div>
                {npc.targetPosition && (
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                    🎯 Indo para: {npc.targetPosition.lat.toFixed(4)}, {npc.targetPosition.lng.toFixed(4)}
                  </div>
                )}
                {npc.homeBuilding && (
                  <div className="text-xs text-gray-500 mt-1">
                    🏠 Casa: {npc.homeBuilding.name || 'Edifício'}
                  </div>
                )}
                {npc.workBuilding && (
                  <div className="text-xs text-gray-500 mt-1">
                    🏢 Trabalho: {npc.workBuilding.name || 'Edifício'}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

