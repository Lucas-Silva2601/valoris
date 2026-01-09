import { createLogger } from '../utils/logger.js';

const logger = createLogger('ErrorHandler');

/**
 * Middleware de tratamento de erros padronizado
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Erro capturado:', err.message, err.stack);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Erro de validação',
      details: errors
    });
  }

  // Erro de duplicação (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: `${field} já existe`
    });
  }

  // Erro de cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido'
    });
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
};

