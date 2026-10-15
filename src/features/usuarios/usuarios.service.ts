import type { PoolClient } from 'pg';
import { withTransaction } from '../../db/pool.js';
import type { Paginado, Rol, UsuarioAutenticado } from '../../types/index.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { offsetDe, respuestaPaginada } from '../../utils/paginacion.js';
import { hashPassword } from '../../utils/password.js';
import type { DatosCuenta } from '../../utils/schemas.js';
import * as authRepo from '../auth/auth.repository.js';
import * as estudiantesRepo from '../estudiantes/estudiantes.repository.js';
import * as perfilRepo from '../perfil/perfil.repository.js';
import * as profesoresRepo from '../profesores/profesores.repository.js';
import type { CambiarRolInput, CrearAdminInput, ListarUsuariosInput } from './usuarios.schemas.js';
import * as usuariosRepo from './usuarios.repository.js';
import type { UsuarioFila } from './usuarios.repository.js';

/**
 * Crea usuario + perfil dentro de una transacción ya abierta.
 * Lo reutilizan los servicios de administradores, profesores y estudiantes.
 */
export async function crearCuenta(client: PoolClient, datos: DatosCuenta, rol: Rol) {
  const usuario = await usuariosRepo.crear(
    { email: datos.email, passwordHash: await hashPassword(datos.password), rol },
    client,
  );
  await perfilRepo.crear(usuario.id, datos, client);
  return usuario;
}

export async function crearAdmin(datos: CrearAdminInput): Promise<UsuarioFila> {
  const usuario = await withTransaction((client) => crearCuenta(client, datos, 'admin'));
  return obtener(usuario.id);
}

export async function listar(filtros: ListarUsuariosInput): Promise<Paginado<UsuarioFila>> {
  const { filas, total } = await usuariosRepo.listar({ ...filtros, offset: offsetDe(filtros) });
  return respuestaPaginada(filas, total, filtros);
}

export async function obtener(id: string): Promise<UsuarioFila> {
  const usuario = await usuariosRepo.buscarPorId(id);
  if (!usuario) throw new NotFoundError('Usuario');
  return usuario;
}

export async function cambiarRol(adminActual: UsuarioAutenticado, id: string, datos: CambiarRolInput): Promise<UsuarioFila> {
  if (adminActual.id === id) throw new ForbiddenError('No puedes cambiar tu propio rol');
  const usuario = await obtener(id);

  await withTransaction(async (client) => {
    // Gracias a la "discriminated union", dentro de cada if TypeScript sabe qué campos existen
    if (datos.rol === 'profesor' && !usuario.profesor_id) {
      if (!datos.especialidad) throw new BadRequestError('Indica la especialidad del profesor');
      await profesoresRepo.crear({ usuarioId: id, especialidad: datos.especialidad }, client);
    }
    if (datos.rol === 'estudiante' && !usuario.estudiante_id) {
      if (!datos.matricula || !datos.nivel) throw new BadRequestError('Indica matrícula y nivel del estudiante');
      await estudiantesRepo.crear({ usuarioId: id, matricula: datos.matricula, nivel: datos.nivel }, client);
    }
    await usuariosRepo.actualizarRol(id, datos.rol, client);
    await authRepo.revocarTodosDelUsuario(id, client); // cierra sus sesiones: debe volver a entrar
  });

  return obtener(id);
}

export async function cambiarEstado(adminActual: UsuarioAutenticado, id: string, activo: boolean): Promise<UsuarioFila> {
  if (adminActual.id === id) throw new ForbiddenError('No puedes desactivarte a ti mismo');
  await obtener(id);
  await usuariosRepo.actualizarActivo(id, activo);
  if (!activo) await authRepo.revocarTodosDelUsuario(id);
  return obtener(id);
}
