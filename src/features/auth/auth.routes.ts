import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { limiteLogin } from '../../middlewares/rate-limiters.js';
import * as controller from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/login', limiteLogin, controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', authenticate, controller.yo);
