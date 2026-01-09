# 📚 Documentação da API - Valoris

## Base URL
```
http://localhost:5000/api
```

## Autenticação

A maioria dos endpoints requer autenticação via JWT token no header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticação

### POST /auth/register
Registrar novo usuário

**Body:**
```json
{
  "username": "jogador123",
  "email": "jogador@email.com",
  "password": "senha123",
  "role": "investor" // ou "operational"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "jogador123",
    "email": "jogador@email.com",
    "role": "investor"
  },
  "token": "jwt_token_here"
}
```

### POST /auth/login
Fazer login

**Body:**
```json
{
  "email": "jogador@email.com",
  "password": "senha123"
}
```

### GET /auth/me
Obter dados do usuário atual (requer autenticação)

---

## 💰 Carteira

### GET /wallet/balance
Obter saldo da carteira (requer autenticação)

**Response:**
```json
{
  "balance": 10000
}
```

### GET /wallet/transactions
Obter histórico de transações (requer autenticação)

**Query Parameters:**
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 20, máximo: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 🏛️ Propriedade de Países

### POST /ownership/buy
Comprar ações de um país (requer autenticação)

**Body:**
```json
{
  "countryId": "BRA",
  "countryName": "Brasil",
  "shares": 5.5
}
```

### GET /ownership/:countryId/shareholders
Obter lista de acionistas de um país

### GET /ownership/:countryId/info
Obter informações de propriedade de um país

### GET /ownership/:countryId/voting-power
Obter poder de decisão do usuário (requer autenticação)

---

## 💸 Dividendos

### GET /dividends/country/:countryId
Obter histórico de dividendos de um país

**Query Parameters:**
- `limit` - Limite de resultados (padrão: 50)

### GET /dividends/user
Obter dividendos recebidos pelo usuário (requer autenticação)

---

## 🏦 Tesouro Nacional

### GET /treasury/:countryId
Obter informações do tesouro de um país

### POST /treasury/:countryId/infrastructure
Melhorar infraestrutura (requer saldo no tesouro)

**Body:**
```json
{
  "level": 1
}
```

### POST /treasury/:countryId/defense
Melhorar defesa (requer saldo no tesouro)

**Body:**
```json
{
  "level": 1
}
```

---

## 📊 Métricas Econômicas

### GET /economic/:countryId
Obter métricas econômicas de um país

### POST /economic/:countryId/event
Criar evento econômico aleatório

---

## ⚔️ Unidades Militares

### POST /military/units
Criar unidade militar (requer autenticação)

**Body:**
```json
{
  "countryId": "BRA",
  "countryName": "Brasil",
  "type": "tank", // "tank", "ship" ou "plane"
  "position": {
    "lat": -14.235,
    "lng": -51.925
  }
}
```

### GET /military/units
Obter unidades do usuário (requer autenticação)

### GET /military/units/country/:countryId
Obter unidades em um país

### POST /military/units/:unitId/move
Mover unidade (requer autenticação e propriedade)

**Body:**
```json
{
  "targetLat": -15.235,
  "targetLng": -52.925
}
```

### GET /military/units/stats
Obter estatísticas de tipos de unidades

---

## 🗺️ Países

### GET /countries/geojson
Obter dados GeoJSON de todos os países

### GET /countries/:countryId
Obter informações de um país específico

---

## ⚔️ Combate

### POST /combat/initiate
Iniciar combate (requer autenticação)

**Body:**
```json
{
  "unitIds": ["unit_id_1", "unit_id_2"],
  "targetCountryId": "ARG"
}
```

### POST /combat/:combatId/round
Processar rodada de combate

### GET /combat/history/:countryId
Obter histórico de combates de um país

---

## 🛡️ Defesa

### GET /defense/:countryId
Obter informações de defesa de um país

### POST /defense/:countryId/technology
Melhorar tecnologia (requer saldo no tesouro)

**Body:**
```json
{
  "level": 1
}
```

### GET /defense/:countryId/power
Obter poder de defesa de um país

---

## 👤 Perfil

### GET /profile
Obter perfil do jogador (requer autenticação)

### GET /profile/history
Obter histórico de ações (requer autenticação)

---

## 📋 Missões

### POST /missions
Criar missão (requer autenticação, apenas investidores)

**Body:**
```json
{
  "title": "Missão de Exploração",
  "description": "Explorar território inimigo",
  "type": "military",
  "targetCountry": "ARG",
  "reward": {
    "amount": 500
  },
  "progressTarget": 100
}
```

### POST /missions/:missionId/accept
Aceitar missão (requer autenticação)

### POST /missions/:missionId/progress
Atualizar progresso da missão (requer autenticação)

**Body:**
```json
{
  "progress": 50
}
```

### GET /missions/available
Listar missões disponíveis

### GET /missions/my
Listar missões do usuário (requer autenticação)

---

## ⚠️ Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Acesso negado
- `404` - Não encontrado
- `429` - Muitas requisições (rate limit)
- `500` - Erro interno do servidor

---

## 🔒 Rate Limiting

- **Geral**: 100 requisições por 15 minutos
- **Autenticação**: 5 tentativas por 15 minutos
- **Ações críticas**: 10 ações por minuto

---

## 📝 Notas

- Todos os valores monetários são em VAL (Valoris Coin)
- Coordenadas usam formato Lat/Lng
- IDs de países usam código ISO_A3 (3 letras)
- Timestamps são em formato ISO 8601

