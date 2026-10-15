import { z } from 'zod';
import { esquemaPaginacion } from '../../utils/paginacion.js';
import { datosPersonales, email, password, texto } from '../../utils/schemas.js';

export const crearProfesorSchema = z.strictObject({
  email,
  password,
  ...datosPersonales,
  especialidad: texto(100),
});

export const actualizarProfesorSchema = z.strictObject({ especialidad: texto(100) });

export const listarProfesoresSchema = z.strictObject({
  ...esquemaPaginacion,
  buscar: z.string().trim().max(100).optional(),
});

export type CrearProfesorInput = z.output<typeof crearProfesorSchema>;
export type ActualizarProfesorInput = z.output<typeof actualizarProfesorSchema>;
export type ListarProfesoresInput = z.output<typeof listarProfesoresSchema>;
