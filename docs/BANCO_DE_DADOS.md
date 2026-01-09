# 🗄️ Estrutura do Banco de Dados - Valoris

## Visão Geral

O Valoris usa MongoDB como banco de dados NoSQL. Este documento descreve a estrutura das coleções e seus relacionamentos.

## Coleções

### Users
Armazena informações dos usuários/jogadores.

```javascript
{
  _id: ObjectId,
  username: String (único, indexado),
  email: String (único, indexado),
  password: String (hash bcrypt),
  role: String ('investor' | 'operational' | 'admin'),
  wallet: ObjectId (ref: Wallet),
  createdAt: Date,
  lastLogin: Date
}
```

**Índices:**
- `username`: único
- `email`: único

### Wallets
Carteiras dos jogadores.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  balance: Number (default: 10000),
  currency: String (default: 'VAL'),
  transactions: [{
    type: String,
    amount: Number,
    description: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `userId`: único

### CountryOwnership
Propriedade de ações dos países.

```javascript
{
  _id: ObjectId,
  countryId: String (único, indexado),
  countryName: String,
  totalShares: Number (default: 100),
  availableShares: Number,
  currentSharePrice: Number,
  totalInvested: Number,
  shareholders: [{
    userId: ObjectId,
    shares: Number,
    purchasePrice: Number,
    purchasedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `countryId`: único
- `shareholders.userId`: indexado

### MilitaryUnits
Unidades militares dos jogadores.

```javascript
{
  _id: ObjectId,
  unitId: String (único, indexado),
  ownerId: ObjectId (ref: User),
  countryId: String,
  type: String ('tank' | 'ship' | 'plane'),
  position: {
    lat: Number,
    lng: Number
  },
  targetPosition: {
    lat: Number,
    lng: Number
  },
  health: {
    current: Number,
    max: Number
  },
  attack: Number,
  defense: Number,
  speed: Number,
  status: String,
  currentCountry: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `unitId`: único
- `ownerId`: indexado
- `currentCountry`: indexado
- `status`: indexado

### Combats
Registros de combates.

```javascript
{
  _id: ObjectId,
  combatId: String (único, indexado),
  attackerCountry: String,
  defenderCountry: String,
  attackerUnits: [{
    unitId: String,
    type: String,
    healthBefore: Number,
    healthAfter: Number,
    damageDealt: Number
  }],
  defenderUnits: [...],
  defenseSystem: {
    level: Number,
    healthBefore: Number,
    healthAfter: Number
  },
  result: String ('ongoing' | 'attacker_victory' | 'defender_victory'),
  startedAt: Date,
  endedAt: Date
}
```

**Índices:**
- `combatId`: único
- `attackerCountry`: indexado
- `defenderCountry`: indexado
- `result`: indexado

### EconomicMetrics
Métricas econômicas dos países.

```javascript
{
  _id: ObjectId,
  countryId: String (único, indexado),
  countryName: String,
  healthScore: Number (0-100),
  investmentLevel: Number,
  politicalStability: Number (0-100),
  infrastructure: {
    level: Number (1-10),
    condition: Number (0-100)
  },
  resources: {
    virtual: Number,
    exploitationRate: Number (0-10)
  },
  events: [{
    type: String,
    impact: Number,
    description: String,
    startDate: Date,
    endDate: Date,
    active: Boolean
  }],
  history: [{
    date: Date,
    healthScore: Number,
    investmentLevel: Number,
    politicalStability: Number
  }],
  updatedAt: Date
}
```

**Índices:**
- `countryId`: único

### Treasuries
Tesouros nacionais dos países.

```javascript
{
  _id: ObjectId,
  countryId: String (único, indexado),
  balance: Number,
  infrastructureLevel: Number (1-10),
  defenseLevel: Number (1-10),
  updatedAt: Date
}
```

**Índices:**
- `countryId`: único

### Dividends
Registros de distribuição de dividendos.

```javascript
{
  _id: ObjectId,
  countryId: String (indexado),
  totalAmount: Number,
  distributionDate: Date (indexado),
  treasuryReserve: Number,
  distributions: [{
    userId: ObjectId,
    amount: Number,
    shares: Number
  }],
  sources: [{
    type: String,
    amount: Number
  }]
}
```

**Índices:**
- `countryId`: indexado
- `distributionDate`: indexado

### GameEvents
Eventos do jogo para analytics.

```javascript
{
  _id: ObjectId,
  eventType: String (indexado),
  userId: ObjectId (ref: User, indexado),
  countryId: String (indexado),
  metadata: Map,
  timestamp: Date (indexado),
  sessionId: String (indexado)
}
```

**Índices:**
- `eventType`: indexado
- `userId`: indexado
- `countryId`: indexado
- `timestamp`: indexado
- Composto: `{eventType: 1, timestamp: -1}`
- Composto: `{userId: 1, timestamp: -1}`

### AnalyticsMetrics
Métricas agregadas de analytics.

```javascript
{
  _id: ObjectId,
  date: Date (único, indexado),
  activePlayers: Number,
  newPlayers: Number,
  totalTransactions: Number,
  totalTransactionValue: Number,
  totalCombats: Number,
  totalInvestments: Number,
  topInvestedCountries: [...],
  unitsCreated: Number,
  missionsCreated: Number,
  missionsCompleted: Number,
  dividendsDistributed: Number
}
```

**Índices:**
- `date`: único

### PlayerProfiles
Perfis dos jogadores.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, único),
  role: String,
  stats: {
    totalInvested: Number,
    totalEarned: Number,
    countriesOwned: Number,
    unitsCreated: Number,
    combatsWon: Number
  },
  history: [...]
}
```

**Índices:**
- `userId`: único

### Missions
Missões do jogo.

```javascript
{
  _id: ObjectId,
  investorId: ObjectId (ref: User),
  operationalId: ObjectId (ref: User),
  countryId: String,
  type: String,
  status: String,
  reward: Number,
  description: String,
  createdAt: Date,
  completedAt: Date
}
```

**Índices:**
- `investorId`: indexado
- `operationalId`: indexado
- `countryId`: indexado
- `status`: indexado

## Relacionamentos

```
User (1) ──→ (1) Wallet
User (1) ──→ (1) PlayerProfile
User (N) ──→ (N) CountryOwnership (via shareholders)
User (N) ──→ (N) MilitaryUnit
User (N) ──→ (N) GameEvent
CountryOwnership (1) ──→ (N) EconomicMetrics (via countryId)
CountryOwnership (1) ──→ (1) Treasury (via countryId)
MilitaryUnit (N) ──→ (N) Combat
```

## Queries Comuns

### Obter propriedade de um país
```javascript
CountryOwnership.findOne({ countryId: 'BRA' })
  .populate('shareholders.userId', 'username')
```

### Obter unidades de um jogador
```javascript
MilitaryUnit.find({ ownerId: userId, status: { $ne: 'destroyed' } })
```

### Obter histórico de combates
```javascript
Combat.find({
  $or: [
    { attackerCountry: countryId },
    { defenderCountry: countryId }
  ]
}).sort({ startedAt: -1 })
```

### Obter eventos recentes
```javascript
GameEvent.find({
  eventType: 'investment_made',
  timestamp: { $gte: startDate, $lte: endDate }
}).sort({ timestamp: -1 }).limit(100)
```

## Índices Importantes

Todos os campos frequentemente consultados devem ter índices:

- `countryId` em múltiplas coleções
- `userId` em coleções relacionadas a usuários
- `timestamp` em coleções de eventos
- Campos compostos para queries complexas

## Performance

- Use `lean()` para queries de leitura que não precisam de métodos Mongoose
- Use `select()` para limitar campos retornados
- Use paginação para listas grandes
- Use agregação para cálculos complexos

## Backup

Backups automáticos são executados diariamente via script `backup-database.sh`.

Para restaurar:
```bash
./scripts/restore-database.sh backups/valoris_backup_YYYYMMDD_HHMMSS.tar.gz
```

