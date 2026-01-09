# Testes E2E - Valoris

## Configuração

Para executar testes E2E, você precisará de uma das seguintes ferramentas:

### Opção 1: Playwright (Recomendado)

```bash
npm install -D @playwright/test
npx playwright install
```

### Opção 2: Cypress

```bash
npm install -D cypress
```

## Cenários de Teste

### 1. Fluxo de Investimento

**Objetivo:** Verificar o fluxo completo de investimento em um país.

**Passos:**
1. Fazer login como investidor
2. Navegar até o mapa
3. Selecionar um país
4. Abrir modal de investimento
5. Comprar ações (ex: 10%)
6. Verificar atualização do saldo
7. Verificar atualização da lista de acionistas

**Arquivo:** `investment-flow.spec.js`

### 2. Fluxo de Combate

**Objetivo:** Verificar o sistema de combate entre unidades.

**Passos:**
1. Fazer login como operacional
2. Criar unidade militar (tank)
3. Mover unidade para país inimigo
4. Verificar detecção de invasão
5. Verificar cálculo de combate
6. Verificar consequências (danos, conquista)

**Arquivo:** `combat-flow.spec.js`

### 3. Sincronização em Tempo Real

**Objetivo:** Verificar sincronização de dados em tempo real.

**Passos:**
1. Abrir duas sessões (dois navegadores)
2. Na sessão 1: comprar ações
3. Na sessão 2: verificar atualização automática
4. Na sessão 1: mover unidade
5. Na sessão 2: verificar atualização de posição

**Arquivo:** `realtime-sync.spec.js`

## Executar Testes

### Playwright
```bash
npx playwright test
npx playwright test --ui  # Interface gráfica
```

### Cypress
```bash
npx cypress open  # Interface gráfica
npx cypress run   # Headless
```

## Notas

- Certifique-se de que o backend e frontend estão rodando antes de executar os testes
- Use um banco de dados de teste separado
- Limpe dados de teste após cada execução

