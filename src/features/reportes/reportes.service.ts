import type { UsuarioAutenticado } from '../../types/index.js';
import { NotFoundError } from '../../utils/errors.js';
import * as policy from '../cursos/cursos.policy.js';
import { obtenerOFallar as obtenerCurso } from '../cursos/cursos.service.js';
import * as estudiantesRepo from '../estudiantes/estudiantes.repository.js';
import { construirReporte, estadoDe, type Reporte } from './reportes.calculos.js';
import * as repo from './reportes.repository.js';

export async function reporteDeEstudiante(estudianteId: string | null, filtros: { periodo?: string | undefined }) {
  const estudiante = estudianteId ? await estudiantesRepo.buscarPorId(estudianteId) : null;
  if (!estudiante) throw new NotFoundError('Estudiante');

  const filas = await repo.calificacionesDeEstudiante(estudiante.id, filtros);
  const reporte: Reporte = construirReporte(filas);
  return {
    estudiante: { id: estudiante.id, matricula: estudiante.matricula, nombres: estudiante.nombres, apellidos: estudiante.apellidos },
    ...reporte,
  };
}

export async function reporteDeCurso(usuario: UsuarioAutenticado, cursoId: string) {
  const curso = await obtenerCurso(cursoId);
  policy.asegurarPuedeCalificar(usuario, curso);
  const estudiantes = (await repo.resumenDeCurso(cursoId)).map((e) => ({ ...e, estado: estadoDe(e.promedio) }));
  return {
    curso: { id: curso.id, codigo: curso.codigo, nombre: curso.nombre, periodo: curso.periodo },
    estudiantes,
    aprobados: estudiantes.filter((e) => e.estado === 'aprobado').length,
    reprobados: estudiantes.filter((e) => e.estado === 'reprobado').length,
  };
}
