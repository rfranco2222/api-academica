import { z } from 'zod';
import type { Paginado } from '../types/index.js';

export const esquemaPaginacion = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export interface Paginacion {
  page: number;
  limit: number;
}

export const offsetDe = ({ page, limit }: Paginacion): number => (page - 1) * limit;

export function respuestaPaginada<T>(filas: T[], total: number, { page, limit }: Paginacion): Paginado<T> {
  return { data: filas, meta: { page, limit, total, paginas: Math.ceil(total / limit) } };
}
