#!/bin/bash

# Script de Deploy - Valoris Backend
# Uso: ./scripts/deploy.sh [production|staging]

set -e  # Parar em caso de erro

ENVIRONMENT=${1:-production}
echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script a partir do diretório backend${NC}"
    exit 1
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 não encontrado. Instalando...${NC}"
    npm install -g pm2
fi

# Verificar se .env.production existe
if [ ! -f ".env.production" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.production não encontrado${NC}"
    echo "Criando a partir de .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo -e "${YELLOW}⚠️  ATENÇÃO: Configure as variáveis em .env.production antes de continuar!${NC}"
        exit 1
    fi
fi

# Instalar dependências
echo -e "${GREEN}📦 Instalando dependências...${NC}"
npm ci --production

# Executar testes (opcional, descomente se quiser)
# echo -e "${GREEN}🧪 Executando testes...${NC}"
# npm test

# Criar diretório de logs se não existir
mkdir -p logs

# Parar aplicação existente (se estiver rodando)
echo -e "${GREEN}🛑 Parando aplicação existente...${NC}"
pm2 stop valoris-backend || true
pm2 delete valoris-backend || true

# Iniciar aplicação com PM2
echo -e "${GREEN}▶️  Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js --env $ENVIRONMENT

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot (opcional)
# pm2 startup
# pm2 save

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}📊 Status: pm2 status${NC}"
echo -e "${GREEN}📋 Logs: pm2 logs valoris-backend${NC}"
echo -e "${GREEN}🔄 Restart: pm2 restart valoris-backend${NC}"

