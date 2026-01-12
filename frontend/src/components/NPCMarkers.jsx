import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getApiUrl } from '../config/api';

// ✅ FASE 18.5: Criar ícone vertical para NPC (retângulo 4x10px com sombra)
const createNPCIcon = (routineState) => {
  // Cores baseadas no estado da rotina
  const colors = {
    resting: '#4CAF50',      // Verde - descansando
    going_to_work: '#FF9800', // Laranja - indo para trabalho
    working: '#2196F3',       // Azul - trabalhando
    going_home: '#9C27B0'    // Roxo - voltando para casa
  };

  const color = colors[routineState] || '#757575';

  return L.divIcon({
    className: 'npc-marker',
    html: `
      <div style="
        width: 4px;
        height: 10px;
        background-color: ${color};
        border: 1px solid rgba(0,0,0,0.3);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        border-radius: 2px;
        transition: all 5s linear;
      "></div>
    `,
    iconSize: [4, 10],
    iconAnchor: [2, 10],
    popupAnchor: [0, -10]
  });
};

/**
 * ✅ FASE 18.5: Componente para renderizar NPCs no mapa
 */
export default function NPCMarkers({ cityId, countryId, zoom }) {
  const [npcs, setNPCs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Carregar NPCs apenas em zoom alto (>= 10) para performance
  useEffect(() => {
    if (zoom < 10) {
      setNPCs([]);
      return;
    }

    const loadNPCs = async () => {
      try {
        setLoading(true);
        
        // ✅ Usar porta dinâmica do backend
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
          setNPCs(data.npcs || []);
        } else {
          // ✅ FASE 19.1: Fallback - retornar array vazio se API falhar
          console.warn(`⚠️ API de NPCs retornou status ${response.status}, usando fallback []`);
          setNPCs([]);
        }
      } catch (error) {
        // ✅ FASE 19.1: Fallback - retornar array vazio se fetch falhar
        console.warn('Erro ao carregar NPCs, usando fallback []:', error.message);
        setNPCs([]);
      } finally {
        setLoading(false);
      }
    };

    loadNPCs();

    // ✅ Atualizar NPCs a cada 5 segundos para movimento suave
    const interval = setInterval(loadNPCs, 5000);
    return () => clearInterval(interval);
  }, [cityId, countryId, zoom]);

  if (zoom < 10 || loading || npcs.length === 0) {
    return null;
  }

  return (
    <>
      {npcs.map((npc) => {
        if (!npc.position || !npc.position.lat || !npc.position.lng) {
          return null;
        }

        const icon = createNPCIcon(npc.routineState || 'resting');

        return (
          <Marker
            key={npc.npcId || npc.id}
            position={[npc.position.lat, npc.position.lng]}
            icon={icon}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  {npc.name || 'NPC'}
                </h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div><strong>Estado:</strong> {npc.routineState || 'resting'}</div>
                  <div><strong>Cidade:</strong> {npc.cityName || 'Desconhecida'}</div>
                  <div><strong>Hora Virtual:</strong> {npc.virtualHour || 8}h</div>
                  {npc.status && <div><strong>Status:</strong> {npc.status}</div>}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

