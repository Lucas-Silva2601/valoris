#!/bin/bash

# Script de Deploy - Valoris Frontend
# Uso: ./scripts/deploy.sh [production|staging]

set -e  # Parar em caso de erro

ENVIRONMENT=${1:-production}
echo "🚀 Iniciando deploy do frontend para ambiente: $ENVIRONMENT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script a partir do diretório frontend${NC}"
    exit 1
fi

# Verificar se .env.production existe
if [ ! -f ".env.production" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.production não encontrado${NC}"
    echo "Criando a partir de env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env.production
        echo -e "${YELLOW}⚠️  ATENÇÃO: Configure as variáveis em .env.production antes de continuar!${NC}"
        exit 1
    fi
fi

# Instalar dependências
echo -e "${GREEN}📦 Instalando dependências...${NC}"
npm ci

# Executar testes (opcional)
# echo -e "${GREEN}🧪 Executando testes...${NC}"
# npm test

# Build de produção
echo -e "${GREEN}🔨 Construindo aplicação para produção...${NC}"
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Build falhou!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo -e "${GREEN}📁 Arquivos em: ./dist${NC}"
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "  1. Fazer upload da pasta 'dist' para seu servidor/CDN"
echo -e "  2. Configurar servidor web (Nginx/Apache) para servir os arquivos estáticos"
echo -e "  3. Configurar roteamento para SPA (todas as rotas -> index.html)"

