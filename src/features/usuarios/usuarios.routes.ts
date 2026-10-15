import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './usuarios.controller.js';

export const usuariosRouter: Router = Router();

// Todo este módulo es exclusivo de administradores
usuariosRouter.use(authenticate, authorize('admin'));

usuariosRouter.get('/', controller.listar);
usuariosRouter.post('/', controller.crearAdmin);
usuariosRouter.get('/:id', controller.obtener);
usuariosRouter.patch('/:id/rol', controller.cambiarRol);
usuariosRouter.patch('/:id/estado', controller.cambiarEstado);
