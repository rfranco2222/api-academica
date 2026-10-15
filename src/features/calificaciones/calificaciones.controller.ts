import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import * as service from './calificaciones.service.js';
import { actualizarCalificacionSchema, crearCalificacionSchema, paramsCurso } from './calificaciones.schemas.js';

export const crear = handler({ params: paramsCurso, body: crearCalificacionSchema }, async ({ params, body }, req, res) => {
  res.status(201).json({ data: await service.crear(usuarioDe(req), params.cursoId, body) });
});

export const listarPorCurso = handler({ params: paramsCurso }, async ({ params }, req, res) => {
  res.json({ data: await service.listarPorCurso(usuarioDe(req), params.cursoId) });
});

export const actualizar = handler({ params: paramsId, body: actualizarCalificacionSchema }, async ({ params, body }, req, res) => {
  res.json({ data: await service.actualizar(usuarioDe(req), params.id, body) });
});

export const eliminar = handler({ params: paramsId }, async ({ params }, req, res) => {
  await service.eliminar(usuarioDe(req), params.id);
  res.status(204).end();
});
