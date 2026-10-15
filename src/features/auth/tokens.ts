import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ROLES, type Rol } from '../../types/index.js';
import { UnauthorizedError } from '../../utils/errors.js';

const OPCIONES_JWT = { algorithm: 'HS256', issuer: 'api-academica', audience: 'api-academica-clientes' } as const;

/** Lo que guardamos dentro del access token */
export interface PayloadAccess {
  sub: string; // id del usuario
  rol: Rol;
}

/** Access token: corto (15 min), viaja en el header Authorization. */
export function firmarAccessToken(usuario: { id: string; rol: Rol }): string {
  return jwt.sign({ rol: usuario.rol }, env.JWT_ACCESS_SECRET, {
    ...OPCIONES_JWT,
    subject: usuario.id,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verificarAccessToken(token: string): PayloadAccess {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [OPCIONES_JWT.algorithm], // nunca aceptes "none" ni otros algoritmos
      issuer: OPCIONES_JWT.issuer,
      audience: OPCIONES_JWT.audience,
    });
  } catch (error) {
    const expirado = error instanceof jwt.TokenExpiredError;
    throw new UnauthorizedError(expirado ? 'El token expiró' : 'Token inválido');
  }
  // jwt.verify devuelve un tipo genérico: comprobamos que tenga lo que esperamos
  if (typeof payload === 'string' || !payload.sub || !ROLES.includes(payload.rol)) {
    throw new UnauthorizedError('Token inválido');
  }
  return { sub: payload.sub, rol: payload.rol };
}

/** Refresh token: valor aleatorio opaco (no es JWT). Viaja en una cookie httpOnly. */
export const generarRefreshToken = (): string => randomBytes(48).toString('base64url');

/** En la BD guardamos solo el hash SHA-256: si roban la BD, los tokens no sirven. */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const NOMBRE_COOKIE = 'refresh_token';

export function opcionesCookie(): CookieOptions {
  return {
    httpOnly: true, // JavaScript del navegador NO puede leerla (protege contra XSS)
    secure: env.esProduccion || env.COOKIE_SAMESITE === 'none', // solo por HTTPS
    sameSite: env.COOKIE_SAMESITE,
    path: '/api/v1/auth', // solo se envía a las rutas de autenticación
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}
