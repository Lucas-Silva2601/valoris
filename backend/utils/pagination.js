/**
 * Utilitários para paginação
 */

/**
 * Criar objeto de paginação
 */
export const createPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  return {
    currentPage,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};

/**
 * Middleware de paginação
 */
export const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

/**
 * Aplicar paginação a uma query do Mongoose
 */
export const applyPagination = (query, pagination) => {
  return query
    .skip(pagination.skip)
    .limit(pagination.limit);
};

