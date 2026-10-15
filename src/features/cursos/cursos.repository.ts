import { pool, type Db } from '../../db/pool.js';

export interface CursoFila {
  id: string;
  codigo: string;
  nombre: string;
  periodo: string;
  profesor_id: string | null;
  creado_en: Date;
  profesor_nombre: string;
  total_estudiantes: number;
}

export interface EstudianteDelCurso {
  id: string;
  matricula: string;
  nombres: string | null;
  apellidos: string | null;
  email: string;
  inscrito_en: Date;
}

export interface Inscripcion {
  id: string;
  curso_id: string;
  estudiante_id: string;
  creado_en: Date;
}

export interface FiltrosCursos {
  periodo?: string | undefined;
  profesorId?: string | null | undefined;
  estudianteId?: string | null | undefined;
}

export interface CambiosCurso {
  codigo?: string | undefined;
  nombre?: string | undefined;
  periodo?: string | undefined;
  profesorId?: string | null | undefined;
}

const SELECT = `SELECT c.id, c.codigo, c.nombre, c.periodo, c.profesor_id, c.creado_en,
  trim(concat(p.nombres, ' ', p.apellidos)) AS profesor_nombre,
  (SELECT count(*)::int FROM inscripciones i WHERE i.curso_id = c.id) AS total_estudiantes
  FROM cursos c
  LEFT JOIN profesores pr ON pr.id = c.profesor_id
  LEFT JOIN perfiles p ON p.usuario_id = pr.usuario_id`;

export async function crear(
  datos: { codigo: string; nombre: string; periodo: string; profesorId?: string | null | undefined },
  db: Db = pool,
): Promise<{ id: string }> {
  const { rows } = await db.query<{ id: string }>(
    'INSERT INTO cursos (codigo, nombre, periodo, profesor_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [datos.codigo, datos.nombre, datos.periodo, datos.profesorId ?? null],
  );
  return rows[0]!;
}

export async function buscarPorId(id: string, db: Db = pool): Promise<CursoFila | null> {
  const { rows } = await db.query<CursoFila>(`${SELECT} WHERE c.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Filtra según quién pregunta: profesorId -> sus cursos; estudianteId -> cursos donde está inscrito */
export async function listar({ periodo, profesorId, estudianteId }: FiltrosCursos, db: Db = pool): Promise<CursoFila[]> {
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (periodo) { params.push(periodo); condiciones.push(`c.periodo = $${params.length}`); }
  if (profesorId !== undefined) { params.push(profesorId); condiciones.push(`c.profesor_id = $${params.length}`); }
  if (estudianteId !== undefined) {
    params.push(estudianteId);
    condiciones.push(`EXISTS (SELECT 1 FROM inscripciones i WHERE i.curso_id = c.id AND i.estudiante_id = $${params.length})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await db.query<CursoFila>(`${SELECT} ${where} ORDER BY c.periodo DESC, c.nombre`, params);
  return rows;
}

const COLUMNAS: Record<keyof CambiosCurso, string> = {
  codigo: 'codigo', nombre: 'nombre', periodo: 'periodo', profesorId: 'profesor_id',
};

export async function actualizar(id: string, cambios: CambiosCurso, db: Db = pool): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const campo of Object.keys(COLUMNAS) as (keyof CambiosCurso)[]) {
    if (cambios[campo] === undefined) continue;
    params.push(cambios[campo]);
    sets.push(`${COLUMNAS[campo]} = $${params.length}`);
  }
  if (sets.length) await db.query(`UPDATE cursos SET ${sets.join(', ')} WHERE id = $1`, params);
}

// ---------- Inscripciones ----------
export async function inscribir(cursoId: string, estudianteId: string, db: Db = pool): Promise<Inscripcion> {
  const { rows } = await db.query<Inscripcion>(
    'INSERT INTO inscripciones (curso_id, estudiante_id) VALUES ($1, $2) RETURNING id, curso_id, estudiante_id, creado_en',
    [cursoId, estudianteId],
  );
  return rows[0]!;
}

export async function desinscribir(cursoId: string, estudianteId: string, db: Db = pool): Promise<boolean> {
  const { rowCount } = await db.query('DELETE FROM inscripciones WHERE curso_id = $1 AND estudiante_id = $2', [cursoId, estudianteId]);
  return (rowCount ?? 0) > 0;
}

export async function buscarInscripcion(cursoId: string, estudianteId: string, db: Db = pool): Promise<{ id: string } | null> {
  const { rows } = await db.query<{ id: string }>(
    'SELECT id FROM inscripciones WHERE curso_id = $1 AND estudiante_id = $2', [cursoId, estudianteId]);
  return rows[0] ?? null;
}

export async function estudiantesDelCurso(cursoId: string, db: Db = pool): Promise<EstudianteDelCurso[]> {
  const { rows } = await db.query<EstudianteDelCurso>(
    `SELECT e.id, e.matricula, p.nombres, p.apellidos, u.email, i.creado_en AS inscrito_en
       FROM inscripciones i
       JOIN estudiantes e ON e.id = i.estudiante_id
       JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN perfiles p ON p.usuario_id = u.id
      WHERE i.curso_id = $1
      ORDER BY p.apellidos, p.nombres`,
    [cursoId],
  );
  return rows;
}
