# 📚 Implementação Completa - VALORIS
## Guia Passo a Passo para as 3 Funcionalidades Críticas

Este documento fornece uma explicação detalhada de como implementar as 3 funcionalidades críticas solicitadas:

1. **Sistema de 'Modo Deus' para Testes**
2. **Fluxo de Construção no Mapa**
3. **Sistema de NPCs com Visual Diversificado e Movimento Suave**

---

## 🗂️ Estrutura de Pastas

```
backend/
├── routes/
│   └── admin.js                    # ✅ NOVO - Rotas administrativas
├── controllers/
│   └── adminController.js          # ✅ NOVO - Controller do Modo Deus
├── services/
│   ├── buildingService.js          # ✅ MELHORADO - Validação geográfica com Turf.js
│   └── npcService.js               # ✅ MELHORADO - Retorna NPCs atualizados
├── socket/
│   └── socketHandler.js            # ✅ MELHORADO - Eventos Socket.io para NPCs
└── jobs/
    └── npcMovementJob.js           # ✅ MELHORADO - Emite atualizações via Socket.io

frontend/
├── components/
│   ├── GodModePanel.jsx            # ✅ NOVO - Painel do Modo Deus
│   ├── BuildingModal.jsx           # ✅ EXISTENTE - Modal de construção
│   └── NPCMarkers.jsx              # ✅ MELHORADO - Cores diversificadas + Socket.io
└── pages/
    └── GamePage.jsx                # ✅ INTEGRAR - Integrar GodModePanel e melhorias
```

---

## 1. 🎮 Sistema de 'Modo Deus' para Testes

### 📋 Visão Geral

Permite definir ou adicionar saldo a qualquer usuário durante a fase de testes, sem restrições.

### 🔧 Backend

#### **`backend/routes/admin.js`**
Rotas administrativas com autenticação opcional para fase de teste.

**Principais Rotas:**
- `POST /api/admin/wallet/set-balance` - Define saldo de um usuário
- `POST /api/admin/wallet/add-balance` - Adiciona saldo a um usuário
- `GET /api/admin/users` - Lista todos os usuários com seus saldos

**Lógica:**
- Middleware `adminOrTestMode` permite acesso sem autenticação em fase de teste
- Em produção, deve usar `requireRole('admin')`

#### **`backend/controllers/adminController.js`**
Controller que gerencia operações administrativas.

**Funções Principais:**

1. **`setWalletBalance`**: Define o saldo exato de um usuário
   - Valida `userId` e `balance`
   - Atualiza carteira
   - Registra transação de auditoria
   - Emite atualização via Socket.io

2. **`addWalletBalance`**: Adiciona ou subtrai saldo
   - Permite valores positivos ou negativos
   - Usa `walletService.addBalance` para consistência

3. **`listUsers`**: Lista todos os usuários com suas carteiras
   - Ordena por saldo (maior para menor)
   - Limita a 100 usuários

### 🎨 Frontend

#### **`frontend/src/components/GodModePanel.jsx`**
Componente React completo com:

**Features:**
- Modo "Definir Saldo" ou "Adicionar Saldo"
- Input para User ID
- Input numérico para valor
- Botões rápidos (10K, 50K, 100K, 500K, 1M, 10M)
- Campo opcional de motivo
- Lista de usuários com seus saldos
- Feedback visual (sucesso/erro)

**Integração:**
```jsx
import GodModePanel from './components/GodModePanel';

<GodModePanel 
  userId={currentUserId} 
  onBalanceUpdate={(userId, balance) => {
    // Atualizar UI quando saldo mudar
  }} 
/>
```

---

## 2. 🏗️ Fluxo de Construção no Mapa

### 📋 Visão Geral

Sistema completo de construção que valida geograficamente o ponto de construção usando Turf.js.

### 🔧 Backend

#### **`backend/services/buildingService.js`** (MELHORADO)

**Melhorias Implementadas:**

1. **Validação Geográfica com Turf.js:**
   ```javascript
   validatePointInCountry(lat, lng, countriesGeoJSON)
   ```
   - Carrega GeoJSON de países do arquivo `backend/data/countries.geojson`
   - Usa `turf.booleanPointInPolygon` para verificar se o ponto está dentro de um país
   - Retorna país identificado ou permite construção genérica se validação desabilitada

2. **Validação de Coordenadas:**
   - Verifica se `lat` está entre -90 e 90
   - Verifica se `lng` está entre -180 e 180

3. **Verificação de Proximidade:**
   - Evita sobreposição de edifícios (mínimo 100m)
   - Usa consulta geográfica MongoDB (`$near`)

**Fluxo Completo:**

```javascript
buildBuilding(userId, countryId, countryName, type, lat, lng, level, validateGeography)
  1. Validar coordenadas
  2. Validar geografia (se habilitado) → Identifica país automaticamente
  3. Calcular custo
  4. Verificar saldo
  5. Verificar proximidade de outros edifícios
  6. Criar edifício no MongoDB
  7. Subtrair saldo
  8. Criar 10 NPCs construtores
  9. Retornar edifício criado
```

### 🎨 Frontend

#### **`frontend/src/components/BuildingModal.jsx`** (EXISTENTE)

**Melhorias Necessárias:**

1. **Integração com Clique no Mapa:**
   - O componente já existe e funciona
   - Deve ser aberto quando o usuário clicar no mapa
   - Recebe `lat`, `lng`, `countryId`, `countryName` como props

2. **Validação no Frontend:**
   - Valida se `countryId` e `countryName` estão presentes
   - Mostra erro se coordenadas inválidas
   - Desabilita botão de construir se dados inválidos

#### **Integração no `GamePage.jsx`:**

```jsx
// No componente WorldMap ou GamePage
const handleMapClick = (e) => {
  const { lat, lng } = e.latlng;
  // Identificar país usando countryUtils.js
  const countryId = getCountryId(e.target.feature);
  const countryName = getCountryName(e.target.feature);
  
  // Abrir modal de construção
  setBuildingPosition({ lat, lng });
  setBuildingCountry({ id: countryId, name: countryName });
  setShowBuildingModal(true);
};
```

---

## 3. 👥 Sistema de NPCs (Visual Diversificado + Movimento Suave)

### 📋 Visão Geral

NPCs aparecem como pequenos retângulos coloridos no mapa, com cores de pele diversificadas (tons de marrom, bege e bronze), e se movem suavemente entre locais usando Socket.io em tempo real.

### 🎨 Frontend

#### **`frontend/src/components/NPCMarkers.jsx`** (MELHORADO)

**Melhorias Implementadas:**

1. **Cores Diversificadas:**
   ```javascript
   generateSkinColor(npcId)
   ```
   - Paleta de 12 cores de pele (tons de marrom, bege e bronze)
   - Hash determinístico do `npcId` para manter cor consistente
   - Cores: `#f4d5bd`, `#422d1a`, `#d4a574`, `#c19a6b`, `#8b6f47`, etc.

2. **Visual de Retângulo (Pessoa Vista de Cima):**
   - Largura: 6-8px (baseado no status)
   - Altura: 10-12px (baseado no status)
   - Bordas arredondadas (2px)
   - Sombra para profundidade
   - Transição CSS suave

3. **Movimento Suave via Socket.io:**
   - Listener `npc:position-updated` para atualizações individuais
   - Listener `npc:batch-updated` para atualizações em lote
   - Cache de posições para transições suaves
   - Atualização automática a cada 5 segundos (fallback se Socket.io falhar)

**Integração:**

```jsx
import { useSocket } from '../hooks/useSocket';

const socket = useSocket();

<NPCMarkers 
  countryId={selectedCountry} 
  npcs={npcs} 
  socket={socket}
/>
```

### 🔧 Backend

#### **`backend/socket/socketHandler.js`** (MELHORADO)

**Novos Eventos Socket.io:**

1. **`emitNPCPositionUpdate(npc)`**: Emite atualização de um único NPC
   ```javascript
   broadcast('npc:position-updated', {
     npcId, position, targetPosition, status, npcType, timestamp
   });
   ```

2. **`emitNPCsBatchUpdate(npcs)`**: Emite atualização em lote
   ```javascript
   broadcast('npc:batch-updated', {
     npcs: [...], timestamp
   });
   ```

3. **`emitNPCsForCountry(countryId, npcs)`**: Emite para NPCs de um país
   ```javascript
   emitToCountry(countryId, 'npc:country-updated', { countryId, npcs, timestamp });
   ```

#### **`backend/services/npcService.js`** (MELHORADO)

**Melhorias:**

1. **Retorno de NPCs Atualizados:**
   - `processAllNPCsMovement()` agora retorna `npcs` atualizados
   - Permite que o job emita atualizações via Socket.io

2. **Movimento em Terra Firme:**
   - NPCs só se movem em terra (usando `isOnLand`)
   - Se nova posição não está em terra, tenta ajustar
   - Evita NPCs no oceano

#### **`backend/jobs/npcMovementJob.js`** (MELHORADO)

**Melhorias:**

1. **Emissão via Socket.io:**
   ```javascript
   if (result.npcs && result.npcs.length > 0) {
     emitNPCsBatchUpdate(result.npcs);
   }
   ```

2. **Frequência Otimizada:**
   - Executa a cada 5 segundos (movimento suave mas não muito pesado)
   - Processa até 50 NPCs idle por vez

---

## 🔗 Integração Completa

### Passo 1: Adicionar Rotas Admin no Server

```javascript
// backend/server.js
import adminRoutes from './routes/admin.js';

app.use('/api/admin', adminRoutes);
```

### Passo 2: Integrar GodModePanel no GamePage

```jsx
// frontend/src/pages/GamePage.jsx
import GodModePanel from '../components/GodModePanel';

// Adicionar estado
const [showGodMode, setShowGodMode] = useState(false);

// Adicionar botão (ex: Ctrl+Shift+G)
// No render:
{showGodMode && (
  <div className="fixed top-4 right-4 z-50 w-96">
    <GodModePanel userId={userId} onBalanceUpdate={handleBalanceUpdate} />
    <button onClick={() => setShowGodMode(false)}>Fechar</button>
  </div>
)}
```

### Passo 3: Atualizar NPCMarkers para Usar Socket

```jsx
// frontend/src/pages/GamePage.jsx
import { useSocket } from '../hooks/useSocket';

const socket = useSocket();

// Passar socket para NPCMarkers
<NPCMarkers countryId={selectedCountry} npcs={npcs} socket={socket} />
```

---

## 🧪 Testes

### Testar Modo Deus:
1. Abrir painel do Modo Deus
2. Definir saldo de 1.000.000 VAL
3. Verificar se saldo foi atualizado
4. Construir edifício e verificar se saldo diminuiu

### Testar Construção:
1. Clicar no mapa em qualquer país
2. Escolher tipo de edifício
3. Verificar se validação geográfica identificou o país
4. Confirmar construção
5. Verificar se 10 NPCs construtores foram criados

### Testar NPCs:
1. Construir um edifício
2. Verificar se 10 NPCs aparecem (retângulos coloridos)
3. Observar movimento suave entre locais
4. Verificar se cores são diversificadas
5. Abrir popup de NPC e verificar informações

---

## ⚠️ Considerações de Produção

### Segurança:
- Remover `adminOrTestMode` em produção
- Usar `requireRole('admin')` para rotas administrativas
- Validar tokens JWT adequadamente
- Rate limiting nas rotas admin

### Performance:
- Limitar quantidade de NPCs processados por vez
- Usar índices MongoDB adequados (já implementado)
- Cache de GeoJSON (já implementado)
- Batch updates via Socket.io (já implementado)

### Escalabilidade:
- Considerar processamento de NPCs em workers separados
- Usar Redis para cache de posições
- Considerar particionamento de NPCs por região

---

## 📝 Resumo das Melhorias

✅ **Sistema de Modo Deus**: Criado completo (backend + frontend)  
✅ **Validação Geográfica**: Implementada com Turf.js  
✅ **NPCs com Cores Diversificadas**: 12 tons de pele implementados  
✅ **Movimento Suave**: Socket.io integrado + transições CSS  
✅ **Tratamento de Erros**: Implementado em todas as funções  
✅ **Código Modular**: Separação clara de responsabilidades  
✅ **Documentação**: Este documento completo  

---

## 🚀 Próximos Passos

1. Integrar `GodModePanel` no `GamePage.jsx`
2. Testar fluxo completo de construção
3. Verificar movimento suave dos NPCs
4. Ajustar frequência de atualização se necessário
5. Adicionar mais tipos de NPCs (turista, estudante, etc.)

---

**Desenvolvido por:** Assistente AI - Especialista em Geoprocessamento (GIS) e Jogos Web  
**Data:** 2024  
**Versão:** 1.0.0

