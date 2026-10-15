import { z } from 'zod';
import { handler, usuarioDe } from '../../http/handler.js';
import { paramsId } from '../../utils/schemas.js';
import { periodo } from '../cursos/cursos.schemas.js';
import * as service from './reportes.service.js';

const filtrosSchema = z.strictObject({ periodo: periodo.optional() });

// El estudiante SOLO puede ver su propio reporte: usamos req.user, nunca un id de la URL
export const misCalificaciones = handler({ query: filtrosSchema }, async ({ query }, req, res) => {
  res.json({ data: await service.reporteDeEstudiante(usuarioDe(req).estudianteId, query) });
});

export const deEstudiante = handler({ params: paramsId, query: filtrosSchema }, async ({ params, query }, _req, res) => {
  res.json({ data: await service.reporteDeEstudiante(params.id, query) });
});

export const deCurso = handler({ params: paramsId }, async ({ params }, req, res) => {
  res.json({ data: await service.reporteDeCurso(usuarioDe(req), params.id) });
});
