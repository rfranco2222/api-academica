import type { UsuarioAutenticado } from '../../types/index.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import * as policy from '../cursos/cursos.policy.js';
import * as cursosRepo from '../cursos/cursos.repository.js';
import { obtenerOFallar as obtenerCurso } from '../cursos/cursos.service.js';
import * as repo from './calificaciones.repository.js';
import type { CalificacionConCurso, CalificacionDeCurso, CalificacionFila } from './calificaciones.repository.js';
import type { ActualizarCalificacionInput, CrearCalificacionInput } from './calificaciones.schemas.js';

export async function crear(
  usuario: UsuarioAutenticado,
  cursoId: string,
  datos: CrearCalificacionInput,
): Promise<CalificacionFila> {
  const curso = await obtenerCurso(cursoId);
  policy.asegurarPuedeCalificar(usuario, curso); // ¿es SU curso?

  // ¿El estudiante pertenece a este curso? Evita calificar a cualquiera enviando otro id.
  const inscripcion = await cursosRepo.buscarInscripcion(cursoId, datos.estudianteId);
  if (!inscripcion) throw new BadRequestError('El estudiante no está inscrito en este curso');

  return repo.crear({
    inscripcionId: inscripcion.id,
    evaluacion: datos.evaluacion,
    nota: datos.nota,
    peso: datos.peso,
    comentario: datos.comentario,
    registradaPor: usuario.profesorId, // null si la registra un admin
  });
}

export async function listarPorCurso(usuario: UsuarioAutenticado, cursoId: string): Promise<CalificacionDeCurso[]> {
  const curso = await obtenerCurso(cursoId);
  policy.asegurarPuedeCalificar(usuario, curso);
  return repo.listarPorCurso(cursoId);
}

async function obtenerConPermiso(usuario: UsuarioAutenticado, id: string): Promise<CalificacionConCurso> {
  const calificacion = await repo.buscarConCurso(id);
  if (!calificacion) throw new NotFoundError('Calificación');
  policy.asegurarPuedeCalificar(usuario, calificacion);
  return calificacion;
}

export async function actualizar(
  usuario: UsuarioAutenticado,
  id: string,
  cambios: ActualizarCalificacionInput,
): Promise<CalificacionConCurso> {
  await obtenerConPermiso(usuario, id);
  await repo.actualizar(id, cambios);
  return (await repo.buscarConCurso(id))!;
}

export async function eliminar(usuario: UsuarioAutenticado, id: string): Promise<void> {
  await obtenerConPermiso(usuario, id);
  await repo.eliminar(id);
}
