import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './profesores.controller.js';

export const profesoresRouter: Router = Router();
profesoresRouter.use(authenticate);

profesoresRouter.post('/', authorize('admin'), controller.crear);
profesoresRouter.get('/', authorize('admin'), controller.listar);
profesoresRouter.get('/:id', authorize('admin', 'profesor'), controller.obtener);
profesoresRouter.patch('/:id', authorize('admin'), controller.actualizar);
