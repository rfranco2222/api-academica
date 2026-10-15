import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import * as service from './usuarios.service.js';
import { cambiarEstadoSchema, cambiarRolSchema, crearAdminSchema, listarUsuariosSchema } from './usuarios.schemas.js';

export const listar = handler({ query: listarUsuariosSchema }, async ({ query }, _req, res) => {
  res.json(await service.listar(query));
});

export const obtener = handler({ params: paramsId }, async ({ params }, _req, res) => {
  res.json({ data: await service.obtener(params.id) });
});

export const crearAdmin = handler({ body: crearAdminSchema }, async ({ body }, _req, res) => {
  res.status(201).json({ data: await service.crearAdmin(body) });
});

export const cambiarRol = handler({ params: paramsId, body: cambiarRolSchema }, async ({ params, body }, req, res) => {
  res.json({ data: await service.cambiarRol(usuarioDe(req), params.id, body) });
});

export const cambiarEstado = handler({ params: paramsId, body: cambiarEstadoSchema }, async ({ params, body }, req, res) => {
  res.json({ data: await service.cambiarEstado(usuarioDe(req), params.id, body.activo) });
});
