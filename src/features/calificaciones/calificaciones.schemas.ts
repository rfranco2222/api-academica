import { z } from 'zod';
import { texto } from '../../utils/schemas.js';

// Nota de 0 a 100 con máximo 2 decimales
const nota = z.number('La nota debe ser un número').min(0, 'Mínimo 0').max(100, 'Máximo 100').multipleOf(0.01);
const peso = z.number().positive('El peso debe ser mayor que 0').max(100).multipleOf(0.01);

export const crearCalificacionSchema = z.strictObject({
  estudianteId: z.uuid('estudianteId inválido'),
  evaluacion: texto(80),
  nota,
  peso: peso.default(1),
  comentario: texto(500).optional(),
});

export const actualizarCalificacionSchema = z
  .strictObject({
    evaluacion: texto(80).optional(),
    nota: nota.optional(),
    peso: peso.optional(),
    comentario: texto(500).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Envía al menos un campo');

export const paramsCurso = z.strictObject({ cursoId: z.uuid('cursoId inválido') });

export type CrearCalificacionInput = z.output<typeof crearCalificacionSchema>;
export type ActualizarCalificacionInput = z.output<typeof actualizarCalificacionSchema>;
