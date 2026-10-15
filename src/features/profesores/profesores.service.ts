import { withTransaction } from '../../db/pool.js';
import type { Paginado, UsuarioAutenticado } from '../../types/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { offsetDe, respuestaPaginada } from '../../utils/paginacion.js';
import { crearCuenta } from '../usuarios/usuarios.service.js';
import * as repo from './profesores.repository.js';
import type { ProfesorFila } from './profesores.repository.js';
import type { ActualizarProfesorInput, CrearProfesorInput, ListarProfesoresInput } from './profesores.schemas.js';

export async function crear(datos: CrearProfesorInput): Promise<ProfesorFila> {
  const id = await withTransaction(async (client) => {
    const usuario = await crearCuenta(client, datos, 'profesor');
    return (await repo.crear({ usuarioId: usuario.id, especialidad: datos.especialidad }, client)).id;
  });
  return (await repo.buscarPorId(id))!;
}

export async function listar(filtros: ListarProfesoresInput): Promise<Paginado<ProfesorFila>> {
  const { filas, total } = await repo.listar({ ...filtros, offset: offsetDe(filtros) });
  return respuestaPaginada(filas, total, filtros);
}

export async function obtener(usuario: UsuarioAutenticado, id: string): Promise<ProfesorFila> {
  const profesor = await repo.buscarPorId(id);
  const puedeVer = usuario.rol === 'admin' || usuario.profesorId === id;
  if (!profesor || !puedeVer) throw new NotFoundError('Profesor');
  return profesor;
}

export async function actualizar(id: string, cambios: ActualizarProfesorInput): Promise<ProfesorFila> {
  if (!(await repo.buscarPorId(id))) throw new NotFoundError('Profesor');
  await repo.actualizar(id, cambios);
  return (await repo.buscarPorId(id))!;
}
