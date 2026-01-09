# 📊 Guia de Analytics e Monitoramento - Valoris

## Visão Geral

O sistema de analytics e monitoramento do Valoris permite rastrear eventos importantes do jogo e monitorar a saúde do sistema em tempo real.

## Analytics de Jogo

### Eventos Rastreados

O sistema rastreia os seguintes eventos:

- **player_login**: Login de jogador
- **player_logout**: Logout de jogador
- **investment_made**: Investimento em país
- **dividend_received**: Recebimento de dividendos
- **combat_started**: Início de combate
- **combat_ended**: Fim de combate
- **unit_created**: Criação de unidade militar
- **unit_moved**: Movimento de unidade
- **country_conquered**: Conquista de país
- **mission_created**: Criação de missão
- **mission_completed**: Conclusão de missão
- **treasury_updated**: Atualização do tesouro
- **economic_event**: Evento econômico

### Dashboard de Analytics

O dashboard exibe:

1. **Estatísticas Gerais**
   - Total de jogadores
   - Jogadores ativos (24h e 7 dias)
   - Total de transações
   - Total de combates

2. **Gráficos**
   - Jogadores ativos ao longo do tempo
   - Volume de transações
   - Top 5 países mais investidos

3. **Heatmap de Atividade**
   - Atividade por país
   - Atividade por hora do dia
   - Atividade por dia da semana

### Acessar Analytics

**Backend API:**
```bash
GET /api/analytics/stats              # Estatísticas gerais
GET /api/analytics/metrics/daily      # Métricas do dia
GET /api/analytics/metrics/period    # Métricas por período
GET /api/analytics/heatmap            # Heatmap de atividade
GET /api/analytics/events            # Eventos por tipo
```

**Frontend:**
- Componente: `AnalyticsDashboard`
- Rota: `/analytics` (requer autenticação e role admin)

## Monitoramento de Sistema

### Métricas Monitoradas

1. **Node.js**
   - Uso de memória (heap, RSS)
   - Uso de CPU
   - Uptime
   - Versão do Node.js

2. **Sistema Operacional**
   - Memória total e usada
   - Load average
   - Número de CPUs

3. **Banco de Dados (MongoDB)**
   - Versão do MongoDB
   - Conexões ativas
   - Uptime
   - Estatísticas de coleções
   - Tamanho dos índices

4. **Saúde do Sistema**
   - Status geral (healthy/warning/unhealthy)
   - Checks individuais:
     - Banco de dados
     - Memória
     - CPU

### Dashboard de Monitoramento

O dashboard exibe:

1. **Status Geral**
   - Indicador visual de saúde
   - Status de cada componente

2. **Métricas em Tempo Real**
   - Atualização automática a cada 30 segundos
   - Gráficos de uso de recursos
   - Alertas visuais para problemas

3. **Métricas do Banco de Dados**
   - Estatísticas de conexão
   - Tamanho das coleções
   - Performance de queries

### Acessar Monitoramento

**Backend API:**
```bash
GET /api/monitoring/health      # Saúde do sistema
GET /api/monitoring/system      # Métricas do sistema
GET /api/monitoring/database    # Métricas do banco
GET /api/monitoring/errors      # Logs de erro recentes
```

**Frontend:**
- Componente: `SystemHealthDashboard`
- Rota: `/monitoring` (requer autenticação e role admin)

## Jobs Agendados

### Job de Analytics

Executa diariamente às 23:59 para calcular métricas do dia anterior:

- Jogadores ativos
- Novos jogadores
- Transações totais
- Combates travados
- Investimentos por país
- Unidades criadas

## Integração com Serviços

### Tracking Automático

O sistema rastreia automaticamente eventos em:

- `countryOwnershipService.js` - Investimentos
- `combatService.js` - Combates
- `militaryUnitService.js` - Criação de unidades
- `authController.js` - Login de jogadores

### Adicionar Novo Evento

Para adicionar tracking de um novo evento:

```javascript
import { trackEvent } from '../services/analyticsService.js';

await trackEvent('novo_evento', {
  userId: userId.toString(),
  countryId: 'BRA',
  metadata: {
    // Dados específicos do evento
  }
});
```

## Logs Estruturados

O sistema usa logs estruturados através do `logger.js`:

- Níveis: `info`, `warn`, `error`, `debug`
- Formato JSON em produção
- Rotação automática de logs
- Integração com sistemas de monitoramento externos

## Alertas

### Alertas de Erro

- Erros são logados automaticamente
- Alertas visuais no dashboard
- Notificações para administradores (configurável)

### Alertas de Performance

- Uso de memória > 90%
- CPU > 80% por período prolongado
- Conexões do banco esgotadas
- Tempo de resposta > threshold

## Próximos Passos

- [ ] Integração com Sentry para error tracking
- [ ] Integração com Grafana para visualização avançada
- [ ] Alertas por email/Slack
- [ ] Métricas de performance de API
- [ ] Análise de comportamento do usuário

