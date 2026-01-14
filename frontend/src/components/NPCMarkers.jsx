import { useEffect, useState, useMemo, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getApiUrl } from '../config/api';

// 🎨 SVG de pessoa humana (bonequinho humanóide)
const createHumanSVG = (skinColor, clothingColor, zoom) => {
  // ✅ PASSO 5: Tamanho FIXO e GRANDE (15x30px)
  const width = 15;
  const height = 30;
  const size = height;
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 15 30" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(2px 4px 2px rgba(0,0,0,0.5));">
      <!-- Cabeça -->
      <circle cx="7.5" cy="4" r="3" fill="${skinColor}" stroke="#000" stroke-width="0.5"/>
      
      <!-- Corpo (tronco) -->
      <ellipse cx="7.5" cy="13" rx="4" ry="6" fill="${clothingColor}" stroke="#000" stroke-width="0.5"/>
      
      <!-- Braço Esquerdo -->
      <line x1="4" y1="11" x2="1" y2="15" stroke="${clothingColor}" stroke-width="1.5" stroke-linecap="round"/>
      
      <!-- Braço Direito -->
      <line x1="11" y1="11" x2="14" y2="15" stroke="${clothingColor}" stroke-width="1.5" stroke-linecap="round"/>
      
      <!-- Perna Esquerda -->
      <line x1="6" y1="18" x2="5" y2="28" stroke="${clothingColor}" stroke-width="2" stroke-linecap="round"/>
      
      <!-- Perna Direita -->
      <line x1="9" y1="18" x2="10" y2="28" stroke="${clothingColor}" stroke-width="2" stroke-linecap="round"/>
      
      <!-- Pés -->
      <circle cx="5" cy="28" r="1" fill="#333"/>
      <circle cx="10" cy="28" r="1" fill="#333"/>
    </svg>
  `;
};

// 🎨 Criar ícone humano para o NPC
const createHumanIcon = (npc, zoom) => {
  // Cores de pele variadas
  const skinColors = [
    '#FFDAB9', '#F0D5BE', '#E8BEAC', '#D4A574', '#C68642',
    '#8D5524', '#6B4423', '#4A2511', '#3D1F14', '#2C1810'
  ];
  
  // Cores de roupa variadas
  const clothingColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#F77F00', '#06FFA5', '#118AB2', '#073B4C',
    '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'
  ];
  
  // Escolher cor baseada no ID do NPC (consistente)
  const npcId = npc.npcId || npc.id || 0;
  const skinIndex = typeof npcId === 'string' 
    ? npcId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % skinColors.length
    : npcId % skinColors.length;
  
  const clothingIndex = typeof npcId === 'string'
    ? npcId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % clothingColors.length
    : (npcId * 3) % clothingColors.length;
  
  const skinColor = npc.skinColor || skinColors[skinIndex];
  const clothingColor = npc.clothingColor || clothingColors[clothingIndex];
  
  // 🔍 Zoom baixo: ponto médio visível (8px em vez de 4px)
  if (zoom < 4) {
    return L.divIcon({
      className: 'npc-dot-marker',
      html: `
        <div style="
          width: 8px;
          height: 8px;
          background-color: ${clothingColor};
          border: 1px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          transition: all 10s linear;
          will-change: transform;
        "></div>
      `,
      iconSize: [8, 8],
      iconAnchor: [4, 4],
      popupAnchor: [0, -4]
    });
  }
  
  // 🚶 Ícone humano FIXO 15x30px (SEMPRE VISÍVEL)
  const svgString = createHumanSVG(skinColor, clothingColor, zoom);
  const width = 15;
  const height = 30;
  
  return L.divIcon({
    className: 'npc-human-marker',
    html: `
      <div style="
        width: ${width}px;
        height: ${height}px;
        transition: all 15s linear;
        will-change: transform;
        transform: translateZ(0);
        transform-origin: bottom center;
        z-index: 2000;
      ">
        ${svgString}
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height]
  });
};

/**
 * 🚶 Componente para renderizar NPCs como pessoas humanas
 */
export default function NPCMarkers({ cityId, countryId, zoom }) {
  // ✅ Todos os hooks primeiro
  const map = useMap();
  const [npcs, setNPCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const loadingRef = useRef(false);
  
  // ✅ Atualizar bounds do mapa
  useEffect(() => {
    if (!map) return;
    
    const updateBounds = () => {
      try {
        const bounds = map.getBounds();
        setMapBounds(bounds);
      } catch (error) {
        // Ignorar erros de bounds
      }
    };
    
    const timeout = setTimeout(updateBounds, 100);
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    return () => {
      clearTimeout(timeout);
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  // ✅ Carregar NPCs do backend
  useEffect(() => {
    const loadNPCs = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      
      try {
        if (npcs.length === 0) {
          setLoading(true);
        }
        
        const apiUrl = await getApiUrl();
        let url = `${apiUrl}/npcs`;
        const params = new URLSearchParams();
        
        if (cityId) {
          params.append('cityId', cityId);
        } else if (countryId) {
          params.append('countryId', countryId);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          // ✅ Atualizar apenas se houver mudanças reais
          setNPCs(prevNPCs => {
            const newNPCs = data.npcs || [];
            const hasChanges = newNPCs.some((newNpc, idx) => {
              const oldNpc = prevNPCs[idx];
              if (!oldNpc) return true;
              return oldNpc.position?.lat !== newNpc.position?.lat ||
                     oldNpc.position?.lng !== newNpc.position?.lng;
            });
            
            if (!hasChanges && prevNPCs.length === newNPCs.length) {
              return prevNPCs;
            }
            return newNPCs;
          });
        }
      } catch (error) {
        console.warn('Erro ao carregar NPCs:', error.message);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadNPCs();
    
    // ✅ Atualizar a cada 10 segundos (sincronizado com o movimento do backend)
    const interval = setInterval(loadNPCs, 10000);
    return () => clearInterval(interval);
  }, [cityId, countryId]);

  // ✅ Memoizar marcadores com virtualização
  const npcMarkers = useMemo(() => {
    // Filtrar NPCs visíveis
    const visibleNPCs = mapBounds ? npcs.filter((npc) => {
      if (!npc.position || !npc.position.lat || !npc.position.lng) {
        return false;
      }
      return mapBounds.contains([npc.position.lat, npc.position.lng]);
    }) : npcs;
    
    // Limitar quantidade por zoom
    const maxNPCs = zoom < 6 ? 200 : zoom < 10 ? 500 : 1000;
    const npcsToRender = visibleNPCs.slice(0, maxNPCs);
    
    return npcsToRender.map((npc) => {
      const icon = createHumanIcon(npc, zoom);

      return (
        <Marker
          key={npc.npcId || npc.id}
          position={[npc.position.lat, npc.position.lng]}
          icon={icon}
          zIndexOffset={2000}
        >
          <Popup>
            <div style={{ minWidth: '150px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                👤 {npc.name || 'Cidadão'}
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div>📍 <strong>Localização:</strong></div>
                <div style={{ marginLeft: '20px' }}>
                  {npc.cityName || 'Cidade desconhecida'}<br/>
                  {npc.stateName || ''}<br/>
                  {npc.countryName || npc.countryId}
                </div>
                <div style={{ marginTop: '8px' }}>
                  🚶 <strong>Status:</strong> {npc.status || 'Caminhando'}
                </div>
                <div>
                  🕐 <strong>Hora:</strong> {npc.virtualHour || 12}h
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [npcs, zoom, mapBounds]);

  if (loading && npcs.length === 0) {
    return null;
  }

  return <>{npcMarkers}</>;
}
