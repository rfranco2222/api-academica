import { z } from 'zod';
import { esquemaPaginacion } from '../../utils/paginacion.js';
import { datosPersonales, email, password, texto } from '../../utils/schemas.js';

export const crearEstudianteSchema = z.strictObject({
  email,
  password,
  ...datosPersonales,
  matricula: texto(20),
  nivel: texto(40),
});

export const actualizarEstudianteSchema = z
  .strictObject({ matricula: texto(20).optional(), nivel: texto(40).optional() })
  .refine((o) => Object.keys(o).length > 0, 'Envía al menos un campo');

export const listarEstudiantesSchema = z.strictObject({
  ...esquemaPaginacion,
  buscar: z.string().trim().max(100).optional(),
  nivel: z.string().trim().max(40).optional(),
});

export type CrearEstudianteInput = z.output<typeof crearEstudianteSchema>;
export type ActualizarEstudianteInput = z.output<typeof actualizarEstudianteSchema>;
export type ListarEstudiantesInput = z.output<typeof listarEstudiantesSchema>;
