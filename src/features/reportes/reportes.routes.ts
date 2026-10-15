import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './reportes.controller.js';

export const reportesRouter: Router = Router();
reportesRouter.use(authenticate);

reportesRouter.get('/mis-calificaciones', authorize('estudiante'), controller.misCalificaciones);
reportesRouter.get('/estudiantes/:id', authorize('admin'), controller.deEstudiante);
reportesRouter.get('/cursos/:id', authorize('admin', 'profesor'), controller.deCurso);
