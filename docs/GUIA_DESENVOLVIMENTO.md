# 👨‍💻 Guia de Desenvolvimento - Valoris

## Pré-requisitos

- Node.js 20+
- MongoDB 7+
- Git
- Editor de código (VS Code recomendado)

## Configuração do Ambiente

### 1. Clonar Repositório

```bash
git clone <repository-url>
cd Valoris
```

### 2. Instalar Dependências

```bash
# Instalar dependências de ambos os projetos
npm run install:all

# Ou individualmente:
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configurar Variáveis de Ambiente

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

### 4. Iniciar MongoDB

```bash
# Localmente
mongod

# Ou usar Docker
docker run -d -p 27017:27017 mongo:7
```

### 5. Executar Aplicação

**Desenvolvimento:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Estrutura do Código

### Backend

#### Adicionar Nova Rota

1. Criar controller em `controllers/`
2. Criar service em `services/` (se necessário)
3. Criar rota em `routes/`
4. Registrar rota em `server.js`

**Exemplo:**
```javascript
// controllers/exampleController.js
export const getExample = async (req, res) => {
  // Lógica aqui
};

// routes/example.js
import express from 'express';
import * as exampleController from '../controllers/exampleController.js';
const router = express.Router();
router.get('/', exampleController.getExample);
export default router;

// server.js
import exampleRoutes from './routes/example.js';
app.use('/api/example', exampleRoutes);
```

#### Adicionar Novo Modelo

```javascript
// models/Example.js
import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
  field: String,
  // ...
}, { timestamps: true });

export default mongoose.model('Example', exampleSchema);
```

#### Adicionar Middleware

```javascript
// middleware/example.js
export const exampleMiddleware = (req, res, next) => {
  // Lógica do middleware
  next();
};
```

### Frontend

#### Adicionar Novo Componente

```javascript
// components/Example.jsx
export default function Example({ prop1, prop2 }) {
  return (
    <div>
      {/* JSX aqui */}
    </div>
  );
}
```

#### Adicionar Nova Página

```javascript
// pages/ExamplePage.jsx
import { useNavigate } from 'react-router-dom';

export default function ExamplePage() {
  return (
    <div>
      {/* Conteúdo da página */}
    </div>
  );
}

// App.jsx
import ExamplePage from './pages/ExamplePage';
<Route path="/example" element={<ExamplePage />} />
```

#### Adicionar Hook Customizado

```javascript
// hooks/useExample.js
import { useState, useEffect } from 'react';

export const useExample = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Lógica do hook
  }, []);
  
  return { data };
};
```

## Convenções de Código

### Nomenclatura

- **Arquivos**: camelCase (ex: `userService.js`)
- **Componentes React**: PascalCase (ex: `UserProfile.jsx`)
- **Variáveis/Funções**: camelCase (ex: `getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_URL`)
- **Classes**: PascalCase (ex: `UserService`)

### Estrutura de Arquivos

- Um componente por arquivo
- Exportar como default quando apropriado
- Usar named exports para utilitários

### Comentários

```javascript
/**
 * Descrição da função
 * @param {type} param - Descrição do parâmetro
 * @returns {type} Descrição do retorno
 */
export const exampleFunction = (param) => {
  // Implementação
};
```

## Testes

### Backend

```bash
cd backend
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Frontend

```bash
cd frontend
npm test              # Executar todos os testes
npm run test:ui       # Interface gráfica
npm run test:coverage # Com cobertura
```

## Debugging

### Backend

```javascript
// Usar logger
import { createLogger } from './utils/logger.js';
const logger = createLogger('ModuleName');
logger.info('Mensagem');
logger.error('Erro:', error);
```

### Frontend

```javascript
// Console.log (remover em produção)
console.log('Debug:', data);

// React DevTools
// Instalar extensão do navegador
```

## Git Workflow

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome` - Nova funcionalidade
- `fix/nome` - Correção de bug

### Commits

```
feat: adicionar sistema de missões
fix: corrigir cálculo de dividendos
docs: atualizar documentação da API
refactor: reorganizar estrutura de serviços
test: adicionar testes para combate
```

## Performance

### Backend

- Usar índices no MongoDB
- Implementar cache quando apropriado
- Otimizar queries (usar `lean()`, `select()`)
- Usar paginação para listas grandes

### Frontend

- Lazy loading de componentes
- Memoização com `useMemo` e `useCallback`
- Code splitting
- Otimizar re-renders

## Segurança

- Nunca commitar secrets no código
- Validar todos os inputs
- Sanitizar dados do usuário
- Usar HTTPS em produção
- Implementar rate limiting
- Validar permissões (RBAC)

## Deploy

Ver `DEPLOY.md` para instruções completas.

## Recursos Úteis

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Socket.io Docs](https://socket.io/docs/)
- [Leaflet Docs](https://leafletjs.com/)

## Suporte

Para dúvidas ou problemas:
1. Verificar documentação
2. Verificar issues no repositório
3. Criar nova issue se necessário

