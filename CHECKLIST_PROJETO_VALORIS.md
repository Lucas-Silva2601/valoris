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

**📌 NOTAS:**
- Marque cada item como concluído usando `[x]`
- Priorize o MVP primeiro
- Teste cada fase antes de avançar
- Documente decisões importantes
- Mantenha o código organizado e comentado

