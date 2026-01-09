import Wallet from '../models/Wallet.js';
import NPC from '../models/NPC.js';
import { createLogger } from './logger.js';

const logger = createLogger('SeedDatabase');

// ✅ Cores de pele diversificadas (tons de marrom, bege e bronze)
const SKIN_COLORS = [
  '#8d5524', '#c68642', '#e0ac69', '#f1c27d',
  '#ffdbac', '#c68642', '#9d7a5a', '#6b4e3d',
  '#5c4a3a', '#7a5c42', '#a6896d', '#b8916d'
];

/**
 * ✅ Função de Auto-Seed para dados de teste
 * Executada automaticamente após conexão com MongoDB
 */
export const seedDatabase = async () => {
  try {
    logger.info('🌱 Iniciando seed automático do banco de dados...');

    // 1. ✅ GARANTIR SALDO DE 100.000 VAL PARA USUÁRIO DE TESTE
    const testUserId = 'test-user-id';
    
    let wallet = await Wallet.findOne({ userId: testUserId });
    
    if (!wallet) {
      // Criar carteira com saldo inicial
      wallet = new Wallet({
        userId: testUserId,
        balance: 100000,
        totalEarned: 100000,
        totalSpent: 0
      });
      await wallet.save();
      logger.info(`💰 Carteira criada para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else if (wallet.balance < 100000) {
      // Garantir saldo mínimo de 100.000 VAL
      const amountToAdd = 100000 - wallet.balance;
      wallet.balance = 100000;
      wallet.totalEarned += amountToAdd;
      await wallet.save();
      logger.info(`💰 Saldo garantido para usuário de teste: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    } else {
      logger.info(`💰 Usuário de teste já possui saldo suficiente: ${wallet.balance.toLocaleString('pt-BR')} VAL`);
    }

    // 2. ✅ CRIAR NPCs SE A COLEÇÃO ESTIVER VAZIA
    const npcCount = await NPC.countDocuments();
    
    if (npcCount === 0) {
      logger.info('👥 Criando 50 NPCs iniciais...');
      
      const npcsToCreate = [];
      const countries = [
        { id: 'BRA', name: 'Brasil', center: { lat: -14.2350, lng: -51.9253 } },
        { id: 'USA', name: 'Estados Unidos', center: { lat: 37.0902, lng: -95.7129 } },
        { id: 'CHN', name: 'China', center: { lat: 35.8617, lng: 104.1954 } },
        { id: 'IND', name: 'Índia', center: { lat: 20.5937, lng: 78.9629 } },
        { id: 'RUS', name: 'Rússia', center: { lat: 61.5240, lng: 105.3188 } },
        { id: 'DEU', name: 'Alemanha', center: { lat: 51.1657, lng: 10.4515 } },
        { id: 'FRA', name: 'França', center: { lat: 46.2276, lng: 2.2137 } },
        { id: 'GBR', name: 'Reino Unido', center: { lat: 55.3781, lng: -3.4360 } },
        { id: 'JPN', name: 'Japão', center: { lat: 36.2048, lng: 138.2529 } },
        { id: 'MEX', name: 'México', center: { lat: 23.6345, lng: -102.5528 } }
      ];

      const names = [
        'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia',
        'Lucas', 'Fernanda', 'Rafael', 'Mariana', 'Gabriel', 'Beatriz',
        'Thiago', 'Camila', 'Felipe', 'Isabela', 'Bruno', 'Larissa',
        'Ricardo', 'Patricia', 'André', 'Juliana', 'Rodrigo', 'Vanessa'
      ];

      // Criar 50 NPCs distribuídos pelos países
      for (let i = 0; i < 50; i++) {
        const country = countries[i % countries.length];
        const randomOffsetLat = (Math.random() - 0.5) * 10; // ~10 graus de variação
        const randomOffsetLng = (Math.random() - 0.5) * 10;
        
        const npcId = `npc_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomSkinColor = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)];
        
        npcsToCreate.push({
          npcId,
          name: randomName,
          countryId: country.id,
          countryName: country.name,
          position: {
            lat: country.center.lat + randomOffsetLat,
            lng: country.center.lng + randomOffsetLng
          },
          skinColor: randomSkinColor,
          currentTask: 'idle',
          status: 'idle',
          npcType: Math.random() > 0.5 ? 'resident' : 'worker',
          speed: 5,
          direction: Math.random() * 360,
          lastMovementTime: new Date(),
          nextActionTime: new Date(Date.now() + (30000 + Math.random() * 90000))
        });
      }

      // Inserir todos os NPCs de uma vez (mais eficiente)
      await NPC.insertMany(npcsToCreate);
      logger.info(`✅ ${npcsToCreate.length} NPCs criados com sucesso!`);
    } else {
      logger.info(`👥 Já existem ${npcCount} NPCs no banco de dados`);
    }

    logger.info('✅ Seed automático concluído com sucesso!');
    return { success: true, walletBalance: wallet.balance, npcCount: await NPC.countDocuments() };
  } catch (error) {
    logger.error('❌ Erro no seed automático:', error);
    throw error;
  }
};

