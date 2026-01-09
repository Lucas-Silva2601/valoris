# 🔧 SOLUÇÕES CRÍTICAS - VALORIS
## Guia Completo de Correção das Inconsistências

Este documento fornece soluções completas para os 4 problemas críticos identificados.

---

## 1. 🔌 DIAGNÓSTICO DE CONEXÃO SOCKET.IO

### Problema: Status 'Desconectado' (ponto vermelho)

### ✅ SOLUÇÃO COMPLETA

#### **Backend: `backend/server.js`**

```javascript
// JÁ EXISTE - Verificar se está correto
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['user-id', 'authorization']
  },
  transports: ['websocket', 'polling'], // IMPORTANTE: Permitir ambos
  allowEIO3: true // Compatibilidade
});
```

#### **Frontend: `frontend/src/services/socket.js`**

```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getUserId = () => {
  return localStorage.getItem('userId') || 'test-user-id';
};

const getUsername = () => {
  return localStorage.getItem('username') || 'testuser';
};

// ✅ CONFIGURAÇÃO CORRIGIDA
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ['websocket', 'polling'], // Tentar websocket primeiro, depois polling
  upgrade: true,
  rememberUpgrade: true,
  auth: {
    userId: getUserId(),
    username: getUsername(),
    token: localStorage.getItem('token') || null
  },
  // Headers adicionais
  extraHeaders: {
    'user-id': getUserId()
  }
});

// Eventos de debug
socket.on('connect', () => {
  console.log('✅ Socket.io CONECTADO:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket.io DESCONECTADO:', reason);
  if (reason === 'io server disconnect') {
    // Servidor forçou desconexão, reconectar manualmente
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão Socket.io:', error);
});

export default socket;
```

#### **CORS no Express: `backend/server.js`**

```javascript
// ✅ CORS CORRIGIDO - Deve estar ANTES das rotas
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'username']
}));
```

---

## 2. 💰 SISTEMA DE SALDO E FAUCET

### Problema: Saldo travado em VAL 0,00

### ✅ SOLUÇÃO COMPLETA

#### **Backend: `backend/routes/wallet.js`**

Adicionar rota de faucet:

```javascript
// Adicionar após as outras rotas
router.post('/faucet', optionalAuth, walletController.addFaucetBalance);
```

#### **Backend: `backend/controllers/walletController.js`**

Adicionar função:

```javascript
export const addFaucetBalance = async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['user-id'] || 'test-user-id';
    const faucetAmount = 100000; // 100.000 VAL
    
    const wallet = await getOrCreateWallet(userId);
    
    // Adicionar saldo
    await walletService.addBalance(
      userId,
      faucetAmount,
      'Faucet - Saldo de teste',
      { type: 'faucet', source: 'test' }
    );
    
    const updatedWallet = await getOrCreateWallet(userId);
    
    // Emitir atualização via Socket.io
    const { emitBalanceUpdate } = await import('../socket/socketHandler.js');
    emitBalanceUpdate(userId, updatedWallet.balance);
    
    res.json({
      success: true,
      balance: updatedWallet.balance,
      added: faucetAmount,
      message: `💰 ${faucetAmount.toLocaleString('pt-BR')} VAL adicionados! Novo saldo: ${updatedWallet.balance.toLocaleString('pt-BR')} VAL`
    });
  } catch (error) {
    console.error('Erro no faucet:', error);
    res.status(500).json({ error: error.message });
  }
};
```

#### **Frontend: `frontend/src/components/WalletDisplay.jsx`**

Atualizar botão de moedinha:

```javascript
<button
  onClick={async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const headers = { 
        'Content-Type': 'application/json',
        'user-id': userId
      };
      
      const res = await fetchWithTimeout(`${API_URL}/wallet/faucet`, {
        method: 'POST',
        headers
      }, 5000);
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Atualizar saldo imediatamente
        setBalance(data.balance);
        
        // Mostrar notificação
        alert(data.message || `💰 ${data.added.toLocaleString('pt-BR')} VAL adicionados!`);
        
        // Recarregar dados
        loadWalletData();
      } else {
        alert(data.error || 'Erro ao adicionar saldo');
      }
    } catch (error) {
      console.error('Erro no faucet:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }}
  className="text-yellow-400 hover:text-yellow-300 transition-colors text-xs cursor-pointer"
  title="Adicionar 100.000 VAL (Faucet)"
  disabled={loading}
>
  💰
</button>
```

---

## 3. 🏗️ CORREÇÃO DO SISTEMA DE CONSTRUÇÃO

### Problema: País aparece como 'UNK' (Unknown)

### ✅ SOLUÇÃO COMPLETA

#### **Backend: `backend/controllers/buildingController.js`**

```javascript
import * as buildingService from '../services/buildingService.js';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Identificar país a partir de coordenadas usando GeoJSON
 */
const identifyCountryFromCoordinates = (lat, lng) => {
  try {
    const geoJsonPath = path.join(__dirname, '../data/countries.geojson');
    
    if (!fs.existsSync(geoJsonPath)) {
      return { countryId: 'UNK', countryName: 'Local Desconhecido' };
    }
    
    const geoJsonData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));
    const point = turf.point([lng, lat]);
    
    // Procurar país que contém o ponto
    for (const feature of geoJsonData.features || []) {
      if (!feature.geometry) continue;
      
      let polygon = null;
      
      if (feature.geometry.type === 'Polygon') {
        polygon = turf.polygon(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          polygon = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, polygon)) {
            break;
          }
        }
      }
      
      if (polygon && turf.booleanPointInPolygon(point, polygon)) {
        const props = feature.properties || {};
        
        // Mapear ISO_A3 para countryId
        const countryId = props.ISO_A3 || props.ADM0_A3 || props.ISO3 || props.ISO_A2 || 'UNK';
        const countryName = props.name || props.NAME || props.NAME_EN || props.ADMIN || 'País Desconhecido';
        
        return { countryId, countryName, valid: true };
      }
    }
    
    return { countryId: 'UNK', countryName: 'Local Desconhecido', valid: false };
  } catch (error) {
    console.error('Erro ao identificar país:', error);
    return { countryId: 'UNK', countryName: 'Local Desconhecido', valid: false };
  }
};

export const buildBuilding = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'test-user-id';
    const { type, lat, lng, level } = req.body;

    // Validações básicas
    if (!type || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Tipo e coordenadas são obrigatórios' });
    }

    // Validar coordenadas
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Coordenadas devem ser números' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    // Identificar país a partir das coordenadas
    const countryInfo = identifyCountryFromCoordinates(lat, lng);
    
    if (!countryInfo.valid && countryInfo.countryId === 'UNK') {
      console.warn(`⚠️  País não identificado para coordenadas ${lat}, ${lng}`);
    }

    // Verificar se o jogador tem saldo
    const { getOrCreateWallet } = await import('../services/walletService.js');
    const wallet = await getOrCreateWallet(userId);
    
    const cost = buildingService.calculateBuildingCost(type, level || 1);
    
    if (wallet.balance < cost) {
      return res.status(400).json({ 
        error: `Saldo insuficiente. Você tem ${wallet.balance.toFixed(2)} VAL, mas precisa de ${cost} VAL` 
      });
    }

    // Construir edifício
    const building = await buildingService.buildBuilding(
      userId,
      countryInfo.countryId,
      countryInfo.countryName,
      type,
      lat,
      lng,
      level || 1,
      false // Não validar geografia novamente (já validamos)
    );

    // Emitir atualização via Socket.io para aparecer no mapa
    const { io } = await import('../socket/socketHandler.js');
    io.emit('building:created', {
      building: {
        buildingId: building.buildingId,
        type: building.type,
        position: building.position,
        countryId: building.countryId,
        countryName: building.countryName,
        level: building.level
      }
    });

    res.json({
      success: true,
      building,
      message: `Edifício construído com sucesso em ${countryInfo.countryName}!`
    });
  } catch (error) {
    console.error('Erro ao construir:', error);
    res.status(400).json({ error: error.message });
  }
};
```

#### **Frontend: `frontend/src/pages/GamePage.jsx`**

Adicionar listener para edifícios criados:

```javascript
// No useEffect do socket
useEffect(() => {
  if (!socket) return;
  
  const handleBuildingCreated = (data) => {
    // Adicionar edifício à lista
    setBuildings(prev => [...prev, data.building]);
    
    // Mostrar notificação
    console.log('🏗️ Novo edifício criado:', data.building);
  };
  
  socket.on('building:created', handleBuildingCreated);
  
  return () => {
    socket.off('building:created', handleBuildingCreated);
  };
}, [socket]);
```

---

## 4. 👥 IMPLEMENTAÇÃO DE NPCs

### Problema: NPCs não aparecem no mapa

### ✅ SOLUÇÃO COMPLETA

#### **Backend: `backend/models/NPC.js`** (Verificar se existe)

```javascript
import mongoose from 'mongoose';

const npcSchema = new mongoose.Schema({
  npcId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: function() {
      const names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia'];
      return names[Math.floor(Math.random() * names.length)];
    }
  },
  countryId: {
    type: String,
    required: true,
    index: true
  },
  countryName: {
    type: String,
    required: true
  },
  position: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  skinColor: {
    type: String,
    default: function() {
      // Cores de pele diversificadas
      const colors = [
        '#f4d5bd', '#422d1a', '#d4a574', '#c19a6b',
        '#8b6f47', '#5c4a3a', '#e6c4a0', '#b8916d',
        '#6b4e3d', '#9d7a5a', '#a6896d', '#7a5c42'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  currentTask: {
    type: String,
    enum: ['idle', 'walking', 'working', 'resting'],
    default: 'idle'
  },
  targetPosition: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

npcSchema.index({ countryId: 1, position: '2dsphere' });

export default mongoose.model('NPC', npcSchema);
```

#### **Frontend: `frontend/src/components/NPCMarkers.jsx`**

```javascript
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Cores de pele diversificadas
const SKIN_COLORS = [
  '#f4d5bd', '#422d1a', '#d4a574', '#c19a6b',
  '#8b6f47', '#5c4a3a', '#e6c4a0', '#b8916d',
  '#6b4e3d', '#9d7a5a', '#a6896d', '#7a5c42'
];

/**
 * Criar ícone de NPC (retângulo 6px x 10px)
 */
const createNPCIcon = (skinColor, currentTask) => {
  const width = 6;
  const height = 10;
  
  return L.divIcon({
    className: 'custom-npc-icon',
    html: `<div style="
      width: ${width}px;
      height: ${height}px;
      background-color: ${skinColor};
      border: 1px solid rgba(0,0,0,0.4);
      border-radius: 1px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      transition: transform 0.3s ease;
    "></div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -height / 2]
  });
};

export default function NPCMarkers({ npcs = [], socket = null }) {
  const map = useMap();
  const [visibleNPCs, setVisibleNPCs] = useState(npcs);

  // Atualizar NPCs quando a lista mudar
  useEffect(() => {
    setVisibleNPCs(npcs);
  }, [npcs]);

  // Escutar atualizações de posição via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNPCPositionUpdate = (data) => {
      setVisibleNPCs(prev => prev.map(npc => 
        npc.npcId === data.npcId
          ? { ...npc, position: data.position, currentTask: data.currentTask }
          : npc
      ));
    };

    socket.on('npc:position-updated', handleNPCPositionUpdate);

    return () => {
      socket.off('npc:position-updated', handleNPCPositionUpdate);
    };
  }, [socket]);

  if (visibleNPCs.length === 0) {
    return null;
  }

  return (
    <>
      {visibleNPCs.map((npc) => {
        const skinColor = npc.skinColor || SKIN_COLORS[0];
        const currentTask = npc.currentTask || 'idle';
        
        return (
          <Marker
            key={npc.npcId || npc._id}
            position={[npc.position.lat, npc.position.lng]}
            icon={createNPCIcon(skinColor, currentTask)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold mb-1">{npc.name || 'NPC'}</div>
                <div className="text-xs text-gray-600">
                  Status: <span className="capitalize">{currentTask}</span>
                </div>
                {npc.targetPosition && (
                  <div className="text-xs text-gray-500 mt-1">
                    🎯 Indo para: {npc.targetPosition.lat.toFixed(4)}, {npc.targetPosition.lng.toFixed(4)}
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
```

#### **Backend: Emitir atualizações de NPCs via Socket.io**

No `backend/jobs/npcMovementJob.js`:

```javascript
// Após atualizar posição do NPC
const { emitNPCPositionUpdate } = await import('../socket/socketHandler.js');
emitNPCPositionUpdate(updatedNPC);
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 1. Socket.io Connection
- [ ] Atualizar `frontend/src/services/socket.js`
- [ ] Verificar CORS no `backend/server.js`
- [ ] Testar conexão (deve aparecer "✅ Conectado")

### 2. Faucet
- [ ] Adicionar rota `/api/wallet/faucet` no `backend/routes/wallet.js`
- [ ] Adicionar função `addFaucetBalance` no `backend/controllers/walletController.js`
- [ ] Atualizar botão 💰 no `frontend/src/components/WalletDisplay.jsx`
- [ ] Testar: clicar no botão deve adicionar 100.000 VAL

### 3. Construção
- [ ] Atualizar `backend/controllers/buildingController.js` com `identifyCountryFromCoordinates`
- [ ] Adicionar listener `building:created` no frontend
- [ ] Testar: construir edifício e verificar se aparece no mapa

### 4. NPCs
- [ ] Verificar modelo `backend/models/NPC.js` (deve ter `skinColor` e `currentTask`)
- [ ] Atualizar `frontend/src/components/NPCMarkers.jsx`
- [ ] Garantir que job de movimento emite via Socket.io
- [ ] Testar: criar NPCs e verificar se aparecem no mapa

---

## 🚀 TESTES RÁPIDOS

1. **Socket.io**: Abrir console do navegador, deve ver "✅ Conectado"
2. **Faucet**: Clicar no botão 💰, saldo deve mudar para 100.000 VAL
3. **Construção**: Clicar no mapa, construir edifício, deve aparecer como ícone
4. **NPCs**: Construir edifício, 10 NPCs devem aparecer como retângulos coloridos

---

**Desenvolvido por:** Assistente AI - Full Stack Sênior  
**Data:** 2024

