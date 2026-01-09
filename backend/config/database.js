import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Variável global para controlar estado de conexão
let isConnected = false;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000; // 5 segundos

/**
 * ✅ Verificar se MongoDB está conectado
 */
export const checkConnection = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * ✅ Função de reconexão automática
 */
const attemptReconnect = async (mongoUri) => {
  if (isConnecting || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  isConnecting = true;
  reconnectAttempts++;

  console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    isConnecting = false;
    reconnectAttempts = 0;

    console.log(`✅ MongoDB reconectado: ${mongoose.connection.host}`);
    console.log(`📊 Banco de dados: ${mongoose.connection.name}`);

    // Executar seed após reconexão
    try {
      const { seedDatabase } = await import('../utils/seedDatabase.js');
      await seedDatabase();
    } catch (seedError) {
      console.warn('⚠️  Erro ao executar seed automático (não crítico):', seedError.message);
    }
  } catch (error) {
    isConnecting = false;
    console.error(`❌ Falha na reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}:`, error.message);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => attemptReconnect(mongoUri), RECONNECT_DELAY);
    } else {
      console.error(`❌ Máximo de tentativas de reconexão atingido. Modo offline ativado.`);
    }
  }
};

/**
 * ✅ Configurar listeners de eventos do Mongoose
 */
const setupMongooseListeners = (mongoUri) => {
  mongoose.connection.on('connected', () => {
    isConnected = true;
    reconnectAttempts = 0;
    console.log(`✅ MongoDB conectado: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (error) => {
    isConnected = false;
    console.error(`❌ Erro na conexão MongoDB:`, error.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn(`⚠️  MongoDB desconectado. Tentando reconectar...`);
    if (!isConnecting) {
      attemptReconnect(mongoUri);
    }
  });

  // Listener para erros de operação
  mongoose.connection.on('error', (error) => {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.error(`⏱️  Timeout de operação MongoDB. Verificando conexão...`);
      isConnected = false;
      if (!isConnecting) {
        attemptReconnect(mongoUri);
      }
    }
  });
};

/**
 * ✅ Função principal de conexão - NÃO TRAVA O SERVIDOR
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/valoris';

  // Configurar opções de conexão
  mongoose.set('bufferCommands', false); // Desabilitar buffering
  mongoose.set('bufferMaxEntries', 0); // Não bufferizar comandos

  // Configurar listeners
  setupMongooseListeners(mongoUri);

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    isConnected = true;
    reconnectAttempts = 0;

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Banco de dados: ${conn.connection.name}`);

    // ✅ Executar seed automático após conexão bem-sucedida
    try {
      const { seedDatabase } = await import('../utils/seedDatabase.js');
      await seedDatabase();
    } catch (seedError) {
      console.warn('⚠️  Erro ao executar seed automático (não crítico):', seedError.message);
    }
  } catch (error) {
    isConnected = false;
    
    // ✅ NÃO TRAVAR O SERVIDOR - Modo Offline
    console.error(`\n${'='.repeat(60)}`);
    console.error(`🔴 MODO OFFLINE ATIVADO`);
    console.error(`${'='.repeat(60)}`);
    console.error(`❌ MongoDB não está disponível: ${error.message}`);
    console.error(`\n💡 O servidor continuará rodando em modo offline.`);
    console.error(`💡 Funcionalidades que dependem do banco estarão limitadas.`);
    console.error(`\n📋 Para conectar ao MongoDB:`);
    console.error(`   • Verifique se o MongoDB está rodando: mongod`);
    console.error(`   • Ou use Docker: docker run -d -p 27017:27017 mongo:7`);
    console.error(`   • Ou configure MONGODB_URI no arquivo .env`);
    console.error(`\n🔄 O sistema tentará reconectar automaticamente a cada 5 segundos...`);
    console.error(`${'='.repeat(60)}\n`);

    // Tentar reconectar automaticamente
    setTimeout(() => attemptReconnect(mongoUri), RECONNECT_DELAY);
  }
};

export default connectDB;
// checkConnection já está exportado na linha 16

