import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './estudiantes.controller.js';

export const estudiantesRouter: Router = Router();
estudiantesRouter.use(authenticate);

estudiantesRouter.post('/', authorize('admin'), controller.crear);
estudiantesRouter.get('/', authorize('admin', 'profesor'), controller.listar);
estudiantesRouter.get('/:id', controller.obtener); // la regla fina está en el servicio
estudiantesRouter.patch('/:id', authorize('admin'), controller.actualizar);
