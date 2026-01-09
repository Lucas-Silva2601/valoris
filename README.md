# 🎮 Valoris - Simulador Geopolítico em Tempo Real

Valoris é um simulador geopolítico estratégico onde você pode investir em países, construir exércitos e conquistar territórios usando uma moeda virtual (VAL).

## 🚀 Características

- **Sistema Econômico**: Investa em países, compre ações e receba dividendos
- **Sistema Militar**: Crie unidades (tanques, navios, aviões) e conquiste territórios
- **Tempo Real**: Atualizações instantâneas via WebSocket
- **Mapa Interativo**: Visualize o mundo e interaja com países
- **Missões**: Conecte investidores e operacionais
- **Analytics**: Dashboard completo de métricas e monitoramento

## 📋 Pré-requisitos

- Node.js 20+
- MongoDB 7+
- npm ou yarn

## 🛠️ Instalação

### 1. Clonar Repositório

```bash
git clone <repository-url>
cd Valoris
```

### 2. Instalar Dependências

```bash
npm run install:all
```

### 3. Configurar Variáveis de Ambiente

**Backend:**
```bash
cd backend
cp .env.example .env
# Editar .env com suas configurações
```

**Frontend:**
```bash
cd frontend
cp env.example .env
# Editar .env com suas configurações
```

### 4. Iniciar MongoDB

```bash
# Localmente
mongod

# Ou usar Docker
docker run -d -p 27017:27017 mongo:7
```

### 5. Executar Aplicação

**Desenvolvimento:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse `http://localhost:5173` no navegador.

## 📚 Documentação

### Documentação Técnica
- [Arquitetura do Sistema](docs/ARQUITETURA.md)
- [Documentação da API](docs/API.md)
- [Estrutura do Banco de Dados](docs/BANCO_DE_DADOS.md)
- [Guia de Desenvolvimento](docs/GUIA_DESENVOLVIMENTO.md)

### Documentação de Usuário
- [Tutorial de Jogo](docs/TUTORIAL_JOGO.md)
- [Guia de Investimento](docs/GUIA_INVESTIMENTO.md)
- [Guia de Combate](docs/GUIA_COMBATE.md)
- [FAQ](docs/FAQ.md)

### Outros
- [Guia de Deploy](DEPLOY.md)
- [Guia de Testes](TESTES.md)
- [Analytics e Monitoramento](ANALYTICS.md)

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚀 Deploy

Consulte [DEPLOY.md](DEPLOY.md) para instruções completas de deploy.

## 🏗️ Estrutura do Projeto

```
Valoris/
├── backend/          # API Node.js/Express
├── frontend/         # Aplicação React
├── docs/             # Documentação
└── README.md         # Este arquivo
```

## 🛡️ Segurança

- Autenticação JWT
- Rate limiting
- Sanitização de inputs
- Proteção XSS
- CORS configurado
- Headers de segurança (Helmet)

## 📊 Monitoramento

- Health checks
- Métricas do sistema
- Analytics de jogo
- Logs estruturados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC.

## 👥 Autores

- Equipe Valoris

## 🙏 Agradecimentos

- Comunidade open source
- Contribuidores

---

**Desenvolvido com ❤️ para estratégia e diversão!**
