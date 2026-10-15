import type { UsuarioAutenticado } from './index.js';

// "Declaration merging": agregamos la propiedad user al Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: UsuarioAutenticado;
    }
  }
}

export {};
