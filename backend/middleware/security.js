/**
 * Middleware de segurança para produção
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

/**
 * Rate limiting para APIs
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por window
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting mais restritivo para autenticação
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

/**
 * Configuração do Helmet para segurança de headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * Sanitização de dados MongoDB
 */
export const mongoSanitizeConfig = mongoSanitize();

/**
 * Proteção XSS
 */
export const xssProtection = xss();

/**
 * Proteção contra HTTP Parameter Pollution
 */
export const hppProtection = hpp();

/**
 * Validar origem das requisições
 */
export const validateOrigin = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.origin;

  if (process.env.NODE_ENV === 'production') {
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'Origem não permitida' });
    }
  }

  next();
};

/**
 * Log de requisições suspeitas
 */
export const suspiciousActivityLogger = (req, res, next) => {
  // Detectar padrões suspeitos
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union.*select/i,
    /drop.*table/i,
  ];

  const bodyString = JSON.stringify(req.body);
  const queryString = JSON.stringify(req.query);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyString) || pattern.test(queryString)) {
      console.warn(`⚠️  Atividade suspeita detectada de ${req.ip}:`, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
      break;
    }
  }

  next();
};

