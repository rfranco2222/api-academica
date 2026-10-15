import { z } from 'zod';
import { cedula, fecha, telefono, texto } from '../../utils/schemas.js';

const alMenosUnCampo = (obj: object) => Object.keys(obj).length > 0;

// Lo que CADA usuario puede cambiar de sí mismo
export const actualizarMiPerfilSchema = z
  .strictObject({
    telefono: telefono.nullable().optional(),
    direccion: texto(255).nullable().optional(),
    fechaNacimiento: fecha.nullable().optional(),
  })
  .refine(alMenosUnCampo, 'Envía al menos un campo para actualizar');

// Lo que un ADMIN puede cambiar del perfil de otra persona (incluye datos de identidad)
export const actualizarPerfilAdminSchema = z
  .strictObject({
    nombres: texto(80).optional(),
    apellidos: texto(80).optional(),
    cedula: cedula.nullable().optional(),
    telefono: telefono.nullable().optional(),
    direccion: texto(255).nullable().optional(),
    fechaNacimiento: fecha.nullable().optional(),
  })
  .refine(alMenosUnCampo, 'Envía al menos un campo para actualizar');

export const paramsUsuarioId = z.strictObject({ usuarioId: z.uuid('usuarioId inválido') });
