# 🔨 Guia de Build/Compilação - Valoris

## Visão Geral

O projeto Valoris é composto por duas partes:
- **Backend**: Node.js/Express (não precisa de build, roda diretamente)
- **Frontend**: React/Vite (precisa de build para produção)

## 📦 Build Completo

### Opção 1: Build Rápido (Raiz do Projeto)

```bash
# Na raiz do projeto
npm run build
```

Este comando compila apenas o frontend.

### Opção 2: Build Manual (Passo a Passo)

#### 1. Instalar Dependências

```bash
# Instalar todas as dependências
npm run install:all

# Ou individualmente:
cd backend && npm install
cd ../frontend && npm install
```

#### 2. Configurar Variáveis de Ambiente

**Backend:**
```bash
cd backend
cp .env.example .env
# Editar .env com suas configurações
```

**Frontend:**
```bash
cd frontend
cp env.example .env
# Editar .env com suas configurações
```

#### 3. Build do Frontend

```bash
cd frontend
npm run build
```

Isso criará a pasta `frontend/dist/` com os arquivos otimizados para produção.

#### 4. Backend (Não Precisa Build)

O backend Node.js não precisa de build, mas você pode:

```bash
cd backend
npm start  # Roda em produção
```

## 🎯 Build para Produção

### Frontend (React/Vite)

```bash
cd frontend

# Build de produção
npm run build
```

**O que acontece:**
- Transpilação do React/JSX para JavaScript
- Minificação do código
- Otimização de assets (imagens, CSS)
- Code splitting
- Tree shaking (remove código não usado)
- Gera arquivos em `frontend/dist/`

**Resultado:**
```
frontend/dist/
├── assets/
│   ├── js/
│   │   ├── index-[hash].js
│   │   └── vendor-[hash].js
│   └── css/
│       └── index-[hash].css
└── index.html
```

### Backend (Node.js)

O backend não precisa de build porque:
- Node.js executa JavaScript diretamente
- Não há transpilação necessária
- Apenas precisa das dependências instaladas

**Para produção:**
```bash
cd backend
npm ci --production  # Instala apenas dependências de produção
```

## 🐳 Build com Docker

### Backend

```bash
cd backend
docker build -t valoris-backend .
```

### Frontend

```bash
cd frontend
docker build -t valoris-frontend --build-arg VITE_API_URL=https://api.example.com/api .
```

### Docker Compose (Tudo Junto)

```bash
cd backend/config
docker-compose build
docker-compose up -d
```

## 📋 Checklist de Build

### Antes do Build

- [ ] Todas as dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB rodando (para backend)
- [ ] Testes passando (opcional mas recomendado)

### Durante o Build

- [ ] Frontend compila sem erros
- [ ] Pasta `dist/` criada com sucesso
- [ ] Sem warnings críticos

### Após o Build

- [ ] Verificar arquivos em `frontend/dist/`
- [ ] Testar build localmente (`npm run preview` no frontend)
- [ ] Backend inicia corretamente

## 🧪 Testar o Build

### Frontend

```bash
cd frontend
npm run preview  # Serve o build localmente
```

Acesse `http://localhost:4173` para ver o build.

### Backend

```bash
cd backend
npm start  # Inicia servidor de produção
```

## 🚀 Deploy do Build

### Frontend

Após o build, a pasta `frontend/dist/` contém tudo que você precisa:

**Opção 1: Servidor Web (Nginx/Apache)**
```bash
# Copiar dist/ para servidor
scp -r frontend/dist/* user@server:/var/www/html/
```

**Opção 2: CDN (Vercel/Netlify)**
```bash
# Vercel
npm install -g vercel
cd frontend
vercel --prod

# Netlify
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=dist
```

### Backend

```bash
# Usando PM2
cd backend
pm2 start ecosystem.config.js --env production

# Ou usando Docker
docker run -d -p 5000:5000 valoris-backend
```

## 🔍 Verificar Build

### Tamanho dos Arquivos

```bash
# Ver tamanho do build
cd frontend/dist
du -sh *
```

### Análise do Bundle

```bash
cd frontend
npm run build -- --analyze  # Se configurado
```

## ⚙️ Configurações de Build

### Frontend (vite.config.js)

O build está configurado para:
- Minificação com Terser
- Remoção de console.log em produção
- Code splitting automático
- Otimização de assets

### Backend

Não há configuração de build, mas você pode:
- Usar `NODE_ENV=production` para otimizações
- Usar PM2 para gerenciamento de processos
- Usar Docker para isolamento

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Build failed"

```bash
# Verificar logs detalhados
npm run build -- --verbose

# Limpar cache
rm -rf frontend/dist
npm run build
```

### Build muito lento

- Verifique se está usando Node.js 20+
- Limpe cache: `rm -rf node_modules/.cache`
- Use `npm ci` em vez de `npm install`

## 📊 Otimizações de Build

### Frontend

- ✅ Code splitting configurado
- ✅ Minificação ativa
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Source maps desabilitados em produção

### Backend

- ✅ Apenas dependências de produção (`npm ci --production`)
- ✅ Variáveis de ambiente otimizadas
- ✅ Logs estruturados

## 🎯 Comandos Rápidos

```bash
# Build completo
npm run build

# Build e testar
npm run build && cd frontend && npm run preview

# Build para produção
cd frontend && npm run build && cd ../backend && npm ci --production
```

## 📝 Notas Importantes

1. **Backend não precisa build**: Node.js executa JavaScript diretamente
2. **Frontend precisa build**: React precisa ser transpilado para JavaScript
3. **Variáveis de ambiente**: Configure antes do build
4. **MongoDB**: Deve estar rodando para o backend funcionar
5. **Build de produção**: Sempre use `NODE_ENV=production`

---

**Pronto para produção!** 🚀

