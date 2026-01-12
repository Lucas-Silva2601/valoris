import { createLogger } from '../utils/logger.js';
import { recordEndpointError } from '../services/monitoringService.js';

const logger = createLogger('ErrorHandler');

/**
 * ✅ FASE 19.1: Middleware Global de Erros - "Pega-Tudo"
 * NUNCA deixa o servidor crashar. Sempre retorna JSON de erro estruturado.
 */
export const errorHandler = (err, req, res, next) => {
  try {
    // ✅ FASE 19.4: Registrar erro para monitoramento
    const endpoint = `${req.method} ${req.path}`;
    recordEndpointError(endpoint, err);

    // ✅ Log do erro de forma segura
    logger.error('Erro capturado pelo middleware global:', {
      message: err?.message || 'Erro desconhecido',
      stack: err?.stack,
      path: req?.path,
      method: req?.method,
      body: req?.body,
      query: req?.query
    });

    // ✅ Se a resposta já foi enviada, não tente enviar novamente
    if (res.headersSent) {
      logger.warn('Tentativa de enviar resposta após headers já enviados');
      return next(err);
    }

    // ✅ Erro de validação do Mongoose
    if (err?.name === 'ValidationError') {
      const errors = err.errors ? Object.values(err.errors).map(e => e.message) : [err.message];
      return res.status(400).json({
        error: 'Erro de validação',
        details: errors,
        type: 'VALIDATION_ERROR'
      });
    }

    // ✅ Erro de duplicação (unique constraint) - MongoDB/Mongoose
    if (err?.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'campo';
      return res.status(400).json({
        error: `${field} já existe`,
        type: 'DUPLICATE_ERROR'
      });
    }

    // ✅ Erro PGRST (Supabase PostgREST)
    if (err?.code === 'PGRST204' || err?.code === 'PGRST116' || err?.code === '23505') {
      return res.status(400).json({
        error: err.message || 'Erro na operação de banco de dados',
        type: 'DATABASE_ERROR'
      });
    }

    // ✅ Erro de cast (ID inválido)
    if (err?.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        type: 'INVALID_ID_ERROR'
      });
    }

    // ✅ Erro JWT
    if (err?.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        type: 'AUTH_ERROR'
      });
    }

    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        type: 'AUTH_ERROR'
      });
    }

    // ✅ Erro de conexão com banco de dados
    if (err?.message?.includes('Supabase') || err?.message?.includes('database') || err?.code?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
        type: 'DATABASE_CONNECTION_ERROR'
      });
    }

    // ✅ Erro padrão - NUNCA crasha o servidor
    const statusCode = err?.statusCode || err?.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : (err?.message || 'Erro desconhecido');

    res.status(statusCode).json({
      error: message,
      type: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err?.stack,
        details: err
      })
    });
  } catch (errorHandlerError) {
    // ✅ Se até o errorHandler falhar, usar fallback básico
    logger.error('ERRO CRÍTICO no errorHandler:', errorHandlerError);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro crítico no tratamento de erros',
        type: 'CRITICAL_ERROR'
      });
    }
  }
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

