import type { UsuarioAutenticado } from '../../types/index.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import * as estudiantesRepo from '../estudiantes/estudiantes.repository.js';
import * as profesoresRepo from '../profesores/profesores.repository.js';
import * as policy from './cursos.policy.js';
import * as repo from './cursos.repository.js';
import type { CursoFila, EstudianteDelCurso, Inscripcion } from './cursos.repository.js';
import type { ActualizarCursoInput, CrearCursoInput, ListarCursosInput } from './cursos.schemas.js';

async function validarProfesor(profesorId: string | null | undefined): Promise<void> {
  if (profesorId && !(await profesoresRepo.buscarPorId(profesorId))) {
    throw new BadRequestError('El profesor indicado no existe');
  }
}

export async function obtenerOFallar(id: string): Promise<CursoFila> {
  const curso = await repo.buscarPorId(id);
  if (!curso) throw new NotFoundError('Curso');
  return curso;
}

export async function crear(datos: CrearCursoInput): Promise<CursoFila> {
  await validarProfesor(datos.profesorId);
  const { id } = await repo.crear(datos);
  return obtenerOFallar(id);
}

export function listar(usuario: UsuarioAutenticado, filtros: ListarCursosInput): Promise<CursoFila[]> {
  // Cada rol ve solo lo que le corresponde
  if (usuario.rol === 'profesor') return repo.listar({ ...filtros, profesorId: usuario.profesorId });
  if (usuario.rol === 'estudiante') return repo.listar({ ...filtros, estudianteId: usuario.estudianteId });
  return repo.listar(filtros);
}

export async function obtener(usuario: UsuarioAutenticado, id: string): Promise<CursoFila> {
  const curso = await obtenerOFallar(id);
  await policy.asegurarPuedeVer(usuario, curso);
  return curso;
}

export async function actualizar(id: string, cambios: ActualizarCursoInput): Promise<CursoFila> {
  await obtenerOFallar(id);
  await validarProfesor(cambios.profesorId);
  await repo.actualizar(id, cambios);
  return obtenerOFallar(id);
}

export async function inscribir(cursoId: string, estudianteId: string): Promise<Inscripcion> {
  await obtenerOFallar(cursoId);
  if (!(await estudiantesRepo.buscarPorId(estudianteId))) throw new BadRequestError('El estudiante indicado no existe');
  return repo.inscribir(cursoId, estudianteId); // si ya estaba inscrito, PostgreSQL responde 23505 -> 409
}

export async function desinscribir(cursoId: string, estudianteId: string): Promise<void> {
  if (!(await repo.desinscribir(cursoId, estudianteId))) throw new NotFoundError('Inscripción');
}

export async function estudiantes(usuario: UsuarioAutenticado, cursoId: string): Promise<EstudianteDelCurso[]> {
  const curso = await obtenerOFallar(cursoId);
  policy.asegurarPuedeCalificar(usuario, curso);
  return repo.estudiantesDelCurso(cursoId);
}
