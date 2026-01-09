import rateLimit from 'express-rate-limit';

/**
 * Rate limiter geral
 */
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // 100 requisições
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para autenticação (mais restritivo)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true
});

/**
 * Rate limiter para ações críticas (muito restritivo)
 */
export const criticalActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 ações por minuto
  message: {
    error: 'Muitas ações. Aguarde um momento.'
  }
});

