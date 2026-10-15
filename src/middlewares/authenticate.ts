import type { RequestHandler } from 'express';
import { verificarAccessToken } from '../features/auth/tokens.js';
import * as usuariosRepo from '../features/usuarios/usuarios.repository.js';
import { UnauthorizedError } from '../utils/errors.js';

/** Exige un access token válido en el header Authorization: Bearer <token>. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const [tipo, token] = (req.get('authorization') ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new UnauthorizedError('Falta el token de acceso');

  const payload = verificarAccessToken(token); // lanza 401 si es inválido o expiró

  // Consultamos la BD: si el usuario fue desactivado o cambió de rol, se aplica al instante.
  const usuario = await usuariosRepo.buscarPorId(payload.sub);
  if (!usuario || !usuario.activo) throw new UnauthorizedError('Usuario inactivo o inexistente');

  req.user = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    profesorId: usuario.profesor_id,
    estudianteId: usuario.estudiante_id,
  };
  next();
};
