import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { env } from '../../config/env.js';
import { pool, withTransaction, type Db } from '../../db/pool.js';
import type { Rol } from '../../types/index.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { verificacionFicticia, verificarPassword } from '../../utils/password.js';
import * as usuariosRepo from '../usuarios/usuarios.repository.js';
import * as authRepo from './auth.repository.js';
import type { LoginInput } from './auth.schemas.js';
import { firmarAccessToken, generarRefreshToken, hashToken } from './tokens.js';

/** Datos de la petición que guardamos junto al refresh token */
export interface ContextoSesion {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const expiracionRefresh = () => new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

async function emitirTokens(
  usuario: { id: string; rol: Rol },
  contexto: ContextoSesion & { familiaId?: string },
  db: Db = pool,
): Promise<Tokens> {
  const refreshToken = generarRefreshToken();
  await authRepo.guardarRefreshToken(
    {
      usuarioId: usuario.id,
      tokenHash: hashToken(refreshToken),
      familiaId: contexto.familiaId ?? randomUUID(),
      expiraEn: expiracionRefresh(),
      userAgent: contexto.userAgent,
      ip: contexto.ip,
    },
    db,
  );
  return { accessToken: firmarAccessToken(usuario), refreshToken };
}

export async function login({ email, password }: LoginInput, contexto: ContextoSesion) {
  const usuario = await usuariosRepo.buscarPorEmailConPassword(email);

  // Mismo mensaje y tiempo similar exista o no el email: evita enumerar usuarios
  if (!usuario) {
    await verificacionFicticia(password);
    throw new UnauthorizedError('Credenciales incorrectas');
  }
  const valida = await verificarPassword(usuario.password_hash, password);
  if (!valida || !usuario.activo) throw new UnauthorizedError('Credenciales incorrectas');

  const tokens = await emitirTokens(usuario, contexto);
  const { password_hash: _omitido, ...publico } = usuario; // nunca devolvemos el hash
  return { usuario: publico, ...tokens };
}

/** Resultado interno: o tokens nuevos, o el motivo del rechazo */
type ResultadoRefresh = { ok: true; tokens: Tokens } | { ok: false; motivo: string };

/**
 * Rotación de refresh tokens:
 * - cada refresh token se usa UNA sola vez y se reemplaza por uno nuevo;
 * - si alguien reutiliza uno ya usado (posible robo), se revoca toda la "familia".
 */
export async function refrescar(refreshToken: string | undefined, contexto: ContextoSesion): Promise<Tokens> {
  if (!refreshToken) throw new UnauthorizedError('Falta el refresh token');

  const resultado = await withTransaction<ResultadoRefresh>(async (client: PoolClient) => {
    const guardado = await authRepo.buscarPorHashParaActualizar(hashToken(refreshToken), client);
    if (!guardado) return { ok: false, motivo: 'Refresh token inválido' };

    if (guardado.revocado_en) {
      await authRepo.revocarFamilia(guardado.familia_id, client); // ¡reutilización detectada!
      return { ok: false, motivo: 'Refresh token reutilizado: sesión cerrada por seguridad' };
    }
    if (guardado.expira_en < new Date()) return { ok: false, motivo: 'La sesión expiró, inicia sesión de nuevo' };

    const usuario = await usuariosRepo.buscarPorId(guardado.usuario_id, client);
    if (!usuario?.activo) return { ok: false, motivo: 'Usuario inactivo' };

    await authRepo.revocar(guardado.id, client);
    const tokens = await emitirTokens(usuario, { ...contexto, familiaId: guardado.familia_id }, client);
    return { ok: true, tokens };
  });

  // Lanzamos el error FUERA de la transacción para que la revocación de la familia sí se guarde
  if (!resultado.ok) throw new UnauthorizedError(resultado.motivo);
  return resultado.tokens;
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (refreshToken) await authRepo.revocarPorHash(hashToken(refreshToken));
}
