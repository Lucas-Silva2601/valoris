import propertyListingRepository from '../repositories/propertyListingRepository.js';
import propertyTransactionRepository from '../repositories/propertyTransactionRepository.js';
import buildingRepository from '../repositories/buildingRepository.js';
import { getOrCreateWallet, addBalance, subtractBalance } from './walletService.js';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('PropertyMarketplaceService');

/**
 * ✅ FASE 18.4: Serviço de Marketplace Imobiliário
 * Gerencia compra/venda de imóveis entre jogadores
 */

const BROKER_FEE_RATE = 0.05; // 5% de taxa de corretagem

/**
 * Criar listagem de imóvel à venda
 */
export const createListing = async (buildingId, sellerId, price, description = null) => {
  try {
    // Verificar se edifício existe e pertence ao vendedor
    const building = await buildingRepository.findByBuildingId(buildingId);
    if (!building) {
      throw new Error(`Edifício ${buildingId} não encontrado`);
    }

    if (building.ownerId !== sellerId && building.owner_id !== sellerId) {
      throw new Error('Você não é o proprietário deste edifício');
    }

    // Verificar se já existe listagem ativa para este edifício
    const existingListing = await propertyListingRepository.findActiveByBuildingId(buildingId);
    if (existingListing) {
      throw new Error('Este edifício já está listado para venda');
    }

    // Validar preço
    if (!price || price <= 0) {
      throw new Error('Preço deve ser maior que zero');
    }

    // Criar listagem
    const listingId = `listing_${uuidv4()}`;
    const listing = await propertyListingRepository.create({
      listingId,
      buildingId: building.id,
      sellerId,
      price: parseFloat(price),
      status: 'active',
      description: description || `Edifício ${building.type} nível ${building.level} em ${building.cityName || building.countryName}`
    });

    logger.info(`📋 Listagem criada: ${listingId} - Edifício ${buildingId} por ${price} VAL`);

    return listing;
  } catch (error) {
    logger.error(`Erro ao criar listagem:`, error);
    throw error;
  }
};

/**
 * Listar imóveis à venda com filtros
 */
export const getActiveListings = async (filters = {}) => {
  try {
    // ✅ FASE 18.7: Adicionar page e limit aos filtros se não existirem
    if (!filters.page) filters.page = 1;
    if (!filters.limit) filters.limit = 50;
    
    const result = await propertyListingRepository.findActive(filters);
    // ✅ FASE 18.7: Retornar resultado (já vem com paginação do repository)
    return result;
  } catch (error) {
    logger.error('Erro ao buscar listagens:', error);
    throw error;
  }
};

/**
 * Cancelar listagem
 */
export const cancelListing = async (listingId, sellerId) => {
  try {
    const listing = await propertyListingRepository.findByListingId(listingId);
    if (!listing) {
      throw new Error(`Listagem ${listingId} não encontrada`);
    }

    if (listing.sellerId !== sellerId && listing.seller_id !== sellerId) {
      throw new Error('Você não é o vendedor desta listagem');
    }

    if (listing.status !== 'active') {
      throw new Error('Esta listagem não está mais ativa');
    }

    await propertyListingRepository.cancelListing(listingId);

    logger.info(`❌ Listagem cancelada: ${listingId}`);

    return { success: true, message: 'Listagem cancelada com sucesso' };
  } catch (error) {
    logger.error(`Erro ao cancelar listagem:`, error);
    throw error;
  }
};

/**
 * Comprar imóvel (Escritura Digital)
 */
export const purchaseProperty = async (listingId, buyerId) => {
  try {
    // Buscar listagem
    const listing = await propertyListingRepository.findByListingId(listingId);
    if (!listing) {
      throw new Error(`Listagem ${listingId} não encontrada`);
    }

    if (listing.status !== 'active') {
      throw new Error('Esta listagem não está mais disponível para venda');
    }

    // Verificar se comprador não é o vendedor
    if (listing.sellerId === buyerId || listing.seller_id === buyerId) {
      throw new Error('Você não pode comprar seu próprio imóvel');
    }

    // Buscar edifício (listing.buildingId é o UUID do Supabase)
    // Precisamos buscar pelo building_id string, não pelo UUID
    // Primeiro, vamos buscar a listagem completa para ter o building_id correto
    const building = await buildingRepository.findById(listing.buildingId);
    if (!building) {
      throw new Error('Edifício não encontrado');
    }

    // Verificar saldo do comprador
    const buyerWallet = await getOrCreateWallet(buyerId);
    if (buyerWallet.balance < listing.price) {
      throw new Error(`Saldo insuficiente. Você tem ${buyerWallet.balance.toFixed(2)} VAL, mas precisa de ${listing.price.toFixed(2)} VAL`);
    }

    // Calcular taxas
    const brokerFee = listing.price * BROKER_FEE_RATE;
    const netAmount = listing.price - brokerFee;

    // ✅ FASE 19.3: Tentar usar transação atômica se disponível (fallback para modo manual)
    let atomicSuccess = false;
    try {
      const { purchasePropertyAtomic } = await import('./transactionService.js');
      
      // Tentar usar transação atômica
      const atomicResult = await purchasePropertyAtomic(
        listingId,
        buyerId,
        listing.price,
        brokerFee,
        netAmount,
        building.buildingId, // string building_id
        listing.sellerId
      );
      
      if (atomicResult.success) {
        atomicSuccess = true;
        logger.info(`✅ Transação atômica de compra de imóvel executada com sucesso: ${listingId}`);
      }
    } catch (atomicError) {
      // Se transação atômica falhar, usar modo manual (compatibilidade retroativa)
      logger.warn(`⚠️ Transação atômica não disponível ou falhou: ${atomicError.message}. Usando modo manual...`);
    }

    // Modo manual (fallback ou se transação atômica não estiver disponível)
    if (!atomicSuccess) {
      // Transferir Valions
      // 1. Comprador paga o preço total
      await subtractBalance(
        buyerId,
        listing.price,
        `Compra de imóvel: ${building.name || building.type} em ${building.cityName || building.countryName}`,
        { listingId, buildingId: building.buildingId }
      );

      // 2. Vendedor recebe o valor líquido (preço - taxa)
      await addBalance(
        listing.sellerId,
        netAmount,
        `Venda de imóvel: ${building.name || building.type} em ${building.cityName || building.countryName}`,
        { listingId, buildingId: building.buildingId, brokerFee }
      );

      // 3. Taxa de corretagem vai para o sistema (pode ser para o tesouro nacional ou sistema)
      // Por enquanto, apenas registramos a taxa (pode ser distribuída depois)

      // Transferir propriedade do edifício
      await buildingRepository.update(building.id, {
        ownerId: buyerId
      });

      // Marcar listagem como vendida
      await propertyListingRepository.markAsSold(listingId);
    }

    // Criar registro de transação
    const transactionId = `trans_${uuidv4()}`;
    await propertyTransactionRepository.create({
      transactionId,
      buildingId: building.id,
      sellerId: listing.sellerId,
      buyerId,
      listingId: listing.id,
      salePrice: listing.price,
      brokerFee,
      netAmount,
      cityId: building.cityId,
      cityName: building.cityName,
      buildingType: building.type,
      transactionDate: new Date().toISOString()
    });

    logger.info(`🏠 Imóvel vendido: ${building.buildingId} - ${listing.price} VAL (Taxa: ${brokerFee.toFixed(2)} VAL)`);

    // Buscar edifício atualizado
    const updatedBuilding = await buildingRepository.findById(building.id);

    return {
      success: true,
      transaction: {
        transactionId,
        buildingId: building.buildingId,
        building: updatedBuilding,
        salePrice: listing.price,
        brokerFee,
        netAmount,
        buyerId,
        sellerId: listing.sellerId
      },
      message: `Imóvel comprado com sucesso! Taxa de corretagem: ${brokerFee.toFixed(2)} VAL`
    };
  } catch (error) {
    logger.error(`Erro ao comprar imóvel:`, error);
    throw error;
  }
};

/**
 * Obter histórico de transações
 */
export const getTransactionHistory = async (filters = {}) => {
  try {
    let transactions = [];

    if (filters.buildingId) {
      transactions = await propertyTransactionRepository.findByBuildingId(filters.buildingId, filters.limit || 50);
    } else if (filters.cityId) {
      transactions = await propertyTransactionRepository.findByCityId(filters.cityId, filters.limit || 100);
    } else if (filters.buyerId) {
      transactions = await propertyTransactionRepository.findByBuyerId(filters.buyerId, filters.limit || 50);
    } else if (filters.sellerId) {
      transactions = await propertyTransactionRepository.findBySellerId(filters.sellerId, filters.limit || 50);
    } else {
      // Buscar todas as transações recentes (limitado)
      const supabase = propertyTransactionRepository.getClient();
      const { data: records, error } = await supabase
        .from('property_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(filters.limit || 100);

      if (error) throw error;
      transactions = propertyTransactionRepository.formatRecords(records);
    }

    return transactions;
  } catch (error) {
    logger.error('Erro ao buscar histórico de transações:', error);
    throw error;
  }
};

/**
 * Obter estatísticas de valorização por cidade
 */
export const getCityPriceStats = async (cityId, days = 30) => {
  try {
    return await propertyTransactionRepository.getCityPriceStats(cityId, days);
  } catch (error) {
    logger.error(`Erro ao obter estatísticas de preços da cidade ${cityId}:`, error);
    throw error;
  }
};

