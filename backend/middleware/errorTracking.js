/**
 * ✅ FASE 19.4: Middleware para rastrear erros por endpoint
 */

import { recordEndpointError } from '../services/monitoringService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ErrorTracking');

/**
 * Middleware para rastrear erros em endpoints
 */
export const trackEndpointErrors = (err, req, res, next) => {
  const endpoint = `${req.method} ${req.path}`;
  
  // Registrar erro
  recordEndpointError(endpoint, err);
  
  // Continuar com o próximo handler de erro
  next(err);
};

/**
 * Middleware para rastrear erros 4xx e 5xx
 */
export const trackHTTPErrors = (req, res, next) => {
  const originalSend = res.send;
  const endpoint = `${req.method} ${req.path}`;

  res.send = function(statusCode, data) {
    // Se for erro HTTP (4xx ou 5xx)
    if (res.statusCode >= 400) {
      const error = {
        message: `HTTP ${res.statusCode}`,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method
      };
      recordEndpointError(endpoint, error);
    }

    return originalSend.call(this, statusCode, data);
  };

  next();
};

