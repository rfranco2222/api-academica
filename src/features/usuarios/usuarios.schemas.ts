import { z } from 'zod';
import { esquemaPaginacion } from '../../utils/paginacion.js';
import { datosPersonales, email, password, rol, texto } from '../../utils/schemas.js';

export const listarUsuariosSchema = z.strictObject({
  ...esquemaPaginacion,
  rol: rol.optional(),
  activo: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  buscar: z.string().trim().max(100).optional(),
});

// Crear un administrador (estudiantes y profesores tienen su propio endpoint)
export const crearAdminSchema = z.strictObject({
  email,
  password,
  ...datosPersonales,
});

// El cuerpo cambia según el rol destino: "discriminated union"
export const cambiarRolSchema = z.discriminatedUnion('rol', [
  z.strictObject({ rol: z.literal('admin') }),
  z.strictObject({ rol: z.literal('profesor'), especialidad: texto(100).optional() }),
  z.strictObject({ rol: z.literal('estudiante'), matricula: texto(20).optional(), nivel: texto(40).optional() }),
]);

export const cambiarEstadoSchema = z.strictObject({ activo: z.boolean() });

export type ListarUsuariosInput = z.output<typeof listarUsuariosSchema>;
export type CrearAdminInput = z.output<typeof crearAdminSchema>;
export type CambiarRolInput = z.output<typeof cambiarRolSchema>;
