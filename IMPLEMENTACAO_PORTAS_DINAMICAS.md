# 🔌 Implementação de Portas Dinâmicas

**Data**: 12/01/2026  
**Status**: ✅ **IMPLEMENTADO**

---

## 🎯 Problema Resolvido

### Antes
- ❌ Portas 3001 e 5173 travadas em memória
- ❌ Servidor dava crash com `EADDRINUSE`
- ❌ Frontend conectava sempre na porta fixa 3001
- ❌ Necessário matar processos manualmente

### Depois
- ✅ Detecção automática de porta disponível
- ✅ Backend tenta 3001-3010 automaticamente
- ✅ Frontend detecta porta do backend dinamicamente
- ✅ Script de limpeza automático antes de iniciar
- ✅ Socket.io sincronizado com API

---

## 📦 Arquivos Criados/Modificados

### 1. **Backend - Detecção de Porta**

#### `backend/utils/portDetector.js` ✅ NOVO
```javascript
import detect from 'detect-port';

export async function detectAvailablePort(preferredPort, maxTries = 10) {
  // Tenta porta preferida (3001)
  // Se ocupada, tenta 3002, 3003... até 3010
  // Retorna primeira porta disponível
}
```

**Funcionalidades**:
- Usa biblioteca `detect-port`
- Tenta até 10 portas sequenciais
- Salva config em `frontend/public/backend-config.json`
- Logs informativos

#### `backend/server.js` ✅ MODIFICADO
```javascript
// Antes
const PORT = 3001;
httpServer.listen(PORT);

// Depois
const PORT = await detectAvailablePort(3001, 10);
httpServer.listen(PORT);
// Salva config para frontend
```

**Logs melhorados**:
```
═══════════════════════════════════════════════
🚀 Servidor VALORIS iniciado com sucesso!
═══════════════════════════════════════════════
📡 Porta: 3002 (porta 3001 estava ocupada)
🔗 API: http://localhost:3002/api
⚡ Socket.io: http://localhost:3002
💾 Config: frontend/public/backend-config.json
═══════════════════════════════════════════════
```

### 2. **Frontend - Configuração Dinâmica**

#### `frontend/src/config/api.js` ✅ REESCRITO
```javascript
// Antes: URLs fixas
export const API_BASE_URL = 'http://localhost:3001/api';
export const SOCKET_URL = 'http://localhost:3001';

// Depois: URLs dinâmicas
async function loadBackendConfig() {
  const response = await fetch('/backend-config.json');
  return response.json(); // { port, apiUrl, socketUrl }
}

export async function getApiUrl() { ... }
export async function getSocketUrl() { ... }
```

**Processo**:
1. Frontend tenta carregar `/backend-config.json`
2. Se encontrar, usa porta do backend
3. Se não encontrar, fallback para 3001

#### `frontend/src/services/socket.js` ✅ REESCRITO
```javascript
// Antes: URL fixa
const socket = io('http://localhost:3001');

// Depois: URL dinâmica
async function initializeSocket() {
  const socketUrl = await getSocketUrl();
  return io(socketUrl);
}
```

**Vantagens**:
- Socket sincronizado com API
- Reconnect automático na porta correta
- Fallback se config não carregar

### 3. **Script de Limpeza**

#### `scripts/cleanup-ports.js` ✅ NOVO
```javascript
// Limpa portas ocupadas:
// Backend: 3001-3010
// Frontend: 5173-5180

// Windows: netstat + taskkill
// Linux/Mac: lsof + kill
```

**Uso**:
```bash
npm run clean
```

**Saída**:
```
🧹 Limpando portas ocupadas...

📍 Backend (3001-3010):
  ✅ Porta 3001 liberada (PID: 12345)
  ✅ Porta 3002 liberada (PID: 12346)
  
📍 Frontend (5173-5180):
  ℹ️  Nenhuma porta ocupada

✅ Limpeza concluída!
```

### 4. **Package.json** ✅ MODIFICADO

```json
{
  "scripts": {
    "clean": "node scripts/cleanup-ports.js",
    "predev": "npm run clean && node scripts/setup-dev.js",
    "dev": "concurrently ...",
    "start": "npm run clean && cd backend && node server.js",
    "kill-ports": "npm run clean"
  }
}
```

**Comportamento**:
- `npm run dev` → Limpa portas → Inicia servidores
- `npm run clean` → Apenas limpa portas
- `npm start` → Limpa portas → Inicia apenas backend

---

## 🔄 Fluxo de Sincronização

### Inicialização

```
1. npm run dev
   ↓
2. npm run clean (automático)
   ↓ Limpa portas 3001-3010 e 5173-5180
   ↓
3. Backend inicia
   ↓ Detecta porta disponível (ex: 3002)
   ↓ Salva frontend/public/backend-config.json
   ↓
4. Frontend inicia (porta 5173)
   ↓ Carrega backend-config.json
   ↓ Configura API: http://localhost:3002/api
   ↓ Configura Socket: http://localhost:3002
   ↓
5. Socket.io conecta na porta dinâmica
   ↓
6. ✅ Sistema sincronizado!
```

### Arquivo `backend-config.json`

```json
{
  "port": 3002,
  "apiUrl": "http://localhost:3002/api",
  "socketUrl": "http://localhost:3002",
  "timestamp": "2026-01-12T19:30:00.000Z"
}
```

**Localização**: `frontend/public/backend-config.json`  
**Acesso**: `http://localhost:5173/backend-config.json`  
**Gerado**: Automaticamente pelo backend ao iniciar

---

## 🧪 Testes

### Teste 1: Porta Ocupada
```bash
# Terminal 1
cd backend && node server.js
# Backend inicia na porta 3001

# Terminal 2
cd backend && node server.js
# Backend detecta 3001 ocupada, usa 3002

# Resultado esperado:
✅ Servidor na porta 3002
✅ backend-config.json atualizado
✅ Frontend conecta em 3002
```

### Teste 2: Limpeza de Portas
```bash
npm run clean

# Resultado esperado:
✅ Portas 3001-3010 limpas
✅ Portas 5173-5180 limpas
✅ Nenhum erro
```

### Teste 3: Frontend sem Backend
```bash
# Apenas frontend
cd frontend && npm run dev

# Resultado esperado:
⚠️  backend-config.json não encontrado
✅ Fallback para porta 3001
⚠️  Socket.io tenta conectar em 3001
⚠️  Status: Desconectado (normal)
```

### Teste 4: Sincronização Completa
```bash
npm run dev

# Resultado esperado:
✅ Portas limpas
✅ Backend na porta disponível (ex: 3001)
✅ Config gerado
✅ Frontend carrega config
✅ API funcionando
✅ Socket.io conectado
```

---

## 📊 Comandos Disponíveis

| Comando | Função |
|---------|--------|
| `npm run clean` | Limpa portas 3001-3010 e 5173-5180 |
| `npm run kill-ports` | Alias para `clean` |
| `npm run dev` | Limpa portas + Inicia backend e frontend |
| `npm start` | Limpa portas + Inicia apenas backend |
| `npm run dev:backend` | Apenas backend (sem limpeza) |
| `npm run dev:frontend` | Apenas frontend (sem limpeza) |

---

## 🔍 Debugging

### Ver qual porta o backend está usando
```bash
# Backend logs ao iniciar:
📡 Porta: 3002 (porta 3001 estava ocupada)
```

### Ver configuração carregada pelo frontend
```javascript
// Console do navegador (F12):
✅ Configuração dinâmica do backend carregada: {port: 3002, ...}
🔗 API configurada: http://localhost:3002/api
⚡ Socket configurado: http://localhost:3002
```

### Verificar processos nas portas
```powershell
# Windows
netstat -ano | findstr ":3001 :3002 :5173"

# Linux/Mac
lsof -i :3001,3002,5173
```

### Matar processo específico
```powershell
# Windows
taskkill /F /PID <PID>

# Linux/Mac
kill -9 <PID>
```

---

## ✅ Vantagens da Implementação

1. **Zero Configuração Manual**
   - Não precisa matar processos manualmente
   - Não precisa editar arquivos de config

2. **Resiliente**
   - Backend sempre encontra porta disponível
   - Frontend sempre encontra backend
   - Fallbacks para config padrão

3. **Developer-Friendly**
   - Logs claros e informativos
   - Comando único: `npm run dev`
   - Debugging facilitado

4. **Escalável**
   - Suporta múltiplas instâncias (3001-3010)
   - Frontend adaptável
   - Socket.io sincronizado

---

## 🚀 Status Final

**Sistema**: ✅ **PRONTO PARA USO**

**Próximo passo**: 
```bash
npm run dev
```

Abrir navegador em `http://localhost:5173` e verificar:
- ✅ Mapa carrega
- ✅ Console mostra porta detectada
- ✅ Socket.io conectado
- ✅ Status "Conectado"

---

**Última atualização**: 12/01/2026 19:30 BRT

