// Funciones PURAS: no tocan la BD ni HTTP. Se prueban con tests unitarios muy simples.
import type { FilaReporteEstudiante } from './reportes.repository.js';

export const NOTA_MINIMA_APROBACION = 70;

export type EstadoAcademico = 'aprobado' | 'reprobado' | 'sin_calificaciones';

export interface NotaConPeso {
  nota: number;
  peso: number;
}

export interface CalificacionReporte extends NotaConPeso {
  id: string;
  evaluacion: string;
  comentario: string | null;
  fecha: Date | null;
}

export interface CursoReporte {
  curso: { id: string; codigo: string; nombre: string; periodo: string; profesor: string | null };
  calificaciones: CalificacionReporte[];
  promedio: number | null;
  estado: EstadoAcademico;
}

export interface Reporte {
  resumen: {
    cursos: number;
    promedioGeneral: number | null;
    aprobados: number;
    reprobados: number;
    notaMinima: number;
  };
  cursos: CursoReporte[];
}

const redondear = (n: number): number => Math.round(n * 100) / 100;

export function promedioPonderado(calificaciones: NotaConPeso[]): number | null {
  const pesoTotal = calificaciones.reduce((s, c) => s + c.peso, 0);
  if (pesoTotal === 0) return null;
  return redondear(calificaciones.reduce((s, c) => s + c.nota * c.peso, 0) / pesoTotal);
}

export function estadoDe(promedio: number | null, notaMinima = NOTA_MINIMA_APROBACION): EstadoAcademico {
  if (promedio === null) return 'sin_calificaciones';
  return promedio >= notaMinima ? 'aprobado' : 'reprobado';
}

/** Lo mínimo que necesita construirReporte de cada fila (facilita las pruebas) */
export type FilaParaReporte = Pick<FilaReporteEstudiante, 'curso_id' | 'codigo' | 'curso' | 'periodo'> &
  Partial<Omit<FilaReporteEstudiante, 'curso_id' | 'codigo' | 'curso' | 'periodo'>>;

/** Convierte filas planas (una por calificación) en un reporte agrupado por curso. */
export function construirReporte(filas: FilaParaReporte[]): Reporte {
  const cursos = new Map<string, Omit<CursoReporte, 'promedio' | 'estado'>>();

  for (const f of filas) {
    let grupo = cursos.get(f.curso_id);
    if (!grupo) {
      grupo = {
        curso: { id: f.curso_id, codigo: f.codigo, nombre: f.curso, periodo: f.periodo, profesor: f.profesor || null },
        calificaciones: [],
      };
      cursos.set(f.curso_id, grupo);
    }
    // Si hay LEFT JOIN sin calificación, estas columnas vienen en null
    if (f.calificacion_id && f.nota != null && f.peso != null) {
      grupo.calificaciones.push({
        id: f.calificacion_id,
        evaluacion: f.evaluacion ?? '',
        nota: f.nota,
        peso: f.peso,
        comentario: f.comentario ?? null,
        fecha: f.creado_en ?? null,
      });
    }
  }

  const detalle: CursoReporte[] = [...cursos.values()].map((c) => {
    const promedio = promedioPonderado(c.calificaciones);
    return { ...c, promedio, estado: estadoDe(promedio) };
  });

  const promedios = detalle.map((c) => c.promedio).filter((p): p is number => p !== null);
  return {
    resumen: {
      cursos: detalle.length,
      promedioGeneral: promedios.length ? redondear(promedios.reduce((s, p) => s + p, 0) / promedios.length) : null,
      aprobados: detalle.filter((c) => c.estado === 'aprobado').length,
      reprobados: detalle.filter((c) => c.estado === 'reprobado').length,
      notaMinima: NOTA_MINIMA_APROBACION,
    },
    cursos: detalle,
  };
}
