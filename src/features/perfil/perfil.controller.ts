import { handler, usuarioDe } from '../../http/handler.js';
import * as service from './perfil.service.js';
import { actualizarMiPerfilSchema, actualizarPerfilAdminSchema, paramsUsuarioId } from './perfil.schemas.js';

// /perfil -> SIEMPRE el usuario autenticado (req.user), nunca un id enviado por el cliente
export const obtenerMio = handler({}, async (_datos, req, res) => {
  res.json({ data: await service.obtener(usuarioDe(req).id) });
});

export const actualizarMio = handler({ body: actualizarMiPerfilSchema }, async ({ body }, req, res) => {
  res.json({ data: await service.actualizar(usuarioDe(req).id, body) });
});

// /perfil/:usuarioId -> solo administradores
export const obtenerDeUsuario = handler({ params: paramsUsuarioId }, async ({ params }, _req, res) => {
  res.json({ data: await service.obtener(params.usuarioId) });
});

export const actualizarDeUsuario = handler(
  { params: paramsUsuarioId, body: actualizarPerfilAdminSchema },
  async ({ params, body }, _req, res) => {
    res.json({ data: await service.actualizar(params.usuarioId, body) });
  },
);
