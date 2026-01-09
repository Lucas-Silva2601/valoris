# ⛽ Sistema de Combustível - FASE 14

## 📋 Resumo da Implementação

Sistema completo de combustível para unidades militares, onde cada tipo de unidade consome combustível baseado na distância percorrida.

## 🗄️ Modelo de Dados

### Campos Adicionados ao MilitaryUnit:

```javascript
fuel: {
  current: Number,    // Combustível atual (0-100)
  capacity: Number    // Capacidade máxima (100-200)
},
lastMovementTime: Date  // Timestamp do último movimento
```

## ⚙️ Fatores de Consumo por Tipo

| Tipo | Consumo/km | Capacidade | Descrição |
|------|------------|------------|-----------|
| **Tanque** | 0.5L/km | 100L | Consumo médio, capacidade padrão |
| **Navio** | 0.3L/km | 200L | Consumo baixo, maior capacidade |
| **Avião** | 1.0L/km | 150L | Consumo alto, capacidade média |

## 🔧 Funcionalidades Implementadas

### 1. Validação Antes do Movimento

- Verifica se a unidade tem combustível suficiente antes de iniciar movimento
- Calcula combustível necessário para a viagem completa
- Bloqueia movimento se não houver combustível suficiente

```javascript
// Exemplo de erro retornado:
"Combustível insuficiente. Necessário: 45.2L, Disponível: 30.0L"
```

### 2. Consumo Durante Movimento

- Calcula distância percorrida usando `turf.js` (em quilômetros)
- Consome combustível proporcional à distância percorrida
- Atualiza combustível a cada ciclo de movimento

### 3. Parada Automática

- Se o combustível acabar durante o movimento, a unidade para automaticamente
- Status muda para `'idle'`
- `targetPosition` é limpo
- Unidade fica imóvel até ser reabastecida

### 4. Cálculo de Distância

Utiliza a biblioteca `@turf/turf` para calcular distâncias reais em quilômetros:

```javascript
const from = turf.point([currentLng, currentLat]);
const to = turf.point([targetLng, targetLat]);
const distanceKm = turf.distance(from, to, { units: 'kilometers' });
```

## 📊 Fluxo de Funcionamento

### Iniciar Movimento:

1. Usuário solicita movimento da unidade
2. Sistema verifica:
   - ✅ Unidade existe e não está destruída
   - ✅ Unidade não está em movimento ou combate
   - ✅ **Combustível disponível > 0**
   - ✅ **Combustível suficiente para a viagem**
   - ✅ Destino dentro do alcance
3. Calcula distância total e combustível necessário
4. Inicia movimento se todas as validações passarem

### Durante Movimento:

1. Job periódico (`unitMovementJob`) atualiza posição
2. Para cada unidade em movimento:
   - Calcula distância percorrida desde última atualização
   - Consome combustível proporcional
   - Atualiza posição
   - **Se combustível <= 0: para a unidade**

### Fim do Movimento:

- **Chegada ao destino**: Status volta para `'idle'`
- **Combustível esgotado**: Status volta para `'idle'`, unidade para no meio do caminho

## 🚨 Comportamentos Especiais

### Unidade Sem Combustível:

- ❌ Não pode iniciar novo movimento
- ⚠️ Para no meio do caminho se acabar durante movimento
- 🔴 Status muda para `'idle'`
- 📍 Permanece na última posição alcançada

### Eventos de Analytics:

- `unit_moved`: Registrado quando movimento é iniciado
- `unit_out_of_fuel`: Registrado quando combustível acaba durante movimento

## 🔐 Validações de Segurança

1. **Server-Side Validation**: Toda validação de combustível é feita no servidor
2. **Cálculo Preciso**: Usa `turf.js` para cálculos geográficos precisos
3. **Prevenção de Exploits**: Combustível é verificado antes e durante movimento

## 📦 Dependências

- `@turf/turf`: Biblioteca para cálculos geográficos (distância em km)

## 🔄 Próximos Passos (Fase 13)

1. **Sistema de Reabastecimento**: Permitir que jogadores reabasteçam unidades
2. **Custos de Combustível**: Implementar custos (100% das taxas de combustível são "queimadas")
3. **Interface Visual**: Mostrar barra de combustível no frontend
4. **Alertas**: Notificar quando combustível está baixo

## 💡 Exemplos de Uso

### Tanque movendo 100km:
- Consumo: 100km × 0.5L/km = **50L**
- Combustível restante: 100L - 50L = **50L**

### Navio movendo 200km:
- Consumo: 200km × 0.3L/km = **60L**
- Combustível restante: 200L - 60L = **140L**

### Avião movendo 50km:
- Consumo: 50km × 1.0L/km = **50L**
- Combustível restante: 150L - 50L = **100L**

## ⚠️ Notas Importantes

- Combustível é consumido **durante** o movimento, não antes
- Se a unidade parar no meio do caminho, ela permanece na última posição
- Reabastecimento será implementado na próxima fase
- Cálculos usam distância real em quilômetros, não distância em graus

