# 🚀 Guia Rápido de Deploy - Valoris

## Deploy Rápido

### Backend

```bash
cd backend
npm ci --production
cp .env.example .env.production
# Editar .env.production
pm2 start ecosystem.config.js --env production
```

### Frontend

```bash
cd frontend
npm ci
cp env.example .env.production
# Editar .env.production
npm run build
# Servir pasta dist/ com Nginx ou fazer upload para CDN
```

## Docker

```bash
# Backend
cd backend
docker build -t valoris-backend .
docker run -d -p 5000:5000 --env-file .env.production valoris-backend

# Frontend
cd frontend
docker build -t valoris-frontend --build-arg VITE_API_URL=https://api.example.com/api .
docker run -d -p 80:80 valoris-frontend
```

## Variáveis Críticas

**Backend (.env.production):**
- `MONGODB_URI` - URI do MongoDB
- `JWT_SECRET` - Secret forte para JWT
- `FRONTEND_URL` - URL do frontend
- `NODE_ENV=production`

**Frontend (.env.production):**
- `VITE_API_URL` - URL da API
- `VITE_SOCKET_URL` - URL do Socket.io

Para mais detalhes, consulte `DEPLOY.md`.

