import { pool, type Db } from '../../db/pool.js';

export interface RefreshTokenFila {
  id: string;
  usuario_id: string;
  familia_id: string;
  expira_en: Date;
  revocado_en: Date | null;
}

export interface NuevoRefreshToken {
  usuarioId: string;
  tokenHash: string;
  familiaId: string;
  expiraEn: Date;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export async function guardarRefreshToken(t: NuevoRefreshToken, db: Db = pool): Promise<void> {
  await db.query(
    `INSERT INTO refresh_tokens (usuario_id, token_hash, familia_id, expira_en, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [t.usuarioId, t.tokenHash, t.familiaId, t.expiraEn, t.userAgent?.slice(0, 255) ?? null, t.ip ?? null],
  );
}

/** Busca el token y BLOQUEA la fila (FOR UPDATE) para evitar dos rotaciones simultáneas. */
export async function buscarPorHashParaActualizar(tokenHash: string, db: Db): Promise<RefreshTokenFila | null> {
  const { rows } = await db.query<RefreshTokenFila>(
    `SELECT id, usuario_id, familia_id, expira_en, revocado_en
       FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function revocar(id: string, db: Db = pool): Promise<void> {
  await db.query('UPDATE refresh_tokens SET revocado_en = now() WHERE id = $1 AND revocado_en IS NULL', [id]);
}

export async function revocarFamilia(familiaId: string, db: Db = pool): Promise<void> {
  await db.query('UPDATE refresh_tokens SET revocado_en = now() WHERE familia_id = $1 AND revocado_en IS NULL', [familiaId]);
}

export async function revocarTodosDelUsuario(usuarioId: string, db: Db = pool): Promise<void> {
  await db.query('UPDATE refresh_tokens SET revocado_en = now() WHERE usuario_id = $1 AND revocado_en IS NULL', [usuarioId]);
}

export async function revocarPorHash(tokenHash: string, db: Db = pool): Promise<void> {
  await db.query('UPDATE refresh_tokens SET revocado_en = now() WHERE token_hash = $1 AND revocado_en IS NULL', [tokenHash]);
}
