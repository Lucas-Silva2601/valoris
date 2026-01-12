/**
 * ✅ FASE 19.4: Middleware para monitorar tempo de resposta do banco de dados
 */

import { recordDatabaseResponseTime } from '../services/monitoringService.js';

/**
 * Middleware para rastrear tempo de resposta de queries ao banco
 * Deve ser usado em rotas que fazem queries ao Supabase
 */
export const monitorDatabaseResponse = (req, res, next) => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.path}`;

  // Interceptar quando a resposta terminar
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    recordDatabaseResponseTime(endpoint, responseTime);
    return originalSend.call(this, data);
  };

  next();
};

