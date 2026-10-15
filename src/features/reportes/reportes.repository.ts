import { pool, type Db } from '../../db/pool.js';

/** Una fila por calificación (o una fila sin calificación si el curso aún no tiene notas) */
export interface FilaReporteEstudiante {
  curso_id: string;
  codigo: string;
  curso: string;
  periodo: string;
  profesor: string | null;
  calificacion_id: string | null;
  evaluacion: string | null;
  nota: number | null;
  peso: number | null;
  comentario: string | null;
  creado_en: Date | null;
}

export interface FilaResumenCurso {
  estudiante_id: string;
  matricula: string;
  nombres: string | null;
  apellidos: string | null;
  evaluaciones: number;
  promedio: number | null;
}

/** Todas las calificaciones de un estudiante, con los datos de cada curso. */
export async function calificacionesDeEstudiante(
  estudianteId: string,
  { periodo }: { periodo?: string | undefined } = {},
  db: Db = pool,
): Promise<FilaReporteEstudiante[]> {
  const params: unknown[] = [estudianteId];
  let filtro = '';
  if (periodo) { params.push(periodo); filtro = 'AND c.periodo = $2'; }
  const { rows } = await db.query<FilaReporteEstudiante>(
    `SELECT c.id AS curso_id, c.codigo, c.nombre AS curso, c.periodo,
            trim(concat(pp.nombres, ' ', pp.apellidos)) AS profesor,
            ca.id AS calificacion_id, ca.evaluacion, ca.nota, ca.peso, ca.comentario, ca.creado_en
       FROM inscripciones i
       JOIN cursos c ON c.id = i.curso_id
       LEFT JOIN profesores pr ON pr.id = c.profesor_id
       LEFT JOIN perfiles pp ON pp.usuario_id = pr.usuario_id
       LEFT JOIN calificaciones ca ON ca.inscripcion_id = i.id
      WHERE i.estudiante_id = $1 ${filtro}
      ORDER BY c.periodo DESC, c.nombre, ca.creado_en`,
    params,
  );
  return rows;
}

/** Promedio ponderado de cada estudiante en un curso, calculado por PostgreSQL. */
export async function resumenDeCurso(cursoId: string, db: Db = pool): Promise<FilaResumenCurso[]> {
  const { rows } = await db.query<FilaResumenCurso>(
    `SELECT e.id AS estudiante_id, e.matricula, p.nombres, p.apellidos,
            count(ca.id)::int AS evaluaciones,
            round(sum(ca.nota * ca.peso) / nullif(sum(ca.peso), 0), 2)::float AS promedio
       FROM inscripciones i
       JOIN estudiantes e ON e.id = i.estudiante_id
       LEFT JOIN perfiles p ON p.usuario_id = e.usuario_id
       LEFT JOIN calificaciones ca ON ca.inscripcion_id = i.id
      WHERE i.curso_id = $1
      GROUP BY e.id, e.matricula, p.nombres, p.apellidos
      ORDER BY p.apellidos, p.nombres`,
    [cursoId],
  );
  return rows;
}
