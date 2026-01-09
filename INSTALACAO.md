# 📦 Guia de Instalação - Valoris

## Pré-requisitos

- Node.js 18+ instalado
- MongoDB instalado e rodando (ou MongoDB Atlas configurado)
- npm ou yarn

## Passo a Passo

### 1. Instalar Dependências

Execute o comando na raiz do projeto para instalar todas as dependências:

```bash
npm run install:all
```

Ou instale manualmente:

```bash
# Instalar dependências da raiz
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

#### Backend

Copie o arquivo de exemplo e configure:

```bash
cp env.example .env
```

Edite o arquivo `.env` no diretório raiz com suas configurações:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_URI=mongodb://localhost:27017/valoris
JWT_SECRET=seu-secret-key-aqui
```

#### Frontend

Copie o arquivo de exemplo:

```bash
cd frontend
cp env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Iniciar o MongoDB

Certifique-se de que o MongoDB está rodando:

```bash
# Se MongoDB estiver instalado localmente
mongod

# Ou use MongoDB Atlas (cloud)
# Configure a string de conexão no .env
```

### 4. Iniciar o Projeto

#### Modo Desenvolvimento (Backend + Frontend)

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará:
- Backend em `http://localhost:5000`
- Frontend em `http://localhost:5173`

#### Ou inicie separadamente:

**Backend apenas:**
```bash
npm run dev:backend
# ou
cd backend
npm run dev
```

**Frontend apenas:**
```bash
npm run dev:frontend
# ou
cd frontend
npm run dev
```

### 5. Verificar Instalação

- Acesse `http://localhost:5000/api/health` - deve retornar status OK
- Acesse `http://localhost:5173` - deve mostrar a página inicial do Valoris

## Estrutura de Pastas Criada

```
Valoris/
├── backend/
│   ├── config/          # Configurações (database, etc)
│   ├── controllers/      # Controladores da API
│   ├── middleware/       # Middlewares customizados
│   ├── models/          # Modelos do MongoDB
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── server.js        # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # Serviços (Socket, API)
│   │   └── utils/       # Utilitários
│   └── package.json
└── package.json         # Scripts principais
```

## Próximos Passos

Após a instalação, consulte o `CHECKLIST_PROJETO_VALORIS.md` para continuar com a Fase 2: Sistema de Mapa e Geografia.

## Troubleshooting

### Erro de conexão com MongoDB
- Verifique se o MongoDB está rodando
- Confirme a string de conexão no `.env`
- Teste a conexão: `mongosh "mongodb://localhost:27017/valoris"`

### Erro de porta em uso
- Altere a porta no arquivo `.env`
- Ou pare o processo que está usando a porta

### Dependências não instaladas
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente

