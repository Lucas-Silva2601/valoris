import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
// Usar Supabase em vez de MongoDB
import connectDB from './config/supabase.js';
import { startDividendJob } from './jobs/dividendJob.js';
import { startMovementAndCombatJobs } from './jobs/unitMovementJob.js';
import { startEconomicHealthJob } from './jobs/economicHealthJob.js';
import { startRepairJob } from './jobs/repairJob.js';
import { startAnalyticsJob } from './jobs/analyticsJob.js';
import { startNPCMovementJob } from './jobs/npcMovementJob.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { auditMiddleware } from './middleware/audit.js';
import { createLogger } from './utils/logger.js';
import countriesRoutes from './routes/countries.js';
import walletRoutes from './routes/wallet.js';
import ownershipRoutes from './routes/ownership.js';
import dividendsRoutes from './routes/dividends.js';
import treasuryRoutes from './routes/treasury.js';
import economicRoutes from './routes/economic.js';
import militaryRoutes from './routes/military.js';
import combatRoutes from './routes/combat.js';
import defenseRoutes from './routes/defense.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import missionRoutes from './routes/missions.js';
import analyticsRoutes from './routes/analytics.js';
import monitoringRoutes from './routes/monitoring.js';
import marketRoutes from './routes/market.js';
import buildingsRoutes from './routes/buildings.js';
import npcsRoutes from './routes/npcs.js';
import adminRoutes from './routes/admin.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

// Carregar variáveis de ambiente
dotenv.config();

// Criar instância do logger
const logger = createLogger('Server');

const app = express();
const httpServer = createServer(app);

// ✅ CONFIGURAÇÃO DEFINITIVA DO SOCKET.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'username']
  },
  transports: ['websocket', 'polling'], // Permitir ambos para compatibilidade
  allowEIO3: true // Compatibilidade com versões antigas
});

// Middleware de segurança (apenas em produção)
if (process.env.NODE_ENV === 'production') {
  try {
    const securityModule = await import('./middleware/security.js');
    
    app.use(securityModule.helmetConfig);
    app.use(securityModule.mongoSanitizeConfig);
    app.use(securityModule.xssProtection);
    app.use(securityModule.hppProtection);
    app.use(securityModule.validateOrigin);
    app.use(securityModule.suspiciousActivityLogger);
    
    logger.info('✅ Middlewares de segurança ativados');
  } catch (error) {
    logger.warn('⚠️  Erro ao carregar middlewares de segurança:', error.message);
  }
}

// ✅ CONFIGURAÇÃO DEFINITIVA DO CORS - PORTAS 5173 (Frontend) e 3001 (Backend)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'username', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Para navegadores antigos
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Auditoria
app.use(auditMiddleware);

// ✅ Conectar ao banco de dados (NÃO TRAVA O SERVIDOR SE FALHAR)
import { checkConnection } from './config/supabase.js';

connectDB().then(async () => {
  // Iniciar jobs agendados apenas se banco estiver conectado
  if (checkConnection()) {
    startDividendJob();
    startMovementAndCombatJobs();
    startEconomicHealthJob();
    startRepairJob();
    startAnalyticsJob();
    startNPCMovementJob();
    logger.info('✅ Todos os jobs agendados iniciados');
  } else {
    logger.warn('⚠️  Jobs não iniciados - Supabase não está conectado (Modo Offline)');
  }
}).catch((error) => {
  // ✅ Servidor continua rodando mesmo se conexão falhar
  logger.warn('⚠️  Servidor iniciado em Modo Offline. Supabase não disponível.');
  logger.warn('💡 O sistema tentará reconectar automaticamente.');
});

// Rotas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Valoris API - Servidor funcionando!',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
app.use('/api/countries', countriesRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ownership', ownershipRoutes);
app.use('/api/dividends', dividendsRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/economic', economicRoutes);
app.use('/api/military', militaryRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/defense', defenseRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/npcs', npcsRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(notFoundHandler);
app.use(errorHandler);

// Configurar handlers do Socket.io
setupSocketHandlers(io);

// ✅ Iniciar servidor na porta 3001
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Socket.io configurado e pronto`);
  console.log(`🌐 CORS configurado para: http://localhost:5173`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
});

export { io };

