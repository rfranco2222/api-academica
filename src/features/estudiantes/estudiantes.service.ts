import { withTransaction } from '../../db/pool.js';
import type { Paginado, UsuarioAutenticado } from '../../types/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { offsetDe, respuestaPaginada } from '../../utils/paginacion.js';
import { crearCuenta } from '../usuarios/usuarios.service.js';
import * as repo from './estudiantes.repository.js';
import type { EstudianteFila } from './estudiantes.repository.js';
import type { ActualizarEstudianteInput, CrearEstudianteInput, ListarEstudiantesInput } from './estudiantes.schemas.js';

export async function crear(datos: CrearEstudianteInput): Promise<EstudianteFila> {
  const id = await withTransaction(async (client) => {
    const usuario = await crearCuenta(client, datos, 'estudiante');
    const estudiante = await repo.crear({ usuarioId: usuario.id, matricula: datos.matricula, nivel: datos.nivel }, client);
    return estudiante.id;
  });
  return (await repo.buscarPorId(id))!;
}

export async function listar(usuario: UsuarioAutenticado, filtros: ListarEstudiantesInput): Promise<Paginado<EstudianteFila>> {
  // Un profesor solo ve a los estudiantes de SUS cursos
  const profesorId = usuario.rol === 'profesor' ? usuario.profesorId : undefined;
  const { filas, total } = await repo.listar({ ...filtros, profesorId, offset: offsetDe(filtros) });
  return respuestaPaginada(filas, total, filtros);
}

/** Regla de acceso (protección contra IDOR) */
async function puedeVer(usuario: UsuarioAutenticado, estudianteId: string): Promise<boolean> {
  switch (usuario.rol) {
    case 'admin':
      return true;
    case 'estudiante':
      return usuario.estudianteId === estudianteId;
    case 'profesor':
      return usuario.profesorId !== null && repo.estaEnCursoDeProfesor(estudianteId, usuario.profesorId);
  }
}

export async function obtener(usuario: UsuarioAutenticado, id: string): Promise<EstudianteFila> {
  const estudiante = await repo.buscarPorId(id);
  // Respondemos 404 (no 403) para no revelar si existe un estudiante que no puedes ver
  if (!estudiante || !(await puedeVer(usuario, id))) throw new NotFoundError('Estudiante');
  return estudiante;
}

export async function actualizar(id: string, cambios: ActualizarEstudianteInput): Promise<EstudianteFila> {
  if (!(await repo.buscarPorId(id))) throw new NotFoundError('Estudiante');
  await repo.actualizar(id, cambios);
  return (await repo.buscarPorId(id))!;
}
