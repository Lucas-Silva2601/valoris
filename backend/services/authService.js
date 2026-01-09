import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import PlayerProfile from '../models/PlayerProfile.js';
import { getOrCreateWallet } from './walletService.js';

/**
 * Registrar novo usuário
 */
export const registerUser = async (username, email, password, role = 'investor') => {
  // Verificar se usuário já existe
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new Error('Usuário ou email já existe');
  }

  // Hash da senha
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Criar usuário
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role
  });

  await user.save();

  // Criar carteira
  const wallet = await getOrCreateWallet(user._id);

  // Atualizar referência da carteira no usuário
  user.wallet = wallet._id;
  await user.save();

  // Criar perfil de jogador
  const profile = new PlayerProfile({
    userId: user._id,
    role
  });
  await profile.save();

  // Gerar token JWT
  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  };
};

/**
 * Login de usuário
 */
export const loginUser = async (email, password) => {
  // Buscar usuário
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Email ou senha inválidos');
  }

  // Verificar senha
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Email ou senha inválidos');
  }

  // Atualizar último login
  user.lastLogin = new Date();
  await user.save();

  // Gerar token JWT
  const token = generateToken(user);

  // Registrar evento de login
  try {
    const { trackEvent } = await import('./analyticsService.js');
    await trackEvent('player_login', {
      userId: user._id.toString(),
      metadata: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.warn('Erro ao registrar evento de login:', error);
  }

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  };
};

/**
 * Gerar token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verificar token JWT
 */
export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

/**
 * Obter usuário por ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  return user;
};

