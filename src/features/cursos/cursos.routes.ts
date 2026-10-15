import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { calificacionesDeCursoRouter } from '../calificaciones/calificaciones.routes.js';
import * as controller from './cursos.controller.js';

export const cursosRouter: Router = Router();
cursosRouter.use(authenticate);

cursosRouter.get('/', controller.listar);
cursosRouter.post('/', authorize('admin'), controller.crear);
cursosRouter.get('/:id', controller.obtener);
cursosRouter.patch('/:id', authorize('admin'), controller.actualizar);

cursosRouter.get('/:id/estudiantes', authorize('admin', 'profesor'), controller.estudiantes);
cursosRouter.post('/:id/inscripciones', authorize('admin'), controller.inscribir);
cursosRouter.delete('/:id/inscripciones/:estudianteId', authorize('admin'), controller.desinscribir);

// Rutas anidadas: /cursos/:cursoId/calificaciones
cursosRouter.use('/:cursoId/calificaciones', calificacionesDeCursoRouter);
