import { z } from 'zod';
import { texto } from '../../utils/schemas.js';

export const periodo = z.string().trim().regex(/^\d{4}-[1-3]$/, 'Periodo inválido (formato AAAA-N, ej. 2026-1)');

export const crearCursoSchema = z.strictObject({
  codigo: texto(20).toUpperCase(),
  nombre: texto(120),
  periodo,
  profesorId: z.uuid().nullable().optional(),
});

export const actualizarCursoSchema = crearCursoSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Envía al menos un campo');

export const listarCursosSchema = z.strictObject({ periodo: periodo.optional() });

export const inscribirSchema = z.strictObject({ estudianteId: z.uuid('estudianteId inválido') });

export const paramsInscripcion = z.strictObject({ id: z.uuid(), estudianteId: z.uuid() });

export type CrearCursoInput = z.output<typeof crearCursoSchema>;
export type ActualizarCursoInput = z.output<typeof actualizarCursoSchema>;
export type ListarCursosInput = z.output<typeof listarCursosSchema>;
