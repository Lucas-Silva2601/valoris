#!/bin/bash

# Script de Restauração do Banco de Dados
# Uso: ./scripts/restore-database.sh [arquivo_backup.tar.gz]

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Erro: Especifique o arquivo de backup${NC}"
    echo "Uso: ./scripts/restore-database.sh [arquivo_backup.tar.gz]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo de backup não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá substituir todos os dados do banco!${NC}"
read -p "Tem certeza que deseja continuar? (digite 'sim' para confirmar): " confirm

if [ "$confirm" != "sim" ]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)

echo -e "${GREEN}📦 Extraindo backup...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Encontrar diretório do dump
DUMP_DIR=$(find "$TEMP_DIR" -type d -name "valoris*" | head -1)

if [ -z "$DUMP_DIR" ]; then
    DUMP_DIR="$TEMP_DIR"
fi

# Restaurar usando mongorestore
if command -v mongorestore &> /dev/null; then
    echo -e "${GREEN}🔄 Restaurando banco de dados...${NC}"
    mongorestore --uri="$MONGODB_URI" --drop "$DUMP_DIR"
    
    echo -e "${GREEN}✅ Restauração concluída!${NC}"
else
    echo -e "${RED}❌ mongorestore não encontrado. Instale MongoDB Tools.${NC}"
    exit 1
fi

# Limpar diretório temporário
rm -rf "$TEMP_DIR"

