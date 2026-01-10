import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import connectDB from '../../config/supabase.js';

// Configurar app de teste
const app = express();
app.use(express.json());

// Importar rotas
import authRoutes from '../../routes/auth.js';
app.use('/api/auth', authRoutes);

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Conectar ao banco de teste
    // await connectDB();
  });

  afterAll(async () => {
    // Fechar conexão
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar novo usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'investor'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('deve rejeitar registro com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // Muito curto
          email: 'invalid-email',
          password: '123' // Muito curto
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Primeiro registrar
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123'
        });

      // Depois fazer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});

