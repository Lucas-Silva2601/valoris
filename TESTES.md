# Guia de Testes - Valoris

## Estrutura de Testes

O projeto possui testes organizados em duas partes principais:

### Backend (`backend/__tests__/`)
- **Unitários**: Testes de funções e serviços isolados
- **Integração**: Testes de APIs e fluxos completos
- **Socket.io**: Testes de comunicação em tempo real
- **Performance**: Testes de otimização de queries

### Frontend (`frontend/src/__tests__/`)
- **Componentes**: Testes de componentes React
- **Hooks**: Testes de hooks customizados
- **Utils**: Testes de funções utilitárias
- **E2E**: Documentação para testes end-to-end

## Executar Testes

### Backend

```bash
cd backend
npm test              # Executar todos os testes
npm run test:watch   # Modo watch
npm run test:coverage # Com cobertura
```

### Frontend

```bash
cd frontend
npm test              # Executar todos os testes
npm run test:ui       # Interface gráfica
npm run test:coverage # Com cobertura
```

## Cobertura de Testes

### Backend
- ✅ Regras de negócio (`businessRules.test.js`)
- ✅ Serviços de dividendos (`dividendService.test.js`)
- ✅ Serviços de combate (`combatService.test.js`)
- ✅ Serviços de propriedade (`countryOwnershipService.test.js`)
- ✅ Validadores (`validators.test.js`)
- ✅ Middleware de validação (`validation.test.js`)
- ✅ Otimizador de queries (`queryOptimizer.test.js`)
- ✅ Jobs agendados (`dividendJob.test.js`)
- ✅ Socket.io (`socketHandler.test.js`)
- ✅ APIs de integração (`api.test.js`)

### Frontend
- ✅ Componente WalletDisplay (`WalletDisplay.test.jsx`)
- ✅ Hook useToast (`useToast.test.js`)
- ✅ Utilitários de geografia (`geography.test.js`)
- ✅ Performance do mapa (`mapPerformance.test.js`)

## Testes E2E

Para testes end-to-end completos, consulte `frontend/src/__tests__/e2e/README.md`.

Recomendamos usar Playwright ou Cypress para testes E2E completos.

## Notas Importantes

1. **Banco de Dados de Teste**: Configure um banco de dados separado para testes
2. **Variáveis de Ambiente**: Use `.env.test` para configurações de teste
3. **Mocks**: Use mocks para serviços externos e banco de dados
4. **Isolamento**: Cada teste deve ser independente e não depender de outros

## Próximos Passos

- [ ] Adicionar testes E2E com Playwright
- [ ] Aumentar cobertura de testes para >80%
- [ ] Adicionar testes de carga
- [ ] Implementar CI/CD com testes automáticos

