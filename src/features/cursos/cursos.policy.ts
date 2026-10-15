import type { UsuarioAutenticado } from '../../types/index.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import * as repo from './cursos.repository.js';

// Reglas de autorización sobre un curso concreto (protección contra IDOR).
// Las usan los servicios de cursos, calificaciones y reportes.

/** Lo mínimo que necesitamos saber de un curso para decidir permisos */
export interface CursoConProfesor {
  id?: string;
  profesor_id: string | null;
}

export function esProfesorDelCurso(usuario: UsuarioAutenticado, curso: CursoConProfesor): boolean {
  return usuario.rol === 'profesor' && curso.profesor_id !== null && curso.profesor_id === usuario.profesorId;
}

/** Ver el curso: admin, su profesor o un estudiante inscrito. */
export async function asegurarPuedeVer(usuario: UsuarioAutenticado, curso: CursoConProfesor & { id: string }): Promise<void> {
  if (usuario.rol === 'admin' || esProfesorDelCurso(usuario, curso)) return;
  if (usuario.rol === 'estudiante' && usuario.estudianteId &&
      (await repo.buscarInscripcion(curso.id, usuario.estudianteId))) return;
  throw new NotFoundError('Curso'); // no revelamos que existe
}

/** Gestionar notas del curso: su profesor o un admin. */
export function asegurarPuedeCalificar(usuario: UsuarioAutenticado, curso: CursoConProfesor): void {
  if (usuario.rol === 'admin' || esProfesorDelCurso(usuario, curso)) return;
  throw new ForbiddenError('Solo el profesor asignado a este curso puede gestionar sus calificaciones');
}
