/**
 * ✅ FASE 19.3: Serviço de Transações Atômicas
 * Garante que operações críticas sejam atômicas (tudo ou nada)
 */

import { getSupabase, checkConnection } from '../config/supabase.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TransactionService');

/**
 * Validar referências antes de criar novos registros
 */
export const validateReferences = async (references = {}) => {
  try {
    if (!checkConnection()) {
      throw new Error('Banco de dados não está conectado');
    }

    const supabase = getSupabase();
    const validation = {
      valid: true,
      errors: []
    };

    // Validar cityId se fornecido
    if (references.cityId) {
      const { data: city, error } = await supabase
        .from('cities')
        .select('city_id')
        .eq('city_id', references.cityId)
        .single();

      if (error || !city) {
        validation.valid = false;
        validation.errors.push(`Cidade ${references.cityId} não encontrada`);
      }
    }

    // Validar stateId se fornecido
    if (references.stateId) {
      const { data: state, error } = await supabase
        .from('states')
        .select('state_id')
        .eq('state_id', references.stateId)
        .single();

      if (error || !state) {
        validation.valid = false;
        validation.errors.push(`Estado ${references.stateId} não encontrado`);
      }
    }

    // Validar countryId se fornecido
    if (references.countryId) {
      // Verificar se o país existe (não há tabela countries, mas podemos validar contra buildings/geoJSON)
      // Por enquanto, apenas validar se não está vazio
      if (!references.countryId || references.countryId.trim() === '') {
        validation.valid = false;
        validation.errors.push('countryId não pode estar vazio');
      }
    }

    // Validar userId se fornecido
    if (references.userId) {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('user_id', references.userId)
        .single();

      if (error || !wallet) {
        // Usuário pode não existir ainda, então criamos a carteira (isso já é feito em walletService)
        // Apenas logar aviso
        logger.debug(`Usuário ${references.userId} não tem carteira ainda (será criada)`);
      }
    }

    // Validar buildingId se fornecido (verificar se edifício existe)
    if (references.buildingId) {
      const { data: building, error } = await supabase
        .from('buildings')
        .select('id')
        .eq('building_id', references.buildingId)
        .single();

      if (error || !building) {
        validation.valid = false;
        validation.errors.push(`Edifício ${references.buildingId} não encontrado`);
      }
    }

    return validation;
  } catch (error) {
    logger.error('Erro ao validar referências:', error);
    return {
      valid: false,
      errors: [error.message]
    };
  }
};

/**
 * Transação atômica: Comprar imóvel
 * Usa função SQL para garantir atomicidade
 */
export const purchasePropertyAtomic = async (
  listingId,
  buyerId,
  price,
  brokerFee,
  netAmount,
  buildingId,
  sellerId
) => {
  try {
    if (!checkConnection()) {
      throw new Error('Banco de dados não está conectado');
    }

    // Validar referências antes de executar transação
    const validation = await validateReferences({
      userId: buyerId,
      buildingId
    });

    if (!validation.valid) {
      throw new Error(`Referências inválidas: ${validation.errors.join(', ')}`);
    }

    // Buscar building.id (UUID) a partir do building_id (string)
    const supabase = getSupabase();
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id')
      .eq('building_id', buildingId)
      .single();

    if (buildingError || !building) {
      throw new Error(`Edifício ${buildingId} não encontrado`);
    }

    // Chamar função SQL de transação atômica
    const { data, error } = await supabase.rpc('purchase_property_atomic', {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_price: price,
      p_broker_fee: brokerFee,
      p_net_amount: netAmount,
      p_building_id: building.id, // UUID do Supabase
      p_seller_id: sellerId
    });

    if (error) {
      // Se a função SQL lançar exceção, PostgreSQL automaticamente faz ROLLBACK
      throw new Error(`Erro na transação: ${error.message}`);
    }

    logger.info(`✅ Transação atômica de compra de imóvel concluída: ${listingId}`);
    return {
      success: true,
      buyerNewBalance: data?.buyer_new_balance,
      sellerNewBalance: data?.seller_new_balance
    };
  } catch (error) {
    logger.error(`❌ Erro na transação atômica de compra de imóvel:`, error);
    throw error;
  }
};

/**
 * Transação atômica: Construir edifício
 * Usa função SQL para garantir atomicidade
 */
export const buildBuildingAtomic = async (userId, cost, buildingData) => {
  try {
    if (!checkConnection()) {
      throw new Error('Banco de dados não está conectado');
    }

    // Validar referências antes de executar transação
    const validation = await validateReferences({
      userId,
      cityId: buildingData.cityId,
      stateId: buildingData.stateId,
      countryId: buildingData.countryId
    });

    if (!validation.valid) {
      // Se validação falhar, logar mas não bloquear (pode ser cidade/estado novo)
      logger.warn(`⚠️ Referências podem não existir ainda: ${validation.errors.join(', ')}`);
    }

    // Preparar dados para a função SQL
    const buildingJson = {
      buildingId: buildingData.buildingId || `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      countryId: buildingData.countryId || null,
      countryName: buildingData.countryName || null,
      stateId: buildingData.stateId || null,
      stateName: buildingData.stateName || null,
      cityId: buildingData.cityId || null,
      cityName: buildingData.cityName || null,
      type: buildingData.type,
      position: {
        lat: buildingData.position?.lat || buildingData.positionLat,
        lng: buildingData.position?.lng || buildingData.positionLng
      },
      level: buildingData.level || 1,
      name: buildingData.name || `${buildingData.type} Level ${buildingData.level || 1}`,
      capacity: buildingData.capacity || 10,
      revenuePerHour: buildingData.revenuePerHour || 0,
      condition: buildingData.condition || 100
    };

    // Chamar função SQL de transação atômica
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('build_building_atomic', {
      p_user_id: userId,
      p_cost: cost,
      p_building_data: buildingJson
    });

    if (error) {
      // Se a função SQL lançar exceção, PostgreSQL automaticamente faz ROLLBACK
      throw new Error(`Erro na transação: ${error.message}`);
    }

    logger.info(`✅ Transação atômica de construção de edifício concluída: ${buildingJson.buildingId}`);
    return {
      success: true,
      buildingId: data?.building_id,
      newBalance: data?.new_balance
    };
  } catch (error) {
    logger.error(`❌ Erro na transação atômica de construção de edifício:`, error);
    throw error;
  }
};

