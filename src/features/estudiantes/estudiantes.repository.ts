import { pool, type Db } from '../../db/pool.js';

export interface EstudianteFila {
  id: string;
  matricula: string;
  nivel: string;
  creado_en: Date;
  usuario_id: string;
  email: string;
  activo: boolean;
  nombres: string | null;
  apellidos: string | null;
  cedula: string | null;
  telefono: string | null;
}

export interface FiltrosEstudiantes {
  buscar?: string | undefined;
  nivel?: string | undefined;
  profesorId?: string | null | undefined;
  limit: number;
  offset: number;
}

const DESDE = `FROM estudiantes e
  JOIN usuarios u ON u.id = e.usuario_id
  LEFT JOIN perfiles p ON p.usuario_id = u.id`;
const SELECT = `SELECT e.id, e.matricula, e.nivel, e.creado_en, u.id AS usuario_id, u.email, u.activo,
  p.nombres, p.apellidos, p.cedula, p.telefono ${DESDE}`;

export async function crear(
  datos: { usuarioId: string; matricula: string; nivel: string },
  db: Db = pool,
): Promise<{ id: string }> {
  const { rows } = await db.query<{ id: string }>(
    'INSERT INTO estudiantes (usuario_id, matricula, nivel) VALUES ($1, $2, $3) RETURNING id',
    [datos.usuarioId, datos.matricula, datos.nivel],
  );
  return rows[0]!;
}

export async function buscarPorId(id: string, db: Db = pool): Promise<EstudianteFila | null> {
  const { rows } = await db.query<EstudianteFila>(`${SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Si se pasa profesorId, devuelve solo estudiantes inscritos en cursos de ese profesor. */
export async function listar(
  { buscar, nivel, profesorId, limit, offset }: FiltrosEstudiantes,
  db: Db = pool,
): Promise<{ filas: EstudianteFila[]; total: number }> {
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (nivel) { params.push(nivel); condiciones.push(`e.nivel = $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    const n = params.length;
    condiciones.push(`(p.nombres ILIKE $${n} OR p.apellidos ILIKE $${n} OR e.matricula ILIKE $${n})`);
  }
  if (profesorId) {
    params.push(profesorId);
    condiciones.push(`EXISTS (SELECT 1 FROM inscripciones i JOIN cursos c ON c.id = i.curso_id
                              WHERE i.estudiante_id = e.id AND c.profesor_id = $${params.length})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const total = await db.query<{ total: number }>(`SELECT count(*)::int AS total ${DESDE} ${where}`, params);
  params.push(limit, offset);
  const { rows } = await db.query<EstudianteFila>(
    `${SELECT} ${where} ORDER BY p.apellidos, p.nombres LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { filas: rows, total: total.rows[0]?.total ?? 0 };
}

export async function actualizar(
  id: string,
  { matricula, nivel }: { matricula?: string | undefined; nivel?: string | undefined },
  db: Db = pool,
): Promise<void> {
  await db.query(
    'UPDATE estudiantes SET matricula = COALESCE($2, matricula), nivel = COALESCE($3, nivel) WHERE id = $1',
    [id, matricula ?? null, nivel ?? null],
  );
}

export async function estaEnCursoDeProfesor(estudianteId: string, profesorId: string, db: Db = pool): Promise<boolean> {
  const { rowCount } = await db.query(
    `SELECT 1 FROM inscripciones i JOIN cursos c ON c.id = i.curso_id
      WHERE i.estudiante_id = $1 AND c.profesor_id = $2 LIMIT 1`,
    [estudianteId, profesorId],
  );
  return (rowCount ?? 0) > 0;
}
