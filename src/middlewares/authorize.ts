import type { RequestHandler } from 'express';
import type { Rol } from '../types/index.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/** Permite el paso solo a los roles indicados. Uso: authorize('admin', 'profesor') */
export function authorize(...rolesPermitidos: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!rolesPermitidos.includes(req.user.rol)) return next(new ForbiddenError());
    next();
  };
}
