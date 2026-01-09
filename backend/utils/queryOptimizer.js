/**
 * Otimizador de queries do MongoDB
 */

/**
 * Adicionar paginação a query
 */
export const addPagination = (query, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/**
 * Selecionar apenas campos necessários
 */
export const selectFields = (query, fields) => {
  const projection = {};
  fields.forEach(field => {
    projection[field] = 1;
  });
  return query.select(projection);
};

/**
 * Adicionar índices sugeridos
 */
export const ensureIndexes = async (model) => {
  // Índices comuns
  await model.collection.createIndex({ countryId: 1 });
  await model.collection.createIndex({ userId: 1 });
  await model.collection.createIndex({ createdAt: -1 });
  
  // Índices compostos
  await model.collection.createIndex({ countryId: 1, userId: 1 });
  await model.collection.createIndex({ userId: 1, createdAt: -1 });
};

/**
 * Cache de queries frequentes
 */
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

export const cachedQuery = async (key, queryFn, ttl = CACHE_TTL) => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await queryFn();
  queryCache.set(key, {
    data,
    timestamp: Date.now()
  });

  return data;
};

/**
 * Limpar cache
 */
export const clearCache = (key = null) => {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
};

