import type { Request, Response } from 'express';
import { handler, usuarioDe } from '../../http/handler.js';
import * as authService from './auth.service.js';
import { loginSchema } from './auth.schemas.js';
import { NOMBRE_COOKIE, opcionesCookie } from './tokens.js';

const contexto = (req: Request) => ({ userAgent: req.get('user-agent'), ip: req.ip });
const leerCookie = (req: Request): string | undefined => req.cookies?.[NOMBRE_COOKIE];
const borrarCookie = (res: Response) => res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(), maxAge: undefined });

export const login = handler({ body: loginSchema }, async ({ body }, req, res) => {
  const { usuario, accessToken, refreshToken } = await authService.login(body, contexto(req));
  res.cookie(NOMBRE_COOKIE, refreshToken, opcionesCookie());
  res.json({ accessToken, usuario });
});

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { accessToken, refreshToken } = await authService.refrescar(leerCookie(req), contexto(req));
    res.cookie(NOMBRE_COOKIE, refreshToken, opcionesCookie());
    res.json({ accessToken });
  } catch (error) {
    borrarCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(leerCookie(req));
  borrarCookie(res);
  res.status(204).end();
}

export function yo(req: Request, res: Response): void {
  res.json({ usuario: usuarioDe(req) });
}
