#!/bin/bash

# Script de Setup Inicial para Produção
# Uso: ./scripts/setup-production.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Configurando ambiente de produção...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js não encontrado. Instale Node.js 20+ primeiro.${NC}"
    exit 1
fi

# Verificar MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB não encontrado. Certifique-se de que está instalado e rodando.${NC}"
fi

# Criar diretórios necessários
echo -e "${GREEN}📁 Criando diretórios...${NC}"
mkdir -p logs
mkdir -p backups
mkdir -p data

# Instalar dependências
echo -e "${GREEN}📦 Instalando dependências...${NC}"
npm ci --production

# Verificar arquivo .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.production não encontrado.${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo -e "${YELLOW}📝 Arquivo .env.production criado. Configure as variáveis antes de continuar!${NC}"
    fi
fi

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📦 Instalando PM2...${NC}"
    npm install -g pm2
fi

# Dar permissão de execução aos scripts
chmod +x scripts/*.sh

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo -e "  1. Configure .env.production com valores reais"
echo -e "  2. Execute: ./scripts/deploy.sh production"
echo -e "  3. Configure backup automático no cron"

