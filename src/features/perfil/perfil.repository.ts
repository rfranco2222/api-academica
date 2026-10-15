import { pool, type Db } from '../../db/pool.js';
import type { Rol } from '../../types/index.js';
import type { DatosPersonales } from '../../utils/schemas.js';

export interface PerfilFila {
  usuario_id: string;
  email: string;
  rol: Rol;
  nombres: string | null;
  apellidos: string | null;
  cedula: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  actualizado_en: Date | null;
}

/** Campos editables del perfil (cualquiera puede venir, y null significa "borrar") */
export type CambiosPerfil = { [K in keyof DatosPersonales]?: DatosPersonales[K] | null };

// Mapa "campo de la API" -> "columna de la BD". Es también una lista blanca:
// solo estas columnas se pueden actualizar. El tipo Record obliga a cubrir TODOS los campos.
const COLUMNAS: Record<keyof DatosPersonales, string> = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  cedula: 'cedula',
  fechaNacimiento: 'fecha_nacimiento',
  telefono: 'telefono',
  direccion: 'direccion',
};

const SELECT = `SELECT u.id AS usuario_id, u.email, u.rol, p.nombres, p.apellidos, p.cedula,
  p.fecha_nacimiento, p.telefono, p.direccion, p.actualizado_en
  FROM usuarios u LEFT JOIN perfiles p ON p.usuario_id = u.id`;

export async function obtener(usuarioId: string, db: Db = pool): Promise<PerfilFila | null> {
  const { rows } = await db.query<PerfilFila>(`${SELECT} WHERE u.id = $1`, [usuarioId]);
  return rows[0] ?? null;
}

export async function crear(usuarioId: string, datos: DatosPersonales, db: Db = pool): Promise<void> {
  await db.query(
    `INSERT INTO perfiles (usuario_id, nombres, apellidos, cedula, fecha_nacimiento, telefono, direccion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [usuarioId, datos.nombres, datos.apellidos, datos.cedula ?? null, datos.fechaNacimiento ?? null,
      datos.telefono ?? null, datos.direccion ?? null],
  );
}

const esCampo = (campo: string): campo is keyof DatosPersonales => Object.hasOwn(COLUMNAS, campo);

/** UPDATE dinámico y seguro: nombres de columna de la lista blanca, valores como parámetros. */
export async function actualizar(usuarioId: string, cambios: CambiosPerfil, db: Db = pool): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [usuarioId];
  for (const [campo, valor] of Object.entries(cambios)) {
    if (!esCampo(campo) || valor === undefined) continue; // campo no permitido: se ignora
    params.push(valor);
    sets.push(`${COLUMNAS[campo]} = $${params.length}`);
  }
  if (sets.length === 0) return;
  await db.query(`UPDATE perfiles SET ${sets.join(', ')} WHERE usuario_id = $1`, params);
}
