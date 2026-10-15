import { pool, type Db } from '../../db/pool.js';

export interface ProfesorFila {
  id: string;
  especialidad: string;
  creado_en: Date;
  usuario_id: string;
  email: string;
  activo: boolean;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  total_cursos: number;
}

const DESDE = `FROM profesores pr
  JOIN usuarios u ON u.id = pr.usuario_id
  LEFT JOIN perfiles p ON p.usuario_id = u.id`;
const SELECT = `SELECT pr.id, pr.especialidad, pr.creado_en, u.id AS usuario_id, u.email, u.activo,
  p.nombres, p.apellidos, p.telefono,
  (SELECT count(*)::int FROM cursos c WHERE c.profesor_id = pr.id) AS total_cursos ${DESDE}`;

export async function crear(datos: { usuarioId: string; especialidad: string }, db: Db = pool): Promise<{ id: string }> {
  const { rows } = await db.query<{ id: string }>(
    'INSERT INTO profesores (usuario_id, especialidad) VALUES ($1, $2) RETURNING id',
    [datos.usuarioId, datos.especialidad],
  );
  return rows[0]!;
}

export async function buscarPorId(id: string, db: Db = pool): Promise<ProfesorFila | null> {
  const { rows } = await db.query<ProfesorFila>(`${SELECT} WHERE pr.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listar(
  { buscar, limit, offset }: { buscar?: string | undefined; limit: number; offset: number },
  db: Db = pool,
): Promise<{ filas: ProfesorFila[]; total: number }> {
  const params: unknown[] = [];
  let where = '';
  if (buscar) {
    params.push(`%${buscar}%`);
    where = 'WHERE p.nombres ILIKE $1 OR p.apellidos ILIKE $1 OR pr.especialidad ILIKE $1';
  }
  const total = await db.query<{ total: number }>(`SELECT count(*)::int AS total ${DESDE} ${where}`, params);
  params.push(limit, offset);
  const { rows } = await db.query<ProfesorFila>(
    `${SELECT} ${where} ORDER BY p.apellidos, p.nombres LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { filas: rows, total: total.rows[0]?.total ?? 0 };
}

export async function actualizar(id: string, { especialidad }: { especialidad: string }, db: Db = pool): Promise<void> {
  await db.query('UPDATE profesores SET especialidad = $2 WHERE id = $1', [id, especialidad]);
}
