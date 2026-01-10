import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// ✅ Gerar cor variada baseada em um seed (para manter consistência por edifício)
const generateColor = (seed, hueRange, satRange = [40, 70], lightRange = [45, 65]) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (hash * 137.508) % (hueRange[1] - hueRange[0]) + hueRange[0];
  const sat = (hash * 97) % (satRange[1] - satRange[0]) + satRange[0];
  const light = (hash * 73) % (lightRange[1] - lightRange[0]) + lightRange[0];
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

// ✅ Renderizar casa (house) - baseado na imagem fornecida
const renderHouse = (seed, size, level) => {
  const wallColor = generateColor(seed + 'wall', [15, 45]); // Tons laranja/amarelo
  const roofColor = generateColor(seed + 'roof', [25, 55], [60, 80], [55, 75]); // Tons amarelo-alaranjado mais claro
  const doorColor = generateColor(seed + 'door', [180, 220], [50, 70], [30, 50]); // Tons azul-petróleo
  const windowColor = doorColor; // Mesma cor das portas
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
      <!-- Base cinza-clara -->
      <rect x="5" y="42" width="40" height="4" fill="#d0d0d0" rx="1"/>
      
      <!-- Paredes laranja -->
      <rect x="8" y="18" width="34" height="24" fill="${wallColor}" stroke="#333" stroke-width="0.5"/>
      
      <!-- Telhado triangular -->
      <polygon points="25,8 8,18 42,18" fill="${roofColor}" stroke="#333" stroke-width="0.5"/>
      
      <!-- Porta azul-petróleo central -->
      <rect x="19" y="30" width="12" height="12" fill="${doorColor}" stroke="#1a3a3a" stroke-width="0.5"/>
      <circle cx="29" cy="36" r="1.5" fill="#1a3a3a"/>
      
      <!-- Janela circular superior central -->
      <circle cx="25" cy="23" r="4" fill="${windowColor}" stroke="#1a3a3a" stroke-width="0.5"/>
      <line x1="25" y1="19" x2="25" y2="27" stroke="#1a3a3a" stroke-width="0.5"/>
      <line x1="21" y1="23" x2="29" y2="23" stroke="#1a3a3a" stroke-width="0.5"/>
      
      <!-- Janela retangular à direita da porta -->
      <rect x="32" y="28" width="8" height="6" fill="${windowColor}" stroke="#1a3a3a" stroke-width="0.5"/>
      <line x1="36" y1="28" x2="36" y2="34" stroke="#1a3a3a" stroke-width="0.5"/>
      <line x1="32" y1="31" x2="40" y2="31" stroke="#1a3a3a" stroke-width="0.5"/>
    </svg>
  `;
};

// ✅ Renderizar prédio/apartamento (apartment) - baseado na imagem fornecida
const renderApartment = (seed, size, level) => {
  const wallColor = generateColor(seed + 'wall', [15, 35], [50, 70], [60, 80]); // Tons laranja/pêssego claro
  const roofColor = generateColor(seed + 'roof', [20, 40], [40, 60], [25, 45]); // Tons marrom escuro
  const windowColor = generateColor(seed + 'window', [190, 220], [30, 50], [70, 90]); // Tons azul claro/branco
  const doorColor = roofColor; // Mesma cor do telhado
  const framesColor = '#5d4037'; // Marrom escuro para frames
  
  const floors = Math.min(3 + Math.floor(level / 2), 5); // Mais andares com nível maior
  const scale = 1 + (level - 1) * 0.1;
  const floorHeight = 10 * scale;
  const width = 35 * scale;
  
  let windows = '';
  // Janelas em cada andar
  for (let floor = 0; floor < floors - 1; floor++) {
    const yPos = 45 - (floor + 1) * floorHeight - 2;
    // Janela esquerda
    windows += `<rect x="9" y="${yPos}" width="8" height="6" fill="${windowColor}" stroke="${framesColor}" stroke-width="0.5"/>`;
    windows += `<line x1="13" y1="${yPos}" x2="13" y2="${yPos + 6}" stroke="${framesColor}" stroke-width="0.5"/>`;
    windows += `<line x1="9" y1="${yPos + 3}" x2="17" y2="${yPos + 3}" stroke="${framesColor}" stroke-width="0.5"/>`;
    // Janela direita
    windows += `<rect x="26" y="${yPos}" width="8" height="6" fill="${windowColor}" stroke="${framesColor}" stroke-width="0.5"/>`;
    windows += `<line x1="30" y1="${yPos}" x2="30" y2="${yPos + 6}" stroke="${framesColor}" stroke-width="0.5"/>`;
    windows += `<line x1="26" y1="${yPos + 3}" x2="34" y2="${yPos + 3}" stroke="${framesColor}" stroke-width="0.5"/>`;
  }
  
  // Porta no térreo
  const doorY = 45 - floorHeight + 1;
  const door = `
    <rect x="17.5" y="${doorY}" width="8" height="${floorHeight - 2}" fill="${doorColor}" stroke="${framesColor}" stroke-width="0.5"/>
    <circle cx="24" cy="${doorY + floorHeight / 2 - 1}" r="1" fill="#1a1a1a"/>
  `;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
      <!-- Paredes principais -->
      <rect x="7" y="${50 - floors * floorHeight}" width="${width}" height="${floors * floorHeight}" fill="${wallColor}" stroke="#333" stroke-width="0.5"/>
      
      <!-- Telhado -->
      <rect x="7" y="${50 - floors * floorHeight - 3}" width="${width}" height="3" fill="${roofColor}" stroke="#333" stroke-width="0.5"/>
      
      <!-- Janelas -->
      ${windows}
      
      <!-- Porta -->
      ${door}
    </svg>
  `;
};

// ✅ Renderizar escritório (office) - similar ao apartamento mas mais formal
const renderOffice = (seed, size, level) => {
  const wallColor = generateColor(seed + 'wall', [200, 230], [40, 60], [50, 70]); // Tons azul-cinza
  const roofColor = generateColor(seed + 'roof', [0, 40], [30, 50], [30, 50]); // Tons cinza/verde escuro
  const windowColor = generateColor(seed + 'window', [190, 220], [50, 70], [80, 95]); // Janelas claras
  
  const floors = Math.min(2 + Math.floor(level / 2), 4);
  const scale = 1 + (level - 1) * 0.12;
  const floorHeight = 11 * scale;
  const width = 38 * scale;
  
  let windows = '';
  for (let floor = 0; floor < floors; floor++) {
    const yPos = 50 - (floor + 1) * floorHeight - 1;
    // Múltiplas janelas
    for (let w = 0; w < 3; w++) {
      const xPos = 9 + w * 11;
      windows += `<rect x="${xPos}" y="${yPos}" width="7" height="7" fill="${windowColor}" stroke="#333" stroke-width="0.4"/>`;
    }
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
      <rect x="6" y="${50 - floors * floorHeight}" width="${width}" height="${floors * floorHeight}" fill="${wallColor}" stroke="#333" stroke-width="0.5"/>
      <rect x="6" y="${50 - floors * floorHeight - 4}" width="${width}" height="4" fill="${roofColor}"/>
      ${windows}
      <rect x="20" y="${50 - floorHeight + 2}" width="10" height="${floorHeight - 4}" fill="${roofColor}" stroke="#333" stroke-width="0.5"/>
    </svg>
  `;
};

// ✅ Renderizar arranha-céu (skyscraper) - edifício alto
const renderSkyscraper = (seed, size, level) => {
  const wallColor = generateColor(seed + 'wall', [180, 280], [30, 60], [40, 75]);
  const windowColor = generateColor(seed + 'window', [200, 230], [40, 70], [60, 90]);
  
  const floors = Math.min(5 + level * 2, 10);
  const scale = 1 + (level - 1) * 0.15;
  const floorHeight = 4.5 * scale;
  const width = 18 * scale;
  
  let windows = '';
  for (let floor = 0; floor < floors; floor++) {
    const yPos = 50 - (floor + 1) * floorHeight - 0.5;
    for (let w = 0; w < 2; w++) {
      const xPos = 16 + w * 9;
      windows += `<rect x="${xPos}" y="${yPos}" width="6" height="${floorHeight - 0.5}" fill="${windowColor}" stroke="#222" stroke-width="0.3" opacity="0.8"/>`;
    }
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));">
      <rect x="16" y="${50 - floors * floorHeight}" width="${width}" height="${floors * floorHeight}" fill="${wallColor}" stroke="#333" stroke-width="0.5"/>
      <polygon points="25,${50 - floors * floorHeight - 3} 16,${50 - floors * floorHeight} 34,${50 - floors * floorHeight}" fill="#444"/>
      ${windows}
    </svg>
  `;
};

// ✅ Renderizar fábrica (factory) - baseado na imagem fornecida
const renderFactory = (seed, size, level) => {
  const mainColor = generateColor(seed + 'main', [0, 50], [30, 60], [70, 95]); // Tons branco/cinza claro
  const roofColor = generateColor(seed + 'roof', [0, 50], [40, 70], [25, 45]); // Tons cinza escuro
  const stripeColor = generateColor(seed + 'stripe', [0, 20], [60, 90], [40, 60]); // Tons vermelho
  const windowColor = generateColor(seed + 'window', [200, 230], [40, 70], [15, 35]); // Tons azul escuro
  const chimneyColor = generateColor(seed + 'chimney', [0, 50], [20, 40], [50, 70]); // Tons cinza
  
  const scale = 1 + (level - 1) * 0.12;
  const width = 42 * scale;
  
  // Chaminés
  const chimneys = [28, 32, 36].map((x, i) => 
    `<rect x="${x}" y="8" width="2.5" height="12" fill="${chimneyColor}" stroke="#333" stroke-width="0.3"/>
     <rect x="${x - 0.5}" y="6" width="3.5" height="2" fill="${chimneyColor}"/>
     <rect x="${x}" y="18" width="2.5" height="3" fill="${stripeColor}"/>`
  ).join('');
  
  // Janelas
  let windows = '';
  // Janelas na seção alta
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 8 + col * 5;
      const y = 28 + row * 5;
      windows += `<rect x="${x}" y="${y}" width="3.5" height="3.5" fill="${windowColor}" stroke="#1a1a1a" stroke-width="0.3"/>`;
    }
  }
  // Janelas na seção baixa
  for (let col = 0; col < 4; col++) {
    const x = 22 + col * 5;
    const y = 35;
    windows += `<rect x="${x}" y="${y}" width="3.5" height="3.5" fill="${windowColor}" stroke="#1a1a1a" stroke-width="0.3"/>`;
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
      <!-- Seção alta (esquerda) -->
      <rect x="6" y="20" width="20" height="30" fill="${mainColor}" stroke="#333" stroke-width="0.5"/>
      <rect x="6" y="18" width="20" height="2" fill="${roofColor}"/>
      
      <!-- Seção baixa (direita) -->
      <rect x="22" y="32" width="22" height="18" fill="${mainColor}" stroke="#333" stroke-width="0.5"/>
      <rect x="22" y="30" width="22" height="2" fill="${roofColor}"/>
      
      <!-- Faixa vermelha -->
      <rect x="6" y="38" width="20" height="1.5" fill="${stripeColor}"/>
      <rect x="22" y="40" width="22" height="1.5" fill="${stripeColor}"/>
      
      <!-- Porta de garagem azul -->
      <rect x="6" y="42" width="10" height="8" fill="${windowColor}" stroke="#1a1a1a" stroke-width="0.5"/>
      <line x1="11" y1="42" x2="11" y2="50" stroke="#1a1a1a" stroke-width="0.5"/>
      
      <!-- Chaminés -->
      ${chimneys}
      
      <!-- Janelas -->
      ${windows}
      
      <!-- Caixa marrom -->
      <rect x="18" y="44" width="3" height="3" fill="#8b4513" stroke="#654321" stroke-width="0.3"/>
    </svg>
  `;
};

// ✅ Renderizar shopping (mall) - edifício grande e comercial
const renderMall = (seed, size, level) => {
  const wallColor = generateColor(seed + 'wall', [180, 280], [40, 70], [50, 80]);
  const roofColor = generateColor(seed + 'roof', [0, 50], [50, 80], [30, 50]);
  const accentColor = generateColor(seed + 'accent', [300, 360], [60, 90], [50, 70]);
  const windowColor = generateColor(seed + 'window', [200, 230], [50, 80], [70, 95]);
  
  const scale = 1 + (level - 1) * 0.1;
  const width = 45 * scale;
  const height = 28 * scale;
  
  let windows = '';
  for (let w = 0; w < 6; w++) {
    const x = 4 + w * 7;
    windows += `<rect x="${x}" y="22" width="5" height="6" fill="${windowColor}" stroke="#333" stroke-width="0.4"/>`;
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
      <rect x="2.5" y="${50 - height}" width="${width}" height="${height}" fill="${wallColor}" stroke="#333" stroke-width="0.5"/>
      <rect x="2.5" y="${50 - height - 2}" width="${width}" height="2" fill="${roofColor}"/>
      <rect x="2.5" y="${50 - height + 2}" width="${width}" height="1.5" fill="${accentColor}"/>
      ${windows}
      <!-- Portas principais -->
      <rect x="18" y="${50 - height / 2 + 4}" width="8" height="${height / 2 - 6}" fill="${accentColor}" stroke="#333" stroke-width="0.5"/>
      <rect x="26" y="${50 - height / 2 + 4}" width="8" height="${height / 2 - 6}" fill="${accentColor}" stroke="#333" stroke-width="0.5"/>
    </svg>
  `;
};

// ✅ Criar ícones customizados para cada tipo de edifício
const createBuildingIcon = (type, level, buildingId) => {
  const baseSize = 30 + (level || 1) * 3; // Tamanho baseado no nível
  const size = Math.min(baseSize, 55); // Tamanho máximo
  
  let svg = '';
  const seed = buildingId || `${type}-${level}`;
  
  switch (type) {
    case 'house':
      svg = renderHouse(seed, size, level || 1);
      break;
    case 'apartment':
      svg = renderApartment(seed, size, level || 1);
      break;
    case 'office':
      svg = renderOffice(seed, size, level || 1);
      break;
    case 'skyscraper':
      svg = renderSkyscraper(seed, size, level || 1);
      break;
    case 'factory':
      svg = renderFactory(seed, size, level || 1);
      break;
    case 'mall':
      svg = renderMall(seed, size, level || 1);
      break;
    default:
      // Fallback genérico
      svg = renderHouse(seed, size, level || 1);
  }

  return L.divIcon({
    className: 'custom-building-icon',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export default function BuildingMarkers({ countryId, buildings = [] }) {
  const map = useMap();
  const [visibleBuildings, setVisibleBuildings] = useState(buildings);

  // ✅ Atualizar edifícios visíveis baseado no zoom E na lista de edifícios
  useEffect(() => {
    if (!buildings || buildings.length === 0) {
      setVisibleBuildings([]);
      return;
    }
    
    const updateVisibleBuildings = () => {
      const zoom = map.getZoom();
      // ✅ IMPORTANTE: Sempre mostrar TODOS os edifícios se zoom >= 5
      // Apenas filtrar em zoom muito baixo (< 5) se houver muitos edifícios (performance)
      if (zoom < 5 && buildings.length > 50) {
        // Se houver muitos edifícios, filtrar apenas os grandes em zoom muito baixo
        const filtered = buildings.filter(b => 
          b.type === 'skyscraper' || 
          b.type === 'factory' || 
          b.level >= 5
        );
        setVisibleBuildings(filtered);
        if (filtered.length > 0) {
          console.log(`🏗️ Zoom baixo (${zoom}): Mostrando ${filtered.length} edifícios grandes de ${buildings.length} total`);
        }
      } else {
        // ✅ Sempre mostrar TODOS os edifícios em zoom normal/alto (>= 5)
        setVisibleBuildings(buildings);
        if (buildings.length > 0) {
          console.log(`🏗️ Zoom ${zoom}: Mostrando TODOS os ${buildings.length} edifícios`);
        }
      }
    };

    updateVisibleBuildings();
    map.on('zoomend', updateVisibleBuildings);

    return () => {
      map.off('zoomend', updateVisibleBuildings);
    };
  }, [map, buildings]);

  // ✅ IMPORTANTE: Sempre mostrar TODOS os edifícios, independentemente do país selecionado
  // O mapa deve mostrar todas as construções do usuário, não apenas de um país
  if (visibleBuildings.length === 0) {
    if (buildings.length > 0) {
      console.log(`⚠️ Nenhum edifício visível no zoom atual (${map.getZoom()}), mas há ${buildings.length} edifícios no total`);
    }
    return null;
  }
  
  // ✅ SEMPRE mostrar todos os edifícios visíveis, não filtrar por país
  const buildingsToShow = visibleBuildings;
  
  if (buildingsToShow.length === 0) {
    return null;
  }
  
  // ✅ Log apenas quando houver edifícios para renderizar
  if (buildingsToShow.length > 0) {
    console.log(`🏗️ Renderizando ${buildingsToShow.length} edifícios no mapa (zoom: ${map.getZoom()})`);
  }

  return (
    <>
      {buildingsToShow.map((building) => {
        // ✅ Garantir que o edifício tem posição válida (aceitar ambos os formatos)
        const lat = building.position?.lat ?? building.position_lat ?? null;
        const lng = building.position?.lng ?? building.position_lng ?? null;
        
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
          console.warn('⚠️ Edifício sem posição válida:', {
            buildingId: building.buildingId || building.building_id || building.id,
            type: building.type,
            position: building.position,
            position_lat: building.position_lat,
            position_lng: building.position_lng
          });
          return null;
        }
        
        // ✅ Validar limites de coordenadas
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn('⚠️ Edifício com coordenadas fora dos limites:', {
            buildingId: building.buildingId || building.building_id || building.id,
            lat,
            lng
          });
          return null;
        }
        
        const position = [parseFloat(lat), parseFloat(lng)];
        
        const buildingId = building.buildingId || building.building_id || building.id || `building-${building.type}`;
        
        return (
        <Marker
          key={buildingId}
          position={position}
          icon={createBuildingIcon(building.type, building.level || 1, buildingId)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold mb-1">{building.name}</div>
              <div>Tipo: {building.type}</div>
              <div>Nível: {building.level}</div>
              <div>Capacidade: {building.capacity} pessoas</div>
              {building.revenuePerHour > 0 && (
                <div>Receita: {building.revenuePerHour.toFixed(2)} VAL/hora</div>
              )}
              <div>Condição: {building.condition}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {building.countryName || building.country_name || 'País Desconhecido'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
        );
      })}
    </>
  );
}

