import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './calificaciones.controller.js';

// /cursos/:cursoId/calificaciones  (mergeParams para leer :cursoId del router padre)
export const calificacionesDeCursoRouter: Router = Router({ mergeParams: true });
calificacionesDeCursoRouter.use(authorize('profesor', 'admin'));
calificacionesDeCursoRouter.get('/', controller.listarPorCurso);
calificacionesDeCursoRouter.post('/', controller.crear);

// /calificaciones/:id
export const calificacionesRouter: Router = Router();
calificacionesRouter.use(authenticate, authorize('profesor', 'admin'));
calificacionesRouter.patch('/:id', controller.actualizar);
calificacionesRouter.delete('/:id', controller.eliminar);
