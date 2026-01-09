import { createPagination } from '../utils/pagination.js';

/**
 * Helper para criar resposta paginada
 */
export const createPaginatedResponse = (data, pagination, total) => {
  return {
    data,
    pagination: createPagination(
      pagination.page,
      pagination.limit,
      total
    )
  };
};

