import { pool, type Db } from '../../db/pool.js';
import type { Rol } from '../../types/index.js';

/** Fila pública de un usuario (sin el hash de la contraseña) */
export interface UsuarioFila {
  id: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creado_en: Date;
  nombres: string | null;
  apellidos: string | null;
  profesor_id: string | null;
  estudiante_id: string | null;
}

/** Solo para el login: incluye password_hash */
export interface UsuarioConPassword {
  id: string;
  email: string;
  rol: Rol;
  activo: boolean;
  password_hash: string;
}

export interface FiltrosUsuarios {
  rol?: Rol | undefined;
  activo?: boolean | undefined;
  buscar?: string | undefined;
  limit: number;
  offset: number;
}

// Columnas públicas: NUNCA devolvemos password_hash fuera del login
const COLUMNAS = `u.id, u.email, u.rol, u.activo, u.creado_en,
  p.nombres, p.apellidos, pr.id AS profesor_id, e.id AS estudiante_id`;
const JOINS = `FROM usuarios u
  LEFT JOIN perfiles p ON p.usuario_id = u.id
  LEFT JOIN profesores pr ON pr.usuario_id = u.id
  LEFT JOIN estudiantes e ON e.usuario_id = u.id`;

export async function buscarPorId(id: string, db: Db = pool): Promise<UsuarioFila | null> {
  const { rows } = await db.query<UsuarioFila>(`SELECT ${COLUMNAS} ${JOINS} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function buscarPorEmailConPassword(email: string, db: Db = pool): Promise<UsuarioConPassword | null> {
  const { rows } = await db.query<UsuarioConPassword>(
    'SELECT id, email, rol, activo, password_hash FROM usuarios WHERE lower(email) = lower($1)',
    [email],
  );
  return rows[0] ?? null;
}

export async function crear(
  datos: { email: string; passwordHash: string; rol: Rol },
  db: Db = pool,
): Promise<{ id: string; email: string; rol: Rol }> {
  const { rows } = await db.query<{ id: string; email: string; rol: Rol }>(
    'INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, email, rol',
    [datos.email, datos.passwordHash, datos.rol],
  );
  return rows[0]!; // INSERT ... RETURNING siempre devuelve una fila
}

export async function listar(
  { rol, activo, buscar, limit, offset }: FiltrosUsuarios,
  db: Db = pool,
): Promise<{ filas: UsuarioFila[]; total: number }> {
  // Filtros dinámicos SIEMPRE con parámetros ($1, $2...), nunca concatenando valores
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (rol) { params.push(rol); condiciones.push(`u.rol = $${params.length}`); }
  if (activo !== undefined) { params.push(activo); condiciones.push(`u.activo = $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    condiciones.push(`(u.email ILIKE $${params.length} OR p.nombres ILIKE $${params.length} OR p.apellidos ILIKE $${params.length})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const total = await db.query<{ total: number }>(`SELECT count(*)::int AS total ${JOINS} ${where}`, params);
  params.push(limit, offset);
  const { rows } = await db.query<UsuarioFila>(
    `SELECT ${COLUMNAS} ${JOINS} ${where} ORDER BY p.apellidos NULLS LAST, u.email
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { filas: rows, total: total.rows[0]?.total ?? 0 };
}

export async function actualizarRol(id: string, rol: Rol, db: Db = pool): Promise<void> {
  await db.query('UPDATE usuarios SET rol = $2 WHERE id = $1', [id, rol]);
}

export async function actualizarActivo(id: string, activo: boolean, db: Db = pool): Promise<void> {
  await db.query('UPDATE usuarios SET activo = $2 WHERE id = $1', [id, activo]);
}
