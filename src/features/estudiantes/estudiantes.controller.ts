import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import * as service from './estudiantes.service.js';
import { actualizarEstudianteSchema, crearEstudianteSchema, listarEstudiantesSchema } from './estudiantes.schemas.js';

export const crear = handler({ body: crearEstudianteSchema }, async ({ body }, _req, res) => {
  res.status(201).json({ data: await service.crear(body) });
});

export const listar = handler({ query: listarEstudiantesSchema }, async ({ query }, req, res) => {
  res.json(await service.listar(usuarioDe(req), query));
});

export const obtener = handler({ params: paramsId }, async ({ params }, req, res) => {
  res.json({ data: await service.obtener(usuarioDe(req), params.id) });
});

export const actualizar = handler({ params: paramsId, body: actualizarEstudianteSchema }, async ({ params, body }, _req, res) => {
  res.json({ data: await service.actualizar(params.id, body) });
});
