import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger.js';

dotenv.config();

const logger = createLogger('Supabase');

// ✅ Variável global para controlar estado de conexão
let isConnected = false;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000; // 5 segundos

// Cliente Supabase
let supabase = null;

/**
 * ✅ Verificar se Supabase está conectado
 */
export const checkConnection = () => {
  return isConnected && supabase !== null;
};

/**
 * ✅ Obter cliente Supabase
 */
export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não está conectado. Chame connectDB() primeiro.');
  }
  return supabase;
};

/**
 * ✅ Função de reconexão automática
 */
const attemptReconnect = async () => {
  if (isConnecting || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  isConnecting = true;
  reconnectAttempts++;

  logger.info(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Testar conexão
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok na primeira vez)
      throw error;
    }

    isConnected = true;
    isConnecting = false;
    reconnectAttempts = 0;

    logger.info(`✅ Supabase reconectado`);
    logger.info(`📊 Projeto: ${supabaseUrl}`);

    // Executar seed após reconexão
    try {
      const { seedDatabase } = await import('../utils/seedDatabase.js');
      await seedDatabase();
    } catch (seedError) {
      logger.warn('⚠️  Erro ao executar seed automático (não crítico):', seedError.message);
    }
  } catch (error) {
    isConnecting = false;
    logger.error(`❌ Falha na reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}:`, error.message);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => attemptReconnect(), RECONNECT_DELAY);
    } else {
      logger.error(`❌ Máximo de tentativas de reconexão atingido. Modo offline ativado.`);
    }
  }
};

/**
 * ✅ Função principal de conexão - NÃO TRAVA O SERVIDOR
 */
const connectDB = async (skipAutoSeed = false) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.error(`\n${'='.repeat(60)}`);
    logger.error(`🔴 CONFIGURAÇÃO INCOMPLETA`);
    logger.error(`${'='.repeat(60)}`);
    logger.error(`❌ Variáveis de ambiente do Supabase não configuradas!`);
    logger.error(`\n📋 Configure no arquivo .env:`);
    logger.error(`   SUPABASE_URL=https://seu-projeto.supabase.co`);
    logger.error(`   SUPABASE_ANON_KEY=sua-chave-anon`);
    logger.error(`   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role (opcional, para operações admin)`);
    logger.error(`\n💡 O servidor continuará rodando em modo offline.`);
    logger.error(`${'='.repeat(60)}\n`);
    return;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey);

    // Testar conexão
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok na primeira vez)
      throw error;
    }

    isConnected = true;
    reconnectAttempts = 0;

    logger.info(`✅ Supabase conectado`);
    logger.info(`📊 Projeto: ${supabaseUrl}`);

    // ✅ Executar seed automático após conexão bem-sucedida (se não for skipado)
    if (!skipAutoSeed && !process.env.SKIP_AUTO_SEED) {
      try {
        const { seedDatabase } = await import('../utils/seedDatabase.js');
        await seedDatabase();
      } catch (seedError) {
        logger.warn('⚠️  Erro ao executar seed automático (não crítico):', seedError.message);
      }
    }
  } catch (error) {
    isConnected = false;
    
    // ✅ NÃO TRAVAR O SERVIDOR - Modo Offline
    logger.error(`\n${'='.repeat(60)}`);
    logger.error(`🔴 MODO OFFLINE ATIVADO`);
    logger.error(`${'='.repeat(60)}`);
    logger.error(`❌ Supabase não está disponível: ${error.message}`);
    logger.error(`\n💡 O servidor continuará rodando em modo offline.`);
    logger.error(`💡 Funcionalidades que dependem do banco estarão limitadas.`);
    logger.error(`\n📋 Para conectar ao Supabase:`);
    logger.error(`   • Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env`);
    logger.error(`   • Execute o schema SQL no Supabase (veja backend/config/schema.sql)`);
    logger.error(`\n🔄 O sistema tentará reconectar automaticamente a cada 5 segundos...`);
    logger.error(`${'='.repeat(60)}\n`);

    // Tentar reconectar automaticamente
    setTimeout(() => attemptReconnect(), RECONNECT_DELAY);
  }
};

/**
 * ✅ Inicializar cliente manualmente (sem seed automático)
 */
export const initializeSupabase = async () => {
  return await connectDB(true); // skipAutoSeed = true
};

export default connectDB;

