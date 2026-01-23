/**
 * Helpers de paginação padronizados
 */

import { z } from "zod";

/**
 * Schema Zod padrão para paginação
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Resultado de paginação padronizado
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Calcula os parâmetros de paginação para Prisma
 */
export function getPaginationParams(input: PaginationInput) {
  const { page, limit } = input;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Cria o objeto de paginação para resposta
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Helper para criar resultado paginado
 */
export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    pagination: createPaginationMeta(total, page, limit),
  };
}

/**
 * Schema de ordenação padrão
 */
export const orderSchema = z.object({
  orderBy: z.string().optional(),
  orderDir: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderInput = z.infer<typeof orderSchema>;

/**
 * Combina schemas de paginação e ordenação
 */
export const paginatedOrderSchema = paginationSchema.merge(orderSchema);

export type PaginatedOrderInput = z.infer<typeof paginatedOrderSchema>;

/**
 * Cursor-based pagination schema (para listas muito grandes)
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

/**
 * Resultado de cursor pagination
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Helper para cursor pagination
 */
export function cursorPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number,
  direction: "forward" | "backward" = "forward"
): CursorPaginatedResult<T> {
  const hasMore = items.length > limit;
  const trimmedItems = hasMore ? items.slice(0, limit) : items;
  
  if (direction === "backward") {
    trimmedItems.reverse();
  }

  return {
    items: trimmedItems,
    nextCursor: trimmedItems.length > 0 ? trimmedItems[trimmedItems.length - 1].id : null,
    prevCursor: trimmedItems.length > 0 ? trimmedItems[0].id : null,
    hasMore,
  };
}
