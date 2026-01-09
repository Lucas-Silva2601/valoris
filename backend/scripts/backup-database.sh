#!/bin/bash

# Script de Backup do Banco de Dados
# Uso: ./scripts/backup-database.sh
# Configurar cron: 0 2 * * * /path/to/scripts/backup-database.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Carregar variáveis de ambiente
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Configurações
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/valoris_backup_$DATE.tar.gz"
RETENTION_DAYS=30

# Criar diretório de backups se não existir
mkdir -p $BACKUP_DIR

echo -e "${GREEN}💾 Iniciando backup do banco de dados...${NC}"

# Extrair nome do banco da URI do MongoDB
DB_NAME=$(echo $MONGODB_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_NAME" ]; then
    DB_NAME="valoris"
fi

# Fazer backup usando mongodump
if command -v mongodump &> /dev/null; then
    echo -e "${GREEN}📦 Criando dump do MongoDB...${NC}"
    
    # Criar diretório temporário
    TEMP_DIR=$(mktemp -d)
    
    # Executar mongodump
    mongodump --uri="$MONGODB_URI" --out="$TEMP_DIR"
    
    # Compactar backup
    echo -e "${GREEN}🗜️  Compactando backup...${NC}"
    tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .
    
    # Limpar diretório temporário
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  mongodump não encontrado. Instale MongoDB Tools.${NC}"
    exit 1
fi

# Limpar backups antigos
echo -e "${GREEN}🧹 Limpando backups antigos (mais de $RETENTION_DAYS dias)...${NC}"
find $BACKUP_DIR -name "valoris_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✅ Backup concluído!${NC}"

# Opcional: Enviar para S3 ou outro storage
# aws s3 cp "$BACKUP_FILE" s3://valoris-backups/

