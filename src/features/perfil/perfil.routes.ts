import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './perfil.controller.js';

export const perfilRouter: Router = Router();
perfilRouter.use(authenticate);

perfilRouter.get('/', controller.obtenerMio);
perfilRouter.patch('/', controller.actualizarMio);

perfilRouter.get('/:usuarioId', authorize('admin'), controller.obtenerDeUsuario);
perfilRouter.patch('/:usuarioId', authorize('admin'), controller.actualizarDeUsuario);
