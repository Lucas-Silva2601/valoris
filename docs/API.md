# 📡 Documentação da API - Valoris

## Base URL

```
http://localhost:5000/api (desenvolvimento)
https://api.valoris.example.com/api (produção)
```

## Autenticação

A maioria das rotas requer autenticação via JWT token.

**Header:**
```
Authorization: Bearer <token>
```

## Endpoints

### Autenticação

#### POST /api/auth/register
Registrar novo usuário

**Body:**
```json
{
  "username": "jogador1",
  "email": "jogador@example.com",
  "password": "senha123",
  "role": "investor"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "jogador1",
    "email": "jogador@example.com",
    "role": "investor"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
Fazer login

**Body:**
```json
{
  "email": "jogador@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token_here"
}
```

### Carteira

#### GET /api/wallet/balance
Obter saldo da carteira

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "balance": 10000,
  "currency": "VAL"
}
```

#### GET /api/wallet/transactions
Obter histórico de transações

**Query Params:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Response:**
```json
{
  "transactions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### Propriedade de Países

#### POST /api/ownership/buy
Comprar ações de um país

**Body:**
```json
{
  "countryId": "BRA",
  "countryName": "Brasil",
  "shares": 10
}
```

**Response:**
```json
{
  "success": true,
  "ownership": { ... },
  "newBalance": 9500
}
```

#### GET /api/ownership/:countryId
Obter informações de propriedade de um país

**Response:**
```json
{
  "countryId": "BRA",
  "totalShares": 100,
  "availableShares": 30,
  "currentSharePrice": 1500,
  "shareholders": [...]
}
```

### Unidades Militares

#### POST /api/military/units
Criar unidade militar

**Body:**
```json
{
  "countryId": "BRA",
  "type": "tank",
  "position": {
    "lat": -23.5505,
    "lng": -46.6333
  }
}
```

**Response:**
```json
{
  "success": true,
  "unit": { ... }
}
```

#### GET /api/military/units
Listar unidades do jogador

**Response:**
```json
{
  "units": [...]
}
```

#### POST /api/military/units/:unitId/move
Mover unidade

**Body:**
```json
{
  "targetLat": -22.9068,
  "targetLng": -43.1729
}
```

### Combate

#### GET /api/combat/history/:countryId
Obter histórico de combates de um país

**Response:**
```json
{
  "combats": [...]
}
```

### Analytics

#### GET /api/analytics/stats
Obter estatísticas gerais (requer autenticação)

**Response:**
```json
{
  "totalPlayers": 100,
  "activeLast24h": 50,
  "activeLast7d": 80,
  "totalTransactions": 500,
  "totalCombats": 25,
  "topCountries": [...]
}
```

#### GET /api/analytics/metrics/daily
Obter métricas do dia (requer admin)

**Query Params:**
- `date` (opcional): Data no formato ISO

### Monitoramento

#### GET /api/monitoring/health
Verificar saúde do sistema (requer admin)

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" },
    "cpu": { "status": "healthy" }
  }
}
```

#### GET /api/monitoring/system
Obter métricas do sistema (requer admin)

#### GET /api/monitoring/database
Obter métricas do banco de dados (requer admin)

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `500` - Erro interno do servidor
- `503` - Serviço indisponível

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "error": "Mensagem de erro descritiva"
}
```

## Rate Limiting

- **Geral**: 100 requests / 15 minutos
- **Autenticação**: 5 tentativas / 15 minutos

## WebSocket (Socket.io)

### Eventos

**Cliente → Servidor:**
- `join_country_room` - Entrar em sala de país
- `leave_country_room` - Sair de sala de país

**Servidor → Cliente:**
- `unit_position_update` - Atualização de posição
- `balance_update` - Atualização de saldo
- `dividend_received` - Notificação de dividendo
- `combat_update` - Atualização de combate
- `ownership_update` - Atualização de propriedade
- `economic_health_update` - Atualização econômica

## Exemplos

### Exemplo com cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'

# Obter saldo (com token)
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer <token>"

# Comprar ações
curl -X POST http://localhost:5000/api/ownership/buy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"countryId":"BRA","countryName":"Brasil","shares":10}'
```

### Exemplo com JavaScript

```javascript
const API_URL = 'http://localhost:5000/api';

// Login
const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'senha123'
  })
});

const { token } = await loginResponse.json();

// Obter saldo
const balanceResponse = await fetch(`${API_URL}/wallet/balance`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const balance = await balanceResponse.json();
```

