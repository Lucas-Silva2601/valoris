# 🔄 Guia Rápido: Sincronização Frontend ↔ Backend

## ✅ Status Atual

### Backend (Porta 3001) - ✅ RODANDO
```
🚀 Servidor: http://localhost:3001
📡 Socket.io: Ativo
✅ Supabase: Conectado
```

### Frontend (Porta 5173) - Pronto para iniciar
```
📦 Dependências: Instaladas
🔧 Configuração: Sincronizada
```

## 🚀 Como Usar

### 1. Verificar Backend
O backend já está rodando. Para confirmar:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing
```

### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```

Aguarde a mensagem: `➜ Local: http://localhost:5173/`

### 3. Abrir no Navegador
```
http://localhost:5173
```

## 🔍 Verificações Automáticas

### No Console do Navegador (F12)
Você deve ver:
```
✅ Socket.io CONECTADO: <socket-id>
```

Se aparecer erro:
```
⚠️  Erro de conexão Socket.io
```
→ Verifique se o backend está rodando na porta 3001

## 📊 Endpoints Configurados

### API REST (via Proxy Vite)
```
Frontend solicita: http://localhost:5173/api/health
Vite redireciona: http://localhost:3001/api/health
```

### Socket.io (via Proxy Vite WebSocket)
```
Frontend conecta: ws://localhost:5173/socket.io
Vite redireciona: ws://localhost:3001/socket.io
```

## ⚙️ Configurações Aplicadas

### Backend (`backend/.env`)
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend (Múltiplos arquivos)

**`frontend/vite.config.js`**
```js
proxy: {
  '/api': { target: 'http://localhost:3001' },
  '/socket.io': { target: 'http://localhost:3001', ws: true }
}
```

**`frontend/src/config/api.js`**
```js
API_BASE_URL = 'http://localhost:3001/api'
SOCKET_URL = 'http://localhost:3001'
```

**`frontend/src/services/socket.js`**
```js
io('http://localhost:3001', { ... })
```

## 🛠️ Solução Rápida de Problemas

### Problema: "net::ERR_CONNECTION_REFUSED"
```powershell
# Verificar se backend está rodando
netstat -ano | findstr ":3001"

# Se não estiver, iniciar:
cd backend
npm run dev
```

### Problema: Socket.io não conecta
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Recarregar página (Ctrl+F5)
3. Verificar console para erros CORS

### Problema: API 404
```powershell
# Testar diretamente:
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing
```

## 📝 Checklist Rápido

- [x] Backend rodando na porta 3001
- [x] `backend/.env` configurado (PORT=3001)
- [x] Frontend com dependências instaladas
- [x] `frontend/vite.config.js` com proxy configurado
- [x] `frontend/src/config/api.js` apontando para porta 3001
- [x] Socket.io configurado para porta 3001
- [ ] Frontend iniciado (`npm run dev`)
- [ ] Navegador aberto em `http://localhost:5173`
- [ ] Console do navegador mostrando "Socket.io CONECTADO"

## 🎯 Resultado Esperado

Quando tudo estiver funcionando:

1. **Mapa carrega** com países visíveis
2. **Console mostra**:
   - `✅ Socket.io CONECTADO`
   - `✅ Health Check: 200`
3. **NPCs aparecem** no mapa (se houver)
4. **Painel lateral** funciona ao clicar em países

## 🆘 Em Caso de Dúvida

Leia o arquivo completo: `SYNC_CONFIG.md`

