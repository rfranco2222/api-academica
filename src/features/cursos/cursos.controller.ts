import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import * as service from './cursos.service.js';
import {
  actualizarCursoSchema, crearCursoSchema, inscribirSchema, listarCursosSchema, paramsInscripcion,
} from './cursos.schemas.js';

export const crear = handler({ body: crearCursoSchema }, async ({ body }, _req, res) => {
  res.status(201).json({ data: await service.crear(body) });
});

export const listar = handler({ query: listarCursosSchema }, async ({ query }, req, res) => {
  res.json({ data: await service.listar(usuarioDe(req), query) });
});

export const obtener = handler({ params: paramsId }, async ({ params }, req, res) => {
  res.json({ data: await service.obtener(usuarioDe(req), params.id) });
});

export const actualizar = handler({ params: paramsId, body: actualizarCursoSchema }, async ({ params, body }, _req, res) => {
  res.json({ data: await service.actualizar(params.id, body) });
});

export const inscribir = handler({ params: paramsId, body: inscribirSchema }, async ({ params, body }, _req, res) => {
  res.status(201).json({ data: await service.inscribir(params.id, body.estudianteId) });
});

export const desinscribir = handler({ params: paramsInscripcion }, async ({ params }, _req, res) => {
  await service.desinscribir(params.id, params.estudianteId);
  res.status(204).end();
});

export const estudiantes = handler({ params: paramsId }, async ({ params }, req, res) => {
  res.json({ data: await service.estudiantes(usuarioDe(req), params.id) });
});
