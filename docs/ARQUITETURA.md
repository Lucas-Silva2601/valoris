# 🏗️ Arquitetura do Sistema - Valoris

## Visão Geral

Valoris é um simulador geopolítico em tempo real que combina elementos de estratégia econômica e militar. O sistema é construído com uma arquitetura cliente-servidor usando Node.js/Express no backend e React no frontend.

## Arquitetura de Alto Nível

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/REST
         │ WebSocket
         │
┌────────▼────────┐
│   Backend       │
│   (Express)     │
│   Port: 5000    │
└────────┬────────┘
         │
┌────────▼────────┐
│   MongoDB       │
│   Port: 27017   │
└─────────────────┘
```

## Stack Tecnológica

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Banco de Dados**: MongoDB com Mongoose
- **Tempo Real**: Socket.io
- **Autenticação**: JWT (jsonwebtoken)
- **Agendamento**: node-cron
- **Validação**: express-validator
- **Segurança**: helmet, express-mongo-sanitize, xss-clean

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Roteamento**: React Router DOM
- **Mapas**: Leaflet.js + React-Leaflet
- **Geometria**: Turf.js
- **Gráficos**: Chart.js
- **Estilização**: Tailwind CSS
- **Tempo Real**: Socket.io-client

## Estrutura de Diretórios

### Backend
```
backend/
├── config/          # Configurações (database, nginx, docker)
├── controllers/     # Controladores das rotas
├── jobs/           # Jobs agendados (cron)
├── middleware/     # Middlewares (auth, validation, security)
├── models/         # Modelos Mongoose
├── routes/         # Definição de rotas
├── services/        # Lógica de negócio
├── socket/         # Handlers do Socket.io
├── utils/          # Funções utilitárias
└── __tests__/      # Testes
```

### Frontend
```
frontend/
├── src/
│   ├── components/  # Componentes React
│   ├── hooks/      # Custom hooks
│   ├── pages/      # Páginas principais
│   ├── services/   # Serviços (API, Socket)
│   └── utils/      # Funções utilitárias
└── __tests__/      # Testes
```

## Fluxo de Dados

### Autenticação
1. Usuário faz login → `POST /api/auth/login`
2. Backend valida credenciais
3. Backend gera JWT token
4. Frontend armazena token no localStorage
5. Frontend inclui token em requisições subsequentes

### Investimento
1. Usuário seleciona país e quantidade de ações
2. Frontend envia `POST /api/ownership/buy`
3. Backend valida saldo e disponibilidade
4. Backend atualiza ownership e wallet
5. Backend emite evento Socket.io `ownership_update`
6. Frontend recebe atualização em tempo real

### Combate
1. Unidade militar cruza fronteira
2. Job agendado detecta invasão
3. Backend inicia combate
4. Backend processa rodadas de combate
5. Backend atualiza unidades e país
6. Backend emite evento Socket.io `combat_update`
7. Frontend atualiza visualização

## Comunicação em Tempo Real

### Socket.io Events

**Cliente → Servidor:**
- `join_country_room` - Entrar em sala de país
- `leave_country_room` - Sair de sala de país

**Servidor → Cliente:**
- `unit_position_update` - Atualização de posição de unidade
- `balance_update` - Atualização de saldo
- `dividend_received` - Notificação de dividendo
- `combat_update` - Atualização de combate
- `ownership_update` - Atualização de propriedade
- `economic_health_update` - Atualização de saúde econômica

## Jobs Agendados

1. **Dividend Job** - Diariamente às 00:00
   - Calcula dividendos para todos os países
   - Distribui para acionistas
   - Atualiza tesouro nacional

2. **Unit Movement Job** - A cada 1 minuto
   - Atualiza posições de unidades
   - Detecta invasões
   - Inicia combates

3. **Economic Health Job** - A cada 6 horas
   - Recalcula saúde econômica
   - Aplica eventos econômicos
   - Atualiza métricas

4. **Repair Job** - A cada 1 hora
   - Processa reparos automáticos
   - Atualiza infraestrutura

5. **Analytics Job** - Diariamente às 23:59
   - Calcula métricas do dia
   - Agrega dados de analytics

## Segurança

### Autenticação
- JWT tokens com expiração de 7 dias
- Tokens armazenados no localStorage (frontend)
- Middleware `authenticate` valida tokens em rotas protegidas

### Autorização
- Role-based access control (investor, operational, admin)
- Middleware `requireRole` valida permissões

### Rate Limiting
- Limite geral: 100 requests / 15 minutos
- Limite de autenticação: 5 tentativas / 15 minutos

### Sanitização
- Sanitização de inputs (express-mongo-sanitize)
- Proteção XSS (xss-clean)
- Validação de dados (express-validator)

## Escalabilidade

### Horizontal Scaling
- Backend pode rodar múltiplas instâncias (PM2 cluster mode)
- Socket.io com Redis adapter para múltiplos servidores
- MongoDB com replica set

### Otimizações
- Índices no MongoDB para queries frequentes
- Cache de queries (queryOptimizer)
- Lazy loading no frontend
- Code splitting no build

## Monitoramento

- Health checks: `GET /api/health`
- Métricas do sistema: `GET /api/monitoring/system`
- Métricas do banco: `GET /api/monitoring/database`
- Analytics: `GET /api/analytics/stats`

## Deploy

- **Backend**: Docker ou PM2
- **Frontend**: Nginx ou CDN (Vercel/Netlify)
- **Banco**: MongoDB Atlas ou servidor dedicado
- **CI/CD**: GitHub Actions

Para mais detalhes, consulte `DEPLOY.md`.

