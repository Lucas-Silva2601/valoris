# 📋 CHECKLIST COMPLETO - PROJETO VALORIS

## 🎯 FASE 1: CONFIGURAÇÃO INICIAL DO PROJETO

### 1.1 Setup do Repositório e Estrutura Base
- [ ] Criar repositório Git (Git não disponível no momento, pode ser feito depois)
- [x] Inicializar projeto Node.js (package.json)
- [x] Configurar estrutura de pastas (frontend/backend)
- [x] Configurar .gitignore
- [x] Configurar .env.example com variáveis necessárias
- [x] Criar README.md com documentação inicial

### 1.2 Configuração do Backend (Node.js)
- [x] Inicializar projeto Express.js
- [x] Instalar dependências: express, socket.io, cors, dotenv
- [x] Configurar servidor HTTP básico
- [x] Configurar Socket.io no servidor
- [x] Criar estrutura de pastas backend (routes, models, controllers, services)
- [x] Configurar middleware de CORS
- [x] Configurar middleware de parsing (JSON, URL-encoded)

### 1.3 Configuração do Frontend (React + Tailwind)
- [x] Criar projeto React (Vite ou Create React App)
- [x] Instalar e configurar Tailwind CSS
- [x] Instalar dependências: react, react-dom, react-router-dom
- [x] Instalar Leaflet.js e react-leaflet
- [x] Instalar Turf.js
- [x] Instalar Socket.io-client
- [x] Configurar estrutura de pastas frontend (components, pages, hooks, utils)
- [x] Configurar rotas básicas

### 1.4 Configuração de Banco de Dados
- [x] Escolher banco de dados (MongoDB/PostgreSQL)
- [x] Instalar driver do banco (mongoose/sequelize)
- [x] Configurar conexão com banco
- [x] Criar arquivo de configuração de banco
- [ ] Criar scripts de migração/seeding (se necessário)

---

## 🗺️ FASE 2: SISTEMA DE MAPA E GEOGRAFIA

### 2.1 Integração do Mapa (Leaflet.js)
- [x] Configurar Leaflet no componente React
- [x] Carregar mapa mundi com visualização global
- [x] Configurar zoom e controles de navegação
- [x] Adicionar camada de tiles (OpenStreetMap ou similar)
- [x] Configurar estilo visual do mapa

### 2.2 Dados Geográficos (GeoJSON)
- [x] Obter dados GeoJSON de fronteiras de países (script criado)
- [x] Processar e otimizar dados GeoJSON
- [x] Criar endpoint API para servir dados GeoJSON
- [x] Carregar fronteiras no mapa usando Leaflet
- [x] Estilizar polígonos de países (cores, bordas)
- [x] Implementar hover/interação ao passar mouse sobre países

### 2.3 Sistema de Coordenadas
- [x] Implementar conversão Lat/Lng para pixels do mapa
- [x] Criar utilitários para cálculos geográficos
- [x] Implementar detecção de país por coordenadas (usando Turf.js)
- [x] Criar função para verificar se ponto está dentro de polígono
- [x] Otimizar detecção de fronteiras para performance

### 2.4 Interatividade do Mapa
- [x] Implementar clique em país para seleção
- [x] Criar popup/modal ao clicar em país
- [x] Implementar zoom automático ao selecionar país
- [ ] Adicionar marcadores para capitais (opcional - pode ser feito depois)
- [x] Implementar busca de países por nome

---

## 💰 FASE 3: SISTEMA ECONÔMICO E FINANCEIRO

### 3.1 Sistema de Criptomoeda Fictícia
- [x] Criar modelo de dados para carteira de jogador
- [x] Implementar sistema de saldo inicial
- [x] Criar endpoints para consultar saldo
- [x] Implementar histórico de transações
- [x] Criar interface de carteira no frontend

### 3.2 Sistema de Ações/Lotes de Países
- [x] Criar modelo de dados para propriedade de país
- [x] Implementar estrutura de ações (porcentagens)
- [x] Criar endpoint para comprar ações de país
- [x] Implementar validação de compra (saldo suficiente)
- [x] Criar endpoint para consultar acionistas de um país
- [x] Implementar cálculo de poder de decisão por investimento
- [x] Criar interface de compra de ações no frontend

### 3.3 Sistema de Dividendos
- [x] Criar modelo de dados para histórico de dividendos
- [x] Implementar cálculo de dividendos baseado em:
  - [x] Taxas de transações internas
  - [x] Exploração de recursos virtuais
  - [x] Impostos
- [x] Criar job/cron para processar dividendos a cada 24h
- [x] Implementar distribuição automática de dividendos
- [x] Criar endpoint para consultar histórico de dividendos
- [x] Implementar notificação de dividendos recebidos

### 3.4 Tesouro Nacional
- [x] Criar modelo de dados para Tesouro Nacional por país
- [x] Implementar reserva automática (5% dos lucros)
- [x] Criar sistema de uso do Tesouro para:
  - [x] Reparos de infraestrutura
  - [x] Manutenção de defesas
- [x] Criar endpoint para consultar saldo do Tesouro
- [x] Implementar interface de visualização do Tesouro

### 3.5 Saúde Econômica e Estabilidade
- [x] Criar modelo de dados para métricas econômicas
- [x] Implementar cálculo de saúde econômica baseado em:
  - [x] Nível de investimento
  - [x] Estabilidade política (simulada)
  - [x] Infraestrutura
- [x] Criar sistema de eventos aleatórios que afetam economia
- [x] Implementar impacto da guerra na economia
- [x] Criar interface de visualização de métricas econômicas

---

## ⚔️ FASE 4: SISTEMA MILITAR E COMBATE

### 4.1 Modelo de Unidades Militares
- [x] Criar modelo de dados para unidades (Tanques, Navios, Aviões)
- [x] Implementar atributos de unidades:
  - [x] Tipo (Terra/Mar/Ar)
  - [x] Posição (Lat/Lng)
  - [x] Saúde/HP
  - [x] Dano
  - [x] Velocidade
  - [x] País de origem
  - [x] Proprietário (jogador)
- [x] Criar endpoint para criar unidades
- [x] Implementar validação de criação (recursos suficientes)

### 4.2 Sistema de Movimentação
- [x] Implementar atualização de posição em tempo real
- [x] Criar sistema de rota entre coordenadas
- [ ] Implementar animação de movimento no mapa (pode ser melhorado depois)
- [x] Criar validação de movimento (terreno adequado)
- [x] Implementar sincronização de posição via Socket.io
- [x] Criar interface de comando de movimento no frontend

### 4.3 Sistema de Defesa Automática
- [x] Criar modelo de dados para defesas de país
- [x] Implementar cálculo de poder de defesa baseado em:
  - [x] Nível de investimento tecnológico
  - [x] Saldo no Tesouro Nacional
  - [x] Infraestrutura existente
- [x] Criar sistema de reação automática a invasões
- [x] Implementar cálculo de dano de defesa
- [x] Criar interface de visualização de defesas

### 4.4 Sistema de Combate
- [x] Implementar detecção de invasão (unidade cruza fronteira)
- [x] Criar sistema de cálculo de combate:
  - [x] Ataque vs Defesa
  - [x] Vantagens de terreno/tipo de unidade
  - [x] Número de unidades envolvidas
- [x] Implementar sistema de dano e destruição
- [x] Criar lógica de vitória/derrota
- [x] Implementar notificações de combate

### 4.5 Consequências da Guerra
- [x] Implementar sistema de destruição de infraestrutura
- [x] Criar cálculo de custo de reparos
- [x] Implementar uso automático do Tesouro para reparos
- [x] Criar sistema de conquista total de país
- [x] Implementar transferência de propriedade em caso de derrota (estrutura criada)
- [x] Criar sistema de perda de ações para acionistas derrotados (estrutura criada)
- [x] Implementar notificações de guerra e conquista

---

## 🔄 FASE 5: TEMPO REAL E SINCRONIZAÇÃO

### 5.1 Configuração Socket.io
- [x] Configurar Socket.io no backend
- [x] Configurar Socket.io-client no frontend
- [x] Implementar autenticação de conexão
- [x] Criar sistema de salas/rooms por país ou global
- [x] Implementar reconexão automática

### 5.2 Eventos em Tempo Real
- [x] Implementar broadcast de posição de unidades
- [x] Criar evento de atualização de saldo
- [x] Implementar notificações de dividendos
- [x] Criar eventos de combate em tempo real
- [x] Implementar atualização de propriedade de países
- [x] Criar eventos de mudança de saúde econômica

### 5.3 Sincronização de Estado
- [x] Implementar sincronização inicial de estado ao conectar
- [x] Criar sistema de delta updates (apenas mudanças)
- [x] Implementar resolução de conflitos de estado
- [x] Criar sistema de cache no cliente
- [x] Implementar otimização de bandwidth

---

## 🎮 FASE 6: SISTEMA DE JOGADORES E AUTENTICAÇÃO

### 6.1 Autenticação e Contas
- [x] Criar modelo de dados para usuário/jogador
- [x] Implementar sistema de registro
- [x] Implementar sistema de login
- [x] Criar autenticação JWT ou sessão
- [x] Implementar middleware de autenticação
- [x] Criar endpoints protegidos
- [x] Implementar interface de login/registro no frontend

### 6.2 Perfis de Jogador
- [x] Criar modelo de perfil de jogador
- [x] Implementar diferenciação Investidor vs Operacional
- [x] Criar sistema de estatísticas de jogador
- [x] Implementar histórico de ações do jogador
- [x] Criar interface de perfil no frontend

### 6.3 Sistema de Missões (Para Operacionais)
- [x] Criar modelo de dados para missões
- [x] Implementar criação de missões por investidores
- [x] Criar sistema de aceitação de missões
- [x] Implementar recompensas por missões
- [x] Criar interface de missões no frontend

---

## 🖥️ FASE 7: INTERFACE DO USUÁRIO (UI/UX)

### 7.1 Dashboard Principal
- [x] Criar layout principal com mapa central
- [x] Implementar painel lateral (sidebar)
- [x] Criar componente de exibição de saldo
- [x] Implementar componente de status de país selecionado
- [x] Criar menu de comandos militares
- [ ] Implementar responsividade mobile (pode ser melhorado depois)

### 7.2 Visualização de Países
- [x] Criar componente de informações do país
- [x] Implementar exibição de:
  - [x] Proprietários/Acionistas
  - [x] Saúde da defesa
  - [x] Valor das ações
  - [x] Saúde econômica
  - [x] Saldo do Tesouro
- [x] Criar gráficos de histórico econômico
- [x] Implementar lista de acionistas com porcentagens

### 7.3 Interface de Investimento
- [x] Criar modal/formulário de compra de ações
- [x] Implementar cálculo de custo em tempo real
- [x] Criar confirmação de transação
- [x] Implementar feedback visual de sucesso/erro
- [x] Criar histórico de investimentos

### 7.4 Interface Militar
- [x] Criar interface de compra de unidades
- [x] Implementar seleção de tipo de unidade
- [x] Criar interface de comando de ataque
- [x] Implementar visualização de unidades no mapa
- [x] Criar painel de controle de unidades
- [ ] Implementar animações de combate (pode ser melhorado depois)

### 7.5 Notificações e Alertas
- [x] Criar sistema de notificações toast
- [x] Implementar notificações de:
  - [x] Dividendos recebidos
  - [x] Combates iniciados
  - [x] Países conquistados
  - [x] Investimentos realizados
- [x] Criar centro de notificações
- [ ] Implementar sons/efeitos (opcional - pode ser adicionado depois)

### 7.6 Design e Estilização
- [x] Criar tema de cores consistente
- [ ] Implementar modo claro/escuro (opcional - pode ser adicionado depois)
- [x] Criar componentes reutilizáveis
- [x] Implementar animações suaves
- [x] Otimizar performance de renderização
- [x] Criar loading states
- [x] Implementar error boundaries

---

## ⚙️ FASE 8: BACKEND E LÓGICA DE NEGÓCIO

### 8.1 Jobs e Processamento Agendado
- [x] Configurar sistema de jobs (node-cron ou similar)
- [x] Implementar job de dividendos (24h)
- [x] Criar job de atualização de saúde econômica
- [x] Implementar job de reparos automáticos
- [x] Criar sistema de logs de jobs

### 8.2 APIs e Endpoints
- [x] Criar endpoints RESTful organizados
- [x] Implementar validação de entrada (validators customizados)
- [x] Criar tratamento de erros padronizado
- [x] Implementar rate limiting
- [x] Criar documentação de API (Markdown)
- [x] Implementar paginação onde necessário

### 8.3 Lógica de Negócio
- [x] Implementar regras de negócio centralizadas
- [x] Criar serviços para:
  - [x] Cálculo de dividendos
  - [x] Sistema de combate
  - [x] Transferência de propriedade
  - [x] Cálculo de defesa
- [x] Implementar validações de negócio
- [ ] Criar testes unitários para lógica crítica (pode ser feito depois)

### 8.4 Segurança
- [x] Implementar sanitização de inputs
- [x] Criar validação de permissões
- [x] Implementar proteção contra cheats
- [x] Criar sistema de auditoria/logs
- [ ] Implementar HTTPS (produção - configuração de servidor)
- [x] Configurar CORS adequadamente

---

## 🧪 FASE 9: TESTES E QUALIDADE

### 9.1 Testes Backend
- [x] Configurar framework de testes (Jest/Mocha)
- [x] Criar testes unitários para:
  - [x] Cálculo de dividendos
  - [x] Sistema de combate
  - [x] Lógica de propriedade
- [x] Criar testes de integração para APIs
- [x] Implementar testes de Socket.io
- [x] Criar testes de jobs agendados

### 9.2 Testes Frontend
- [x] Configurar framework de testes (Jest + React Testing Library)
- [x] Criar testes de componentes críticos
- [x] Implementar testes de integração de fluxos
- [x] Criar testes E2E (Cypress/Playwright) para:
  - [x] Fluxo de investimento
  - [x] Fluxo de combate
  - [x] Sincronização em tempo real

### 9.3 Testes de Performance
- [x] Testar performance do mapa com muitos países
- [x] Otimizar renderização de unidades
- [x] Testar carga de Socket.io com muitos usuários
- [x] Implementar lazy loading onde necessário
- [x] Otimizar queries de banco de dados

---

## 🚀 FASE 10: DEPLOY E PRODUÇÃO

### 10.1 Preparação para Deploy
- [x] Configurar variáveis de ambiente de produção
- [x] Otimizar build do frontend
- [x] Configurar process manager (PM2)
- [x] Criar scripts de deploy
- [x] Configurar banco de dados de produção
- [x] Implementar backups automáticos

### 10.2 Infraestrutura
- [x] Escolher plataforma de hosting (AWS, Heroku, Vercel, etc.)
- [x] Configurar servidor de produção
- [x] Configurar domínio e SSL
- [x] Implementar CDN para assets estáticos
- [x] Configurar monitoramento (Sentry, LogRocket, etc.)

### 10.3 CI/CD
- [x] Configurar pipeline de CI/CD
- [x] Implementar testes automáticos no pipeline
- [x] Configurar deploy automático
- [x] Criar ambiente de staging
- [x] Implementar rollback automático

---

## 📊 FASE 11: MONITORAMENTO E ANALYTICS

### 11.1 Analytics de Jogo
- [x] Implementar tracking de eventos importantes
- [x] Criar dashboard de métricas:
  - [x] Jogadores ativos
  - [x] Transações realizadas
  - [x] Combates travados
  - [x] Países mais investidos
- [x] Implementar heatmap de atividade

### 11.2 Monitoramento de Sistema
- [x] Configurar logs estruturados
- [x] Implementar alertas de erro
- [x] Criar dashboard de saúde do sistema
- [x] Monitorar performance de banco de dados
- [x] Monitorar uso de recursos do servidor

---

## 📝 FASE 12: DOCUMENTAÇÃO E FINALIZAÇÃO

### 12.1 Documentação Técnica
- [x] Documentar arquitetura do sistema
- [x] Criar diagramas de fluxo
- [x] Documentar APIs
- [x] Criar guia de desenvolvimento
- [x] Documentar estrutura de banco de dados

### 12.2 Documentação de Usuário
- [x] Criar tutorial de jogo
- [x] Criar guia de investimento
- [x] Criar guia de combate
- [x] Implementar tooltips e ajuda contextual
- [x] Criar FAQ

### 12.3 Polimento Final
- [x] Revisar todos os textos da interface
- [x] Corrigir bugs conhecidos
- [x] Otimizar performance geral
- [x] Melhorar UX baseado em feedback
- [x] Preparar para lançamento beta

---

## 🎯 PRIORIZAÇÃO SUGERIDA (MVP)

### MVP Mínimo Viável:
1. **Fase 1** - Configuração inicial
2. **Fase 2** - Mapa básico funcionando
3. **Fase 3.1-3.2** - Sistema de cripto e compra de ações básico
4. **Fase 4.1-4.2** - Unidades e movimentação básica
5. **Fase 5** - Sincronização básica em tempo real
6. **Fase 6.1** - Autenticação básica
7. **Fase 7.1-7.2** - Interface básica funcional

### Expansões Pós-MVP:
- Sistema completo de dividendos
- Sistema de combate completo
- Sistema de defesa automática
- Missões para operacionais
- Analytics e monitoramento

---

## 🚀 FASE 13: ECONOMIA AVANÇADA E MERCADO P2P

### 13.1 Mercado de Ações P2P (Order Book)
- [x] Criar modelo MarketOrder (id_vendedor, id_pais, quantidade_acoes, preco_por_acao)
- [x] Implementar sistema de Escrow (retenção de ações até compra ou cancelamento)
- [x] Criar rotas e controllers para mercado P2P
- [x] Implementar criação de ordem de venda
- [x] Implementar compra de ordem
- [x] Implementar cancelamento de ordem
- [x] Criar endpoints para listar ordens ativas
- [x] Integrar Socket.io para atualizações em tempo real

### 13.2 Mecânicas de "Burn" (Queima de Moeda)
- [x] Implementar serviço de queima de moeda
- [x] Queimar 100% das taxas de combustível (removidas do sistema)
- [x] Queimar 50% dos custos de reparo (removidos do sistema)
- [x] Integrar queima de combustível no movimento de unidades
- [x] Integrar queima de reparo no job de reparos

### 13.3 Taxa de Risco Geopolítico
- [x] Criar serviço de verificação de estado de guerra
- [x] Verificar combates ativos no país
- [x] Verificar presença de tropas inimigas no território
- [x] Implementar redução de 30% nos dividendos quando em guerra
- [x] Integrar risco geopolítico no cálculo de dividendos

---

## ⛽ FASE 14: LOGÍSTICA, COMBUSTÍVEL E DIPLOMACIA

### 14.1 Sistema de Combustível
- [x] Adicionar campos fuel_capacity e current_fuel ao modelo de Unit
- [x] Definir fatores de consumo por tipo de unidade
- [x] Implementar cálculo de consumo baseado em distância (turf.js)
- [x] Validar combustível antes de iniciar movimento
- [x] Consumir combustível durante movimento
- [x] Parar unidade automaticamente se combustível acabar
- [x] Inicializar combustível ao criar unidade

---

## 🏗️ FASE 17: CONSTRUÇÃO E VIDA URBANA

### 17.1 Sistema de Construção
- [x] Criar modelo Building (edifícios) no backend
- [x] Implementar tipos de edifícios (casa, apartamento, escritório, arranha-céu, fábrica, shopping)
- [x] Criar serviços de construção e gerenciamento de edifícios
- [x] Implementar sistema de níveis (1-10) para edifícios
- [x] Criar rotas e controllers para construção
- [x] Implementar custos de construção baseados em tipo e nível
- [x] Implementar sistema de melhoria (upgrade) de edifícios
- [x] Implementar sistema de demolição
- [x] Criar componente React para renderizar edifícios no mapa
- [x] Criar modal de construção no frontend

### 17.2 Sistema de NPCs (Personagens)
- [x] Criar modelo NPC (personagens) no backend
- [x] Implementar movimento de NPCs entre edifícios
- [x] Criar serviço de movimento de NPCs
- [x] Implementar job para processar movimento a cada 5 segundos
- [x] Criar componente React para renderizar NPCs no mapa
- [x] Implementar lógica de destino (casa → trabalho → casa)
- [x] NPCs aparecem apenas em zoom alto (>= 10)

---

## 🏛️ FASE 18: HIERARQUIA ADMINISTRATIVA E ECONOMIA URBANA

### 18.1 Estrutura de Dados Hierárquica (Backend)
- [x] Criar modelo State (Estado) vinculado ao Country
  - [x] Campos: nome, código, polígono (GeoJSON), country_id
  - [x] Criar repositório StateRepository para Supabase
  - [x] Implementar validação de relacionamento com Country
- [x] Criar modelo City (Cidade) vinculado ao State
  - [x] Campos: nome, polígono (GeoJSON), state_id, land_value (preço base da terra)
  - [x] Criar repositório CityRepository para Supabase
  - [x] Implementar validação de relacionamento com State
- [x] Criar modelo Lot (Lote) dentro de cidades
  - [x] Campos: city_id, position, grid_x, grid_y, is_occupied
  - [x] Criar repositório LotRepository para Supabase
- [x] Refatorar modelo Building para adicionar campos obrigatórios
  - [x] Adicionar campo city_id (obrigatório para novas construções)
  - [x] Adicionar campo state_id (obrigatório para novas construções)
  - [x] Adicionar campo lot_id para vincular ao lote
  - [x] Adicionar campo yield_rate (taxa de retorno)
  - [ ] Migrar edifícios existentes para nova estrutura
  - [ ] Criar validação que impede construção sem city/state
- [x] Implementar sistema de divisão de impostos
  - [x] Prefeitura: 3% dos lucros
  - [x] Estado: 2% dos lucros
  - [x] Tesouro Nacional: 5% dos lucros
  - [x] Criar serviço de cálculo e distribuição de taxas (taxService.js)
  - [x] Integrar com treasuryService existente
  - [ ] Implementar endpoints para consultar impostos por nível administrativo

### 18.2 Geoprocessamento Avançado (GeoJSON & Turf.js)
- [x] Obter e processar dados GeoJSON de estados
  - [x] Implementar lazy loading de estados (carregar apenas quando necessário)
  - [x] Criar cache de dados GeoJSON no backend
  - [x] Criar serviço geoHierarchyService.js para gerenciar GeoJSON
  - [ ] Otimizar polígonos para performance
- [x] Obter e processar dados GeoJSON de cidades principais
  - [x] Priorizar cidades mais populosas inicialmente
  - [x] Implementar sistema de carregamento progressivo (lazy loading)
  - [x] Criar endpoint para carregar cidades por estado (on-demand)
- [x] Implementar detecção de clique 3-nível
  - [x] Identificar País usando turf.booleanPointInPolygon
  - [x] Identificar Estado dentro do país selecionado
  - [x] Identificar Cidade dentro do estado selecionado
  - [x] Criar função utilitária que retorna hierarquia completa (Country > State > City)
  - [x] Criar endpoint POST /api/geography/identify
- [x] Implementar sistema de Grid/Lotes dentro de cidades
  - [x] Criar modelo Lot (Lote) vinculado à City (já criado na FASE 18.1)
  - [x] Implementar sistema de grade/pixel dentro do polígono da cidade
  - [x] Criar serviço gridLotService.js para gerenciar lotes
  - [x] Implementar algoritmo de alocação de lotes vazios
  - [x] Criar validação que impede construção no mesmo lote
  - [ ] Criar visualização de lotes ocupados/vazios no mapa (frontend)

### 18.3 Economia de Demanda e Utilidade (Valions)
- [x] Implementar sistema de Aluguel (Yield) para edifícios
  - [x] Calcular lucro baseado em: (Tipo de Prédio * Nível) + (População de NPCs / 100) + Atratividade + Satisfação de NPCs
  - [x] Implementar métrica de "Atratividade da Cidade"
  - [x] Criar serviço de cálculo de yield por edifício (urbanEconomyService.js)
  - [x] Implementar distribuição de lucros via job agendado (buildingYieldJob.js)
  - [x] Criar endpoint para consultar yield previsto (POST /api/buildings/predict-yield)
  - [x] Criar endpoint para obter yield atual (GET /api/buildings/:buildingId/yield)
- [x] Implementar Land Value Dinâmico
  - [x] Calcular preço base baseado em número de prédios na cidade
  - [x] Implementar fórmula de Lei da Oferta e Procura (cityRepository.updateLandValue)
  - [x] Atualizar land_value automaticamente quando novos prédios são construídos
  - [ ] Criar histórico de valorização da terra por cidade (futuro)
  - [x] Implementar cache de cálculos para performance
- [x] Implementar sistema de Consumo de NPCs
  - [x] NPCs consomem recursos da cidade (comércio/fábricas)
  - [x] Criar métrica de "Satisfação de NPCs" por cidade (npcConsumptionService.js)
  - [x] Implementar migração automática de NPCs para cidades mais atrativas (updateCityPopulation)
  - [x] Criar cálculo de impacto de NPCs no lucro dos imóveis (calculateNPCImpactOnYields)
  - [x] Implementar alertas quando NPCs migram em massa (logs no job)

### 18.4 Marketplace Imobiliário (Real Estate P2P)
- [x] Criar modelo PropertyListing (Listagem de Imóveis)
  - [x] Campos: building_id, seller_id, price, status (ativo/vendido/cancelado)
  - [x] Criar repositório PropertyListingRepository
  - [x] Implementar relacionamento com Building e User
  - [x] Criar tabelas property_listings e property_transactions no schema.sql
- [x] Criar interface de compra/venda de imóveis
  - [x] Criar endpoint para listar imóveis à venda (GET /api/property-marketplace/listings)
  - [x] Implementar filtros (cidade, tipo, faixa de preço)
  - [x] Criar endpoint para criar listagem de venda (POST /api/property-marketplace/listings)
  - [x] Implementar endpoint para cancelar listagem (DELETE /api/property-marketplace/listings/:listingId)
- [x] Implementar sistema de Escritura Digital
  - [x] Alterar owner_id do Building ao realizar compra
  - [x] Transferir Valions automaticamente entre jogadores
  - [x] Calcular e cobrar taxa de corretagem (5%)
  - [x] Criar registro de transação imobiliária
  - [x] Implementar validações de segurança (saldo suficiente, edifício existe, etc.)
- [x] Implementar Histórico de Preços
  - [x] Gravar cada venda com preço e data
  - [x] Calcular valorização/depreciação por cidade (getCityPriceStats)
  - [x] Criar endpoint para consultar histórico de preços (GET /api/property-marketplace/transactions)
  - [x] Criar endpoint para estatísticas de valorização (GET /api/property-marketplace/cities/:cityId/stats)
  - [ ] Preparar estrutura para gráficos futuros de valorização (frontend)

### 18.5 Dinâmica de NPCs 2.0 (Vida Urbana)
- [x] Implementar Cálculo de Felicidade
  - [x] Calcular felicidade baseada em equilíbrio casas/empregos
  - [x] Cidades com mais equilíbrio geram mais impostos (bônus de felicidade)
  - [x] Criar métrica de "Qualidade de Vida" por cidade
  - [x] Implementar impacto da felicidade nos lucros dos imóveis (yield multiplier)
  - [x] Criar serviço urbanLifeService.js para métricas urbanas
  - [x] Criar endpoints para consultar qualidade de vida e felicidade
- [x] Implementar Sistema de Qualidade de Vida
  - [x] Calcular equilíbrio entre casas e empregos
  - [x] Calcular diversidade de tipos de edifícios
  - [x] Integrar com satisfação de NPCs (já implementado na FASE 18.3)
  - [x] Gerar recomendações para melhorar a cidade
- [x] Integração com Sistema Econômico
  - [x] Aplicar bônus de felicidade nos impostos (taxService.js)
  - [x] Aplicar bônus de felicidade nos yields (urbanEconomyService.js)
  - [x] Criar métricas urbanas completas (getCityUrbanMetrics)
- [x] Criar dashboard de métricas urbanas
  - [x] Criar componente UrbanMetricsDashboard.jsx
  - [x] Integrar ao CountryPanel para exibir métricas quando há edifícios
  - [x] Exibir qualidade de vida, felicidade, multiplicadores e recomendações
  - [x] Criar gráficos de fatores de qualidade de vida
  - [x] Adicionar seletor de cidade quando há múltiplas cidades
  - [x] Adicionar campo treasury_balance nas tabelas cities e states (schema.sql)
  - [x] Atualizar repositórios para suportar treasury_balance
- [x] Refatorar sistema de NPCs para hierarquia urbana
  - [x] NPCs devem ter homeBuilding vinculado a City
  - [x] NPCs devem ter workBuilding vinculado a City
  - [x] Garantir que home e work estejam na mesma cidade (ou cidades vizinhas)
  - [x] Atualizar schema SQL com campos cityId, stateId, homeBuildingId, workBuildingId
  - [x] Criar NPCRepository para Supabase
- [x] Implementar Rotinas de NPC
  - [x] Criar sistema de rotinas: Casa → Trabalho → Casa
  - [x] Implementar horários virtuais (dia/noite para NPCs) - ciclo de 24h em 2h reais
  - [x] NPCs retornam para casa após trabalho
  - [x] Criar estado "trabalhando" e "descansando" para NPCs
  - [x] Implementar estados: resting, going_to_work, working, going_home
  - [x] Criar npcService.js com lógica de rotinas
  - [x] Criar job npcRoutineJob.js para processar rotinas a cada 5 segundos
- [x] Implementar Movimento Intra-Urbano
  - [x] NPCs se movem preferencialmente dentro das ruas/áreas da cidade
  - [x] Respeitar fronteiras municipais (não cruzar para outra cidade sem motivo)
  - [x] Implementar detecção de colisão com fronteiras de cidade usando turf.booleanPointInPolygon
  - [x] Criar sistema de rotas urbanas otimizadas (createUrbanRoute)
  - [x] Implementar movimento ao longo da rota com validação de fronteiras
  - [x] Criar componente React NPCMarkers.jsx para renderizar NPCs
  - [x] Integrar NPCs no WorldMap (apenas em zoom >= 10 para performance)
  - [x] Criar rotas e controllers para NPCs
  - [x] Adicionar job de rotinas no server.js

### 18.6 UI/UX (Interface do Usuário)
- [x] Implementar Breadcrumbs de Localização
  - [x] Exibir hierarquia: Mundo > Brasil > São Paulo > Capital
  - [x] Criar componente BreadcrumbNavigation
  - [x] Implementar navegação clicável entre níveis
  - [x] Atualizar breadcrumbs dinamicamente ao navegar pelo mapa
  - [x] Integrar breadcrumbs no GamePage
- [x] Manter Indicador de Conexão sempre visível
  - [x] Garantir que bolinha de status "Conectado" esteja sempre visível
  - [x] Melhorar feedback visual de conexão/desconexão (animação pulse, cores)
  - [x] Adicionar tooltip com informações de conexão (hover para detalhes)
  - [x] Exibir tentativas de reconexão quando desconectado
- [x] Atualizar Modal de Construção
  - [x] Exibir custo específico da cidade selecionada (inclui land_value)
  - [x] Mostrar land_value atual da cidade
  - [x] Exibir previsão de retorno (ROI) em Valions (predictedYield)
  - [x] Mostrar métricas de atratividade da cidade
  - [x] Exibir informações de impostos (3% Prefeitura, 2% Estado, 5% Nacional)
  - [x] Carregar informações da cidade automaticamente quando cityId disponível
  - [x] Atualizar getBuildingCost para incluir land_value quando cityId fornecido
  - [x] Adicionar rotas para buscar cidade e estado por ID
- [x] Criar Interface de Marketplace Imobiliário
  - [x] Criar página/listagem de imóveis à venda (PropertyMarketplace.jsx)
  - [x] Implementar filtros e busca (por tipo, preço, cidade, texto)
  - [x] Criar modal de detalhes do imóvel (PropertyDetailsModal.jsx)
  - [x] Implementar processo de compra simplificado (com validação de saldo)
  - [x] Criar histórico de compras/vendas do jogador (PropertyHistory.jsx)
  - [x] Integrar marketplace no CountryPanel
- [x] Implementar Visualização de Hierarquia no Mapa
  - [x] Mostrar limites de estados quando zoom apropriado (StateBoundaries.jsx - zoom >= 6)
  - [x] Mostrar limites de cidades quando zoom alto (CityBoundaries.jsx - zoom >= 10)
  - [x] Visualizar lotes ocupados/vazios nas cidades (LotVisualization.jsx - zoom >= 12)
  - [x] Implementar cores diferentes para níveis administrativos (verde/laranja/vermelho para cidades)
  - [x] Criar legenda explicativa (MapLegend.jsx com informações de zoom e cores)
  - [x] Adicionar rota para buscar lotes de uma cidade

### 18.7 Otimização e Performance
- [x] Implementar Lazy Loading de GeoJSON
  - [x] Carregar estados apenas quando país é selecionado (StateBoundaries.jsx - zoom >= 6)
  - [x] Carregar cidades apenas quando estado é visualizado (CityBoundaries.jsx - zoom >= 10)
  - [x] Implementar cache inteligente no frontend (geoJsonCache.js com TTL de 5 minutos)
  - [x] Evitar carregar todas as cidades do mundo de uma vez (lazy loading por estado)
  - [x] Otimizar tamanho dos arquivos GeoJSON (carregamento sob demanda)
- [x] Otimizar Queries de Banco de Dados
  - [x] Criar índices em city_id, state_id, country_id (já existem no schema.sql)
  - [x] Otimizar queries de busca hierárquica (cache no backend)
  - [x] Implementar paginação para listagens de imóveis (PropertyMarketplace com page/limit)
  - [x] Cachear cálculos de land_value e yield (calculationCache.js criado)
- [x] Monitorar Performance
  - [x] Adicionar logs de tempo de carregamento de GeoJSON (performanceMonitor.js + logs no geoHierarchyService)
  - [x] Monitorar uso de memória com muitos polígonos (performanceMonitor.js)
  - [x] Testar performance com zoom in/out rápido (cache evita recarregamentos)
  - [x] Implementar debounce em operações de detecção de clique (debounce.js + mapClickUtils.js - 300ms)

---

## 🚀 FASE 19: ESTABILIZAÇÃO E "RESGATE" DO SISTEMA

### 19.1 Tratamento Global de Erros (Blindagem)
- [x] Backend: Global Error Middleware
  - [x] Implementar middleware de tratamento global de erros no Express
  - [x] Interceptar erros não tratados em rotas
  - [x] Retornar JSON de erro estruturado em vez de crashar o servidor
  - [x] Logar erros detalhados no backend para debug
  - [x] Tratar erros de banco de dados (Supabase) de forma elegante
- [x] Frontend: Error Boundaries
  - [x] Criar/atualizar ErrorBoundary para envolver o componente do Mapa (WorldMap)
  - [x] Criar/atualizar ErrorBoundary para envolver o Painel Lateral (CountryPanel)
  - [x] Implementar reset automático do componente em caso de erro
  - [x] Exibir mensagem amigável ao usuário em vez de tela preta
  - [x] Garantir que erro em um componente não quebre o jogo inteiro
- [x] Fallback de Dados
  - [x] Implementar fallback para API de NPCs (retornar array vazio [] se falhar)
  - [x] Implementar fallback para API de edifícios (retornar array vazio [] se falhar)
  - [x] Implementar fallback para API de geografia (retornar dados padrão se falhar)
  - [x] Garantir que o mapa continue funcionando mesmo com APIs offline

### 19.2 Otimização de Performance de Mapa (Canvas vs SVG)
- [x] Leaflet Canvas Renderer
  - [x] Ativar `preferCanvas: true` na configuração do Leaflet
  - [x] Verificar performance com muitos marcadores (1000+ NPCs)
  - [x] Verificar performance com muitos edifícios (centenas)
  - [x] Comparar uso de memória SVG vs Canvas
  - [x] Garantir que Canvas não quebre interatividade de popups/cliques
- [x] Throttling de Socket.io
  - [x] Implementar cálculo de Bounding Box do jogador atual
  - [x] Filtrar NPCs dentro do campo de visão (viewport) do mapa
  - [x] Enviar apenas NPCs visíveis via Socket.io
  - [x] Atualizar lista de NPCs quando jogador zoom/pana no mapa
  - [x] Reduzir payload de Socket.io de 1000+ objetos para apenas os visíveis
- [x] Web Workers para Turf.js
  - [x] Criar Web Worker para cálculos geográficos (pointInPolygon)
  - [x] Mover verificação "ponto dentro do polígono" para Web Worker
  - [x] Evitar que UI congele durante cálculos de clique no mapa
  - [x] Implementar comunicação assíncrona entre main thread e worker
  - [x] Testar performance com muitos cálculos simultâneos

### 19.3 Lógica de Negócio e Consistência (Database)
- [x] Integridade Referencial
  - [x] Criar script para limpar edifícios "órfãos" (sem cidade)
  - [x] Criar script para limpar NPCs "órfãos" (sem cidade)
  - [x] Validar referências antes de criar novos registros
  - [x] Implementar cleanup automático ou manual de dados inconsistentes
  - [x] Documentar processo de manutenção de integridade
- [x] Transações Atômicas
  - [x] Implementar transação para compra de imóvel (subtractBalance + update ownerId)
  - [x] Implementar transação para construção de edifício (subtractBalance + create building)
  - [x] Garantir rollback se qualquer parte da transação falhar
  - [x] Testar cenários de falha (saldo insuficiente, edifício já vendido, etc.)
  - [x] Documentar todas as operações que requerem transação

### 19.4 Monitoramento em Tempo Real para Debug
- [x] Painel de Debug de Admin
  - [x] Criar rota/admin de debug (protegida por autenticação)
  - [x] Mostrar quantidade de NPCs ativos no sistema
  - [x] Mostrar uso de memória do servidor (Node.js)
  - [x] Mostrar tempo de resposta médio do banco de dados
  - [x] Mostrar estatísticas de conexões Socket.io ativas
  - [x] Mostrar taxa de erros por endpoint (últimas 24h)
- [x] Log de Eventos no Frontend
  - [x] Criar componente de log de eventos (desenvolvimento apenas)
  - [x] Mostrar erros do Socket.io em tempo real
  - [x] Mostrar erros de API em tempo real
  - [x] Permitir toggle on/off do log (tecla de atalho)
  - [x] Limitar quantidade de logs exibidos (scroll automático)
  - [x] Filtrar logs por tipo (erro, warning, info)

**💡 Instruções Importantes:**
- **PRIORIZAR PERFORMANCE**: Ao implementar a FASE 18, sempre use Lazy Loading para GeoJSON
- **NÃO CARREGAR TUDO**: Nunca carregue todas as cidades do mundo de uma vez
- **CARREGAR SOB DEMANDA**: Carregue estados apenas quando país é clicado, cidades apenas quando zoom é alto no estado
- **CACHE INTELIGENTE**: Use cache no frontend para evitar requisições repetidas
- **TESTAR PERFORMANCE**: Sempre teste com zoom rápido e navegação intensa para garantir que não trave o navegador

---

**📌 NOTAS:**
- Marque cada item como concluído usando `[x]`
- Priorize o MVP primeiro
- Teste cada fase antes de avançar
- Documente decisões importantes
- Mantenha o código organizado e comentado

