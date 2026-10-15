import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import * as service from './profesores.service.js';
import { actualizarProfesorSchema, crearProfesorSchema, listarProfesoresSchema } from './profesores.schemas.js';

export const crear = handler({ body: crearProfesorSchema }, async ({ body }, _req, res) => {
  res.status(201).json({ data: await service.crear(body) });
});

export const listar = handler({ query: listarProfesoresSchema }, async ({ query }, _req, res) => {
  res.json(await service.listar(query));
});

export const obtener = handler({ params: paramsId }, async ({ params }, req, res) => {
  res.json({ data: await service.obtener(usuarioDe(req), params.id) });
});

export const actualizar = handler({ params: paramsId, body: actualizarProfesorSchema }, async ({ params, body }, _req, res) => {
  res.json({ data: await service.actualizar(params.id, body) });
});
