import { Router } from 'express';
import { authRouter } from './features/auth/auth.routes.js';
import { usuariosRouter } from './features/usuarios/usuarios.routes.js';
import { perfilRouter } from './features/perfil/perfil.routes.js';
import { estudiantesRouter } from './features/estudiantes/estudiantes.routes.js';
import { profesoresRouter } from './features/profesores/profesores.routes.js';
import { cursosRouter } from './features/cursos/cursos.routes.js';
import { calificacionesRouter } from './features/calificaciones/calificaciones.routes.js';
import { reportesRouter } from './features/reportes/reportes.routes.js';

export const apiRouter: Router = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/perfil', perfilRouter);
apiRouter.use('/estudiantes', estudiantesRouter);
apiRouter.use('/profesores', profesoresRouter);
apiRouter.use('/cursos', cursosRouter);
apiRouter.use('/calificaciones', calificacionesRouter);
apiRouter.use('/reportes', reportesRouter);
