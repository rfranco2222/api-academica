import type { CorsOptions } from 'cors';
import { env } from './env.js';
import { AppError } from '../utils/errors.js';

// Lista blanca estricta: solo estos orígenes pueden llamar a la API desde un navegador.
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Sin "origin" = peticiones que no vienen de un navegador (Postman, curl, servidor a servidor)
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    callback(new AppError(403, `Origen no permitido por CORS: ${origin}`, 'CORS'));
  },
  credentials: true, // permite enviar la cookie del refresh token
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
  maxAge: 600, // el navegador cachea el preflight 10 minutos
};
