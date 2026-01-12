# 🔒 Integridade Referencial e Transações Atômicas

## ✅ FASE 19.3: Documentação de Integridade Referencial

Este documento descreve o sistema de integridade referencial e transações atômicas implementado no projeto Valoris.

---

## 📋 Índice

1. [Integridade Referencial](#integridade-referencial)
2. [Scripts de Limpeza](#scripts-de-limpeza)
3. [Validação de Referências](#validação-de-referências)
4. [Transações Atômicas](#transações-atômicas)
5. [Processo de Manutenção](#processo-de-manutenção)

---

## 🔗 Integridade Referencial

### O que é?

Integridade referencial garante que todas as referências entre tabelas sejam válidas. Por exemplo:
- Um edifício deve ter uma `city_id` válida (ou NULL)
- Um NPC deve ter uma `city_id` válida (ou NULL)
- Um edifício deve ter um `owner_id` válido

### Problemas Comuns

1. **Edifícios Órfãos**: Edifícios sem `city_id` válida (cidade foi removida ou nunca foi identificada)
2. **NPCs Órfãos**: NPCs sem `city_id` válida (cidade foi removida ou nunca foi identificada)
3. **Referências Inválidas**: IDs que não existem mais no banco de dados

---

## 🧹 Scripts de Limpeza

### Script Principal: `integrityCleanup.js`

Localização: `backend/scripts/integrityCleanup.js`

#### Funcionalidades

1. **Limpar Edifícios Órfãos** (`cleanupOrphanBuildings`)
   - Identifica edifícios sem `city_id` válida
   - Tenta identificar a cidade a partir das coordenadas (`position_lat`, `position_lng`)
   - Atualiza edifícios com a cidade identificada
   - Lista edifícios que não puderam ser corrigidos

2. **Limpar NPCs Órfãos** (`cleanupOrphanNPCs`)
   - Identifica NPCs sem `city_id` válida
   - Tenta identificar a cidade a partir das coordenadas
   - Atualiza NPCs com a cidade identificada
   - Lista NPCs que não puderam ser corrigidos

#### Uso

```bash
# Modo DRY RUN (simulação - não faz alterações)
node backend/scripts/integrityCleanup.js

# Modo EXECUÇÃO REAL (faz alterações no banco)
node backend/scripts/integrityCleanup.js --execute
```

#### Exemplo de Saída

```
🔍 Iniciando limpeza de edifícios órfãos (dryRun: true)...
✅ Edifício building_123 seria corrigido: São Paulo
✅ Edifício building_456 seria corrigido: Rio de Janeiro
📊 Resultados:
   - Edifícios corrigidos: 2
   - Edifícios órfãos: 0
```

---

## ✅ Validação de Referências

### Serviço: `transactionService.js`

Localização: `backend/services/transactionService.js`

#### Função: `validateReferences(references)`

Valida referências antes de criar novos registros.

**Parâmetros:**
- `references.cityId` (opcional): ID da cidade
- `references.stateId` (opcional): ID do estado
- `references.countryId` (opcional): ID do país
- `references.userId` (opcional): ID do usuário
- `references.buildingId` (opcional): ID do edifício

**Retorno:**
```javascript
{
  valid: true/false,
  errors: ['erro1', 'erro2', ...]
}
```

#### Uso

```javascript
import { validateReferences } from './transactionService.js';

const validation = await validateReferences({
  userId: 'user123',
  cityId: 'city_456',
  countryId: 'BRA'
});

if (!validation.valid) {
  throw new Error(`Referências inválidas: ${validation.errors.join(', ')}`);
}
```

#### Onde é Usado

- **`buildingService.js`**: Antes de criar edifícios
- **`propertyMarketplaceService.js`**: Antes de comprar imóveis
- **`transactionService.js`**: Antes de executar transações atômicas

---

## 🔄 Transações Atômicas

### O que são?

Transações atômicas garantem que múltiplas operações sejam executadas como uma única unidade. Se qualquer parte falhar, **tudo é revertido** (rollback).

### Funções SQL

Localização: `backend/config/schema.sql`

#### 1. `purchase_property_atomic`

Transação atômica para compra de imóvel.

**Operações:**
1. Valida saldo do comprador
2. Subtrai saldo do comprador
3. Adiciona saldo ao vendedor
4. Transfere propriedade do edifício
5. Marca listagem como vendida

**Se qualquer operação falhar, todas são revertidas automaticamente.**

#### 2. `build_building_atomic`

Transação atômica para construção de edifício.

**Operações:**
1. Valida saldo do usuário
2. Subtrai saldo do usuário
3. Cria edifício no banco

**Se qualquer operação falhar, todas são revertidas automaticamente.**

### Serviço: `transactionService.js`

#### Função: `purchasePropertyAtomic(...)`

Usa a função SQL `purchase_property_atomic` para garantir atomicidade.

**Fallback**: Se a função SQL não estiver disponível, usa modo manual (compatibilidade retroativa).

#### Função: `buildBuildingAtomic(...)`

Usa a função SQL `build_building_atomic` para garantir atomicidade.

**Fallback**: Se a função SQL não estiver disponível, usa modo manual (compatibilidade retroativa).

### Onde são Usadas

1. **`propertyMarketplaceService.js`** → `purchaseProperty`
   - Tenta usar `purchasePropertyAtomic`
   - Fallback para modo manual se falhar

2. **`buildingService.js`** → `buildBuilding`
   - Tenta usar `buildBuildingAtomic`
   - Fallback para modo manual se falhar

---

## 🔧 Processo de Manutenção

### Limpeza Manual

Execute o script de limpeza periodicamente (semanal ou mensal):

```bash
# 1. Primeiro, execute em modo DRY RUN para ver o que será corrigido
node backend/scripts/integrityCleanup.js

# 2. Se estiver satisfeito, execute em modo real
node backend/scripts/integrityCleanup.js --execute
```

### Limpeza Automática (Opcional)

Você pode criar um job periódico para executar limpeza automática:

```javascript
// backend/jobs/integrityCleanupJob.js
import cron from 'node-cron';
import { runIntegrityCleanup } from '../scripts/integrityCleanup.js';

// Executar toda segunda-feira às 2h da manhã
cron.schedule('0 2 * * 1', async () => {
  await runIntegrityCleanup(false); // false = execução real
});
```

### Monitoramento

Monitore os logs do servidor para identificar:
- Edifícios/NPCs que não puderam ser corrigidos
- Referências inválidas sendo criadas
- Falhas em transações atômicas

---

## 📝 Operações que Requerem Transação

### ✅ Implementadas

1. **Compra de Imóvel** (`propertyMarketplaceService.purchaseProperty`)
   - Subtração de saldo + Transferência de propriedade
   - Função SQL: `purchase_property_atomic`

2. **Construção de Edifício** (`buildingService.buildBuilding`)
   - Subtração de saldo + Criação de edifício
   - Função SQL: `build_building_atomic`

### 🔄 Futuras (se necessário)

1. **Compra de Ações de País** (`countryOwnershipService.buyShares`)
   - Subtração de saldo + Adição de ações
   - Pode ser implementada se necessário

2. **Venda de Ações** (`countryOwnershipService.sellShares`)
   - Adição de saldo + Remoção de ações
   - Pode ser implementada se necessário

---

## 🧪 Testes de Cenários de Falha

### Cenários Testados

1. **Saldo Insuficiente**
   - ✅ Transação é revertida automaticamente
   - ✅ Saldo não é subtraído
   - ✅ Edifício não é criado/transferido

2. **Edifício Já Vendido**
   - ✅ Transação falha ao tentar atualizar listagem
   - ✅ Rollback automático
   - ✅ Saldo não é subtraído

3. **Referências Inválidas**
   - ✅ Validação detecta antes da transação
   - ✅ Transação não é executada
   - ✅ Erro claro é retornado

---

## 📚 Referências

- **Schema SQL**: `backend/config/schema.sql` (linhas 534-680)
- **Script de Limpeza**: `backend/scripts/integrityCleanup.js`
- **Serviço de Transações**: `backend/services/transactionService.js`
- **Serviço de Edifícios**: `backend/services/buildingService.js`
- **Serviço de Marketplace**: `backend/services/propertyMarketplaceService.js`

---

**Última atualização**: FASE 19.3

