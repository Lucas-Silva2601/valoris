# 🚀 GUIA DE OTIMIZAÇÃO DO AMBIENTE DE DESENVOLVIMENTO - VALORIS

Este guia fornece todas as configurações necessárias para rodar o projeto com um único comando e ter dados de teste automaticamente.

---

## 📋 ESTRUTURA DE ARQUIVOS

```
Valoris/
├── package.json                    ✅ JÁ EXISTE - Configurado com concurrently
├── backend/
│   ├── server.js                   ✅ MELHORADO - CORS e Socket.io definitivos
│   ├── config/
│   │   └── database.js             ✅ MELHORADO - Seed automático após conexão
│   └── utils/
│       └── seedDatabase.js         ✅ NOVO - Função de seeding automático
└── frontend/
    ├── src/
    │   ├── utils/
    │   │   └── mapClickUtils.js    ✅ NOVO - Identificar país do clique
    │   ├── pages/
    │   │   └── GamePage.jsx        ✅ MELHORADO - Captura país do GeoJSON
    │   └── components/
    │       └── WorldMap.jsx        ✅ MELHORADO - Handler de clique corrigido
```

---

## 1. ✅ COMANDO ÚNICO DE INICIALIZAÇÃO

### **Arquivo: `package.json` (RAIZ DO PROJETO)**

O arquivo já existe e está configurado! Verifique se está assim:

```json
{
  "name": "valoris",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -n \"BACKEND,FRONTEND\" -c \"cyan,magenta\" \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && nodemon server.js",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install --legacy-peer-deps"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "nodemon": "^3.0.2"
  }
}
```

### **Como Usar:**

```bash
# 1. Instalar dependências (primeira vez)
npm run install:all

# 2. Iniciar tudo com um comando
npm run dev
```

Isso iniciará:
- **BACKEND** na porta 5000 (com nodemon para auto-reload)
- **FRONTEND** na porta 5173 (Vite dev server)

---

## 2. ✅ AUTOMAÇÃO DE DADOS DE TESTE (AUTO-SEED)

### **Arquivo: `backend/utils/seedDatabase.js`** ✅ CRIADO

Esta função é executada automaticamente após a conexão com MongoDB.

**O que faz:**
1. **Saldo**: Garante que o usuário `test-user-id` tenha sempre 100.000 VAL
2. **NPCs**: Cria 50 NPCs automaticamente se a coleção estiver vazia
   - Distribuídos em 10 países diferentes
   - Com cores de pele variadas (12 tons diferentes)
   - Coordenadas aleatórias dentro de cada país

### **Integração: `backend/config/database.js`**

A função `seedDatabase` é chamada automaticamente após conexão bem-sucedida:

```javascript
connectDB().then(() => {
  // Seed automático executado aqui
});
```

**Resultado:**
- ✅ Ao iniciar o backend, saldo é garantido automaticamente
- ✅ 50 NPCs são criados se não existirem
- ✅ Não precisa fazer nada manualmente!

---

## 3. ✅ CONFIGURAÇÃO DEFINITIVA CORS E SOCKET.IO

### **Backend: `backend/server.js`**

#### **CORS Configurado:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'username', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
```

#### **Socket.io Configurado:**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'username']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});
```

### **Frontend: `frontend/src/services/socket.js`**

Já está configurado corretamente com:
- Auto-connect desabilitado (conecta manualmente)
- Reconexão automática
- Headers de autenticação
- Eventos de debug

**Resultado:**
- ✅ CORS permite requisições do frontend
- ✅ Socket.io conecta automaticamente
- ✅ Status muda de "Desconectado" para "Conectado"

---

## 4. ✅ CORREÇÃO DO ERRO 'UNK' NA CONSTRUÇÃO

### **Problema:**
Ao clicar no mapa, o país aparece como 'UNK' porque não estava sendo identificado do GeoJSON.

### **Solução:**

#### **Arquivo: `frontend/src/utils/mapClickUtils.js`** ✅ CRIADO

Função que identifica o país a partir das coordenadas do clique:

```javascript
identifyCountryFromMapClick(latlng, countriesData)
```

**Como funciona:**
1. Recebe coordenadas do clique (`lat`, `lng`)
2. Recebe GeoJSON com dados dos países
3. Usa Turf.js para verificar qual país contém o ponto
4. Retorna `countryId` (ISO_A3) e `countryName`

#### **Integração: `frontend/src/pages/GamePage.jsx`**

No handler `onMapClick`:

```javascript
// ✅ Identificar país a partir do clique
const countryInfo = identifyCountryFromMapClick(e.latlng, countriesData);

if (countryInfo.valid && countryInfo.countryId !== 'UNK') {
  setSelectedCountry(countryInfo.countryId);
  setSelectedCountryData({
    id: countryInfo.countryId,
    name: countryInfo.countryName,
    properties: countryInfo.feature?.properties || {},
    geometry: countryInfo.feature?.geometry || null
  });
}
```

**Resultado:**
- ✅ País é identificado corretamente do GeoJSON
- ✅ `countryId` é enviado para o modal
- ✅ Backend recebe o ID correto (não mais UNK)

---

## 📝 PASSO A PASSO DE IMPLEMENTAÇÃO

### **Passo 1: Verificar package.json na raiz**

O arquivo já existe! Apenas verifique se tem `concurrently`:

```bash
npm install concurrently nodemon --save-dev
```

### **Passo 2: Instalar dependências**

```bash
npm run install:all
```

### **Passo 3: Verificar arquivos criados**

✅ `backend/utils/seedDatabase.js` - Criado
✅ `frontend/src/utils/mapClickUtils.js` - Criado
✅ `backend/config/database.js` - Modificado (seed automático)
✅ `backend/server.js` - Modificado (CORS e Socket.io)
✅ `frontend/src/pages/GamePage.jsx` - Modificado (captura país)

### **Passo 4: Iniciar projeto**

```bash
npm run dev
```

**O que acontece:**
1. Backend inicia na porta 5000
2. Conecta ao MongoDB
3. **Executa seed automático:**
   - Cria/atualiza saldo de 100.000 VAL
   - Cria 50 NPCs se não existirem
4. Frontend inicia na porta 5173
5. Socket.io conecta automaticamente

### **Passo 5: Verificar no navegador**

1. Abrir `http://localhost:5173`
2. Console deve mostrar: `✅ Socket.io CONECTADO`
3. Carteira deve mostrar: `100.000 VAL`
4. NPCs devem aparecer no mapa (50 retângulos coloridos)
5. Clicar no mapa deve identificar país corretamente

---

## 🧪 TESTES RÁPIDOS

### **Teste 1: Saldo Automático**
- ✅ Abrir aplicação
- ✅ Verificar carteira: deve ter 100.000 VAL
- ✅ Não precisa clicar no botão 💰

### **Teste 2: NPCs Automáticos**
- ✅ Abrir aplicação
- ✅ Verificar mapa: deve ter 50 NPCs (retângulos coloridos)
- ✅ NPCs devem estar distribuídos em diferentes países

### **Teste 3: Identificação de País**
- ✅ Clicar em qualquer lugar do mapa
- ✅ Abrir modal de construção
- ✅ Verificar se país aparece corretamente (não UNK)
- ✅ Exemplo: Clicar no Brasil → deve mostrar "Brasil" ou "BRA"

### **Teste 4: Socket.io**
- ✅ Abrir console do navegador
- ✅ Deve aparecer: `✅ Socket.io CONECTADO: [socket-id]`
- ✅ Status deve ser "Conectado" (não "Desconectado")

---

## 🔧 TROUBLESHOOTING

### **Problema: MongoDB não conecta**
```bash
# Verificar se MongoDB está rodando
mongosh

# Ou iniciar MongoDB
mongod

# Ou usar Docker
docker run -d -p 27017:27017 mongo:7
```

### **Problema: Porta já em uso**
```bash
# Backend (porta 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (porta 5173)
lsof -ti:5173 | xargs kill -9
```

### **Problema: NPCs não aparecem**
- Verificar se seed foi executado (logs do backend)
- Verificar se `loadAllNPCs()` está sendo chamado
- Verificar console do navegador para erros

### **Problema: País ainda aparece como UNK**
- Verificar se `countriesData` está carregado
- Verificar se GeoJSON tem propriedade `ISO_A3`
- Verificar console para logs de identificação

---

## 📊 RESUMO DAS MELHORIAS

✅ **1 comando para tudo**: `npm run dev`
✅ **Saldo automático**: 100.000 VAL garantidos
✅ **NPCs automáticos**: 50 NPCs criados automaticamente
✅ **CORS definitivo**: Configurado corretamente
✅ **Socket.io estável**: Conecta automaticamente
✅ **País identificado**: Não mais UNK

---

## 🎯 CHECKLIST FINAL

- [ ] `package.json` na raiz com `concurrently`
- [ ] `backend/utils/seedDatabase.js` criado
- [ ] `backend/config/database.js` chama seed automático
- [ ] `backend/server.js` com CORS e Socket.io configurados
- [ ] `frontend/src/utils/mapClickUtils.js` criado
- [ ] `frontend/src/pages/GamePage.jsx` usa `identifyCountryFromMapClick`
- [ ] MongoDB rodando
- [ ] `npm run dev` funciona
- [ ] Saldo aparece automaticamente
- [ ] NPCs aparecem no mapa
- [ ] País é identificado corretamente

---

**Desenvolvido por:** Assistente AI - Full Stack Sênior  
**Data:** 2024  
**Versão:** 1.0.0

