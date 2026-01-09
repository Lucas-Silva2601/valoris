# Guia de Deploy - Valoris

## 📋 Pré-requisitos

- Node.js 20+
- MongoDB 7+
- PM2 (para gerenciamento de processos)
- Nginx (opcional, para reverse proxy)
- Certificado SSL (Let's Encrypt recomendado)

## 🚀 Deploy Backend

### 1. Preparação

```bash
cd backend

# Instalar dependências
npm ci --production

# Configurar variáveis de ambiente
cp .env.example .env.production
# Editar .env.production com valores reais
```

### 2. Usando PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

### 3. Usando Docker

```bash
# Build da imagem
docker build -t valoris-backend .

# Executar container
docker run -d \
  --name valoris-backend \
  -p 5000:5000 \
  --env-file .env.production \
  valoris-backend
```

### 4. Usando Docker Compose

```bash
cd backend/config
docker-compose up -d
```

## 🎨 Deploy Frontend

### 1. Build de Produção

```bash
cd frontend

# Configurar variáveis de ambiente
cp env.example .env.production
# Editar .env.production

# Build
npm ci
npm run build
```

### 2. Servir com Nginx

Copiar conteúdo de `dist/` para `/usr/share/nginx/html/` e configurar Nginx conforme `backend/config/nginx.conf`.

### 3. Deploy em Vercel/Netlify

```bash
# Vercel
npm install -g vercel
vercel --prod

# Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🔒 Configuração SSL

### Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d valoris.example.com -d www.valoris.example.com

# Renovação automática
sudo certbot renew --dry-run
```

## 💾 Backup do Banco de Dados

### Backup Automático

```bash
# Configurar cron job (diário às 2h)
0 2 * * * /path/to/backend/scripts/backup-database.sh
```

### Backup Manual

```bash
cd backend
./scripts/backup-database.sh
```

### Restaurar Backup

```bash
cd backend
./scripts/restore-database.sh backups/valoris_backup_YYYYMMDD_HHMMSS.tar.gz
```

## 📊 Monitoramento

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs valoris-backend

# Monitoramento em tempo real
pm2 monit

# Métricas
pm2 describe valoris-backend
```

### Health Check

```bash
# Verificar saúde da API
curl https://api.valoris.example.com/api/health
```

## 🔄 CI/CD com GitHub Actions

O projeto inclui workflow do GitHub Actions (`.github/workflows/deploy.yml`) que:

1. Executa testes automaticamente
2. Faz build do backend e frontend
3. Cria imagens Docker
4. Faz deploy (configurar secrets no GitHub)

### Configurar Secrets

No GitHub: Settings → Secrets → Actions, adicionar:

- `VITE_API_URL`: URL da API de produção
- `MONGODB_URI`: URI do MongoDB de produção
- `JWT_SECRET`: Secret JWT
- Outras variáveis necessárias

## 🌐 Configuração de Domínio

1. Configurar DNS apontando para IP do servidor
2. Configurar Nginx com domínio
3. Obter certificado SSL
4. Atualizar variáveis de ambiente com URLs de produção

## 🛡️ Segurança em Produção

### Checklist de Segurança

- [ ] Todas as senhas alteradas de valores padrão
- [ ] JWT_SECRET forte e único
- [ ] HTTPS configurado e funcionando
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (Helmet) ativos
- [ ] Sanitização de inputs ativa
- [ ] Logs configurados
- [ ] Backups automáticos configurados
- [ ] Firewall configurado
- [ ] Apenas portas necessárias abertas

## 📝 Variáveis de Ambiente Importantes

### Backend (.env.production)

```env
NODE_ENV=production
MONGODB_URI=mongodb://...
JWT_SECRET=strong-secret-here
FRONTEND_URL=https://valoris.example.com
ALLOWED_ORIGINS=https://valoris.example.com
```

### Frontend (.env.production)

```env
VITE_API_URL=https://api.valoris.example.com/api
VITE_SOCKET_URL=https://api.valoris.example.com
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs valoris-backend

# Verificar variáveis de ambiente
pm2 env 0

# Reiniciar
pm2 restart valoris-backend
```

### Erro de conexão com MongoDB

- Verificar se MongoDB está rodando
- Verificar URI de conexão
- Verificar firewall/portas

### Erro de CORS

- Verificar `FRONTEND_URL` e `ALLOWED_ORIGINS`
- Verificar configuração do Nginx

## 📚 Recursos Adicionais

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)

