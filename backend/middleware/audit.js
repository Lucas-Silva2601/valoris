import { createLogger } from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';

const logger = createLogger('Audit');

/**
 * Middleware de auditoria para ações importantes
 */
export const auditMiddleware = async (req, res, next) => {
  // Capturar resposta original
  const originalSend = res.send;

  res.send = function(data) {
    // Registrar ação após resposta
    if (req.user && shouldAudit(req.path, req.method)) {
      logAction(req, res.statusCode, data).catch(err => {
        logger.error('Erro ao registrar auditoria:', err);
      });
    }

    // Chamar send original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Verificar se deve auditar a ação
 */
const shouldAudit = (path, method) => {
  // Auditar apenas ações importantes (POST, PUT, DELETE)
  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return false;
  }

  // Lista de rotas que devem ser auditadas
  const auditPaths = [
    '/api/ownership/buy',
    '/api/military/units',
    '/api/combat/initiate',
    '/api/treasury/',
    '/api/missions/',
    '/api/auth/register'
  ];

  return auditPaths.some(auditPath => path.includes(auditPath));
};

/**
 * Registrar ação no log de auditoria
 */
const logAction = async (req, resStatusCode, responseData) => {
  try {
    const auditLog = new AuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: `${req.method} ${req.path}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestBody: sanitizeRequestBody(req.body),
      statusCode: resStatusCode,
      timestamp: new Date()
    });

    await auditLog.save();
  } catch (error) {
    logger.error('Erro ao salvar log de auditoria:', error);
  }
};

/**
 * Sanitizar request body (remover senhas e tokens)
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
};

