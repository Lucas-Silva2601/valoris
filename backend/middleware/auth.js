import { verifyToken, getUserById } from '../services/authService.js';

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Por enquanto, permitir userId no header para compatibilidade
      const userId = req.headers['user-id'];
      if (userId) {
        req.user = {
          id: userId,
          username: req.headers['username'] || 'user'
        };
        return next();
      }
      
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuário
    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

/**
 * Middleware para verificar role específica
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
};
