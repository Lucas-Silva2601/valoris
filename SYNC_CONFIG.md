# 🔄 Guia de Sincronização Frontend ↔ Backend

## 📋 Configurações Atuais

### Backend (Porta 3001)
- **Arquivo**: `backend/.env`
- **PORT**: `3001`
- **FRONTEND_URL**: `http://localhost:5173`

### Frontend (Porta 5173)
- **Arquivo**: `frontend/.env.development`
- **VITE_API_URL**: `http://localhost:3001/api`
- **VITE_SOCKET_URL**: `http://localhost:3001`

### Proxy Vite
- **Arquivo**: `frontend/vite.config.js`
- **Proxy `/api`**: → `http://localhost:3001`
- **Proxy `/socket.io`**: → `http://localhost:3001` (com WebSocket)

## 🚀 Como Iniciar os Servidores

### Opção 1: Scripts Automáticos (Windows)
```bash
# Iniciar ambos os servidores
.\scripts\start-dev.bat

# Parar ambos os servidores
.\scripts\stop-dev.bat
```

### Opção 2: Manual

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Aguarde a mensagem: `🚀 Servidor rodando na porta 3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Aguarde a mensagem: `➜  Local: http://localhost:5173/`

## ✅ Checklist de Verificação

### Backend
- [ ] Porta 3001 livre
- [ ] Arquivo `backend/.env` configurado
- [ ] Supabase conectado
- [ ] Socket.io ativo
- [ ] CORS configurado para `http://localhost:5173`

### Frontend
- [ ] Porta 5173 livre
- [ ] Arquivo `frontend/.env.development` criado
- [ ] `VITE_API_URL=http://localhost:3001/api`
- [ ] `VITE_SOCKET_URL=http://localhost:3001`
- [ ] Proxy Vite configurado

### Testes de Conectividade
```powershell
# Testar Backend API
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing

# Testar Backend Socket.io
# Abrir http://localhost:5173 e verificar console do navegador
# Deve aparecer: "✅ Socket.io CONECTADO: <socket-id>"
```

## 🔧 Solução de Problemas

### Problema: Backend não inicia
```powershell
# Verificar se a porta está em uso
netstat -ano | findstr ":3001"

# Matar processo na porta 3001
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":3001"') do taskkill /F /PID %a
```

### Problema: Frontend não conecta ao backend
1. Verificar se backend está rodando: `http://localhost:3001/api/health`
2. Verificar console do navegador para erros CORS
3. Limpar cache do Vite: `cd frontend && npm run dev -- --force`
4. Verificar `frontend/.env.development` existe e está correto

### Problema: Socket.io não conecta
1. Verificar console do navegador
2. Verificar CORS do Socket.io no backend (`server.js` linha 53-62)
3. Verificar proxy WebSocket no `vite.config.js` (linha 15-20)
4. Tentar polling ao invés de websocket (temporário para debug)

## 📊 Endpoints para Testar

### API REST
- Health: `http://localhost:3001/api/health`
- Countries: `http://localhost:3001/api/countries/geojson`
- Wallet: `http://localhost:3001/api/wallet/balance` (Header: `user-id: test-user-id`)
- Debug: `http://localhost:3001/api/admin/debug` (Header: `user-id: test-user-id`)

### Socket.io
- Conectar: Frontend automaticamente tenta conectar ao iniciar
- Eventos enviados pelo servidor:
  - `balance:update`
  - `npc:update`
  - `economic_health:update`
  - `building:update`

## 🎯 Arquivos Importantes

### Backend
- `backend/server.js` - Configuração principal
- `backend/.env` - Variáveis de ambiente
- `backend/socket/socketHandler.js` - Socket.io handlers

### Frontend
- `frontend/vite.config.js` - Proxy e porta
- `frontend/.env.development` - URLs do backend
- `frontend/src/config/api.js` - Configuração API centralizada
- `frontend/src/services/socket.js` - Cliente Socket.io

## 📝 Notas
- O backend SEMPRE roda na porta **3001**
- O frontend SEMPRE roda na porta **5173**
- O Vite faz proxy de `/api` e `/socket.io` para o backend
- Socket.io usa WebSocket (upgrade de polling)
- CORS está configurado para aceitar requests de `http://localhost:5173`

