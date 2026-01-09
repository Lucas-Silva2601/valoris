import * as authService from '../services/authService.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const result = await authService.registerUser(username, email, password, role || 'investor');

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      ...result
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

