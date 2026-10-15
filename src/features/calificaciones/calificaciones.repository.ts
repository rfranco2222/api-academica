import { pool, type Db } from '../../db/pool.js';

export interface CalificacionFila {
  id: string;
  inscripcion_id: string;
  evaluacion: string;
  nota: number;
  peso: number;
  comentario: string | null;
  creado_en: Date;
}

/** Calificación + datos del curso, para verificar permisos */
export interface CalificacionConCurso {
  id: string;
  evaluacion: string;
  nota: number;
  peso: number;
  comentario: string | null;
  creado_en: Date;
  actualizado_en: Date;
  estudiante_id: string;
  curso_id: string;
  profesor_id: string | null;
}

export interface CalificacionDeCurso {
  id: string;
  evaluacion: string;
  nota: number;
  peso: number;
  comentario: string | null;
  creado_en: Date;
  estudiante_id: string;
  matricula: string;
  nombres: string | null;
  apellidos: string | null;
}

export interface NuevaCalificacion {
  inscripcionId: string;
  evaluacion: string;
  nota: number;
  peso: number;
  comentario?: string | undefined;
  registradaPor: string | null;
}

export interface CambiosCalificacion {
  evaluacion?: string | undefined;
  nota?: number | undefined;
  peso?: number | undefined;
  comentario?: string | null | undefined;
}

export async function crear(c: NuevaCalificacion, db: Db = pool): Promise<CalificacionFila> {
  const { rows } = await db.query<CalificacionFila>(
    `INSERT INTO calificaciones (inscripcion_id, evaluacion, nota, peso, comentario, registrada_por)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, inscripcion_id, evaluacion, nota, peso, comentario, creado_en`,
    [c.inscripcionId, c.evaluacion, c.nota, c.peso, c.comentario ?? null, c.registradaPor],
  );
  return rows[0]!;
}

export async function buscarConCurso(id: string, db: Db = pool): Promise<CalificacionConCurso | null> {
  const { rows } = await db.query<CalificacionConCurso>(
    `SELECT ca.id, ca.evaluacion, ca.nota, ca.peso, ca.comentario, ca.creado_en, ca.actualizado_en,
            i.estudiante_id, c.id AS curso_id, c.profesor_id
       FROM calificaciones ca
       JOIN inscripciones i ON i.id = ca.inscripcion_id
       JOIN cursos c ON c.id = i.curso_id
      WHERE ca.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listarPorCurso(cursoId: string, db: Db = pool): Promise<CalificacionDeCurso[]> {
  const { rows } = await db.query<CalificacionDeCurso>(
    `SELECT ca.id, ca.evaluacion, ca.nota, ca.peso, ca.comentario, ca.creado_en,
            e.id AS estudiante_id, e.matricula, p.nombres, p.apellidos
       FROM calificaciones ca
       JOIN inscripciones i ON i.id = ca.inscripcion_id
       JOIN estudiantes e ON e.id = i.estudiante_id
       LEFT JOIN perfiles p ON p.usuario_id = e.usuario_id
      WHERE i.curso_id = $1
      ORDER BY p.apellidos, p.nombres, ca.creado_en`,
    [cursoId],
  );
  return rows;
}

const COLUMNAS: Record<keyof CambiosCalificacion, string> = {
  evaluacion: 'evaluacion', nota: 'nota', peso: 'peso', comentario: 'comentario',
};

export async function actualizar(id: string, cambios: CambiosCalificacion, db: Db = pool): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const campo of Object.keys(COLUMNAS) as (keyof CambiosCalificacion)[]) {
    if (cambios[campo] === undefined) continue;
    params.push(cambios[campo]);
    sets.push(`${COLUMNAS[campo]} = $${params.length}`);
  }
  if (sets.length) await db.query(`UPDATE calificaciones SET ${sets.join(', ')} WHERE id = $1`, params);
}

export async function eliminar(id: string, db: Db = pool): Promise<void> {
  await db.query('DELETE FROM calificaciones WHERE id = $1', [id]);
}
