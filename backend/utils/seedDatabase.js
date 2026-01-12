import { createLogger } from './logger.js';
import { checkConnection } from '../config/supabase.js';
import walletRepository from '../repositories/walletRepository.js';

const logger = createLogger('SeedDatabase');


/**
 * ✅ Função de Auto-Seed para dados de teste
 * Executada automaticamente após conexão com MongoDB
 */
export const seedDatabase = async () => {
  try {
    logger.info('🌱 Iniciando seed automático do banco de dados...');

    // Verificar se Supabase está conectado
    if (!checkConnection()) {
      logger.warn('⚠️  Supabase não está conectado. Seed não será executado.');
      return { success: false, message: 'Supabase não conectado' };
    }

    // 1. ✅ GARANTIR SALDO DE 100.000 VAL PARA USUÁRIO DE TESTE
    const testUserId = 'test-user-id';
    
    let wallet = await walletRepository.findByUserId(testUserId);
    
    if (!wallet) {
      // Criar carteira com saldo inicial
      wallet = await walletRepository.create({
        user_id: testUserId,
        balance: 100000,
        total_earned: 100000,
        total_spent: 0
      });
      logger.info(`💰 Carteira criada para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else if (parseFloat(wallet.balance) < 100000) {
      // Garantir saldo mínimo de 100.000 VAL
      const amountToAdd = 100000 - parseFloat(wallet.balance);
      wallet = await walletRepository.update(wallet.id, {
        balance: 100000,
        total_earned: parseFloat(wallet.total_earned || 0) + amountToAdd
      });
      logger.info(`💰 Saldo garantido para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else {
      logger.info(`💰 Usuário de teste já possui saldo suficiente: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    }


    logger.info('✅ Seed automático concluído com sucesso!');
    return { success: true, walletBalance: wallet.balance };
  } catch (error) {
    logger.error('❌ Erro no seed automático:', error);
    throw error;
  }
};

