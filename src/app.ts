import './config/zod.js';
import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { healthRouter } from './features/health/health.routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { limiteGeneral } from './middlewares/rate-limiters.js';
import { apiRouter } from './routes.js';
import { logger } from './utils/logger.js';

// app.ts SOLO construye la aplicación. No escucha puertos ni conecta la BD.
// Así los tests pueden importarla con supertest sin levantar un servidor.
export function crearApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

  // 1) Request-ID + logs estructurados de cada petición
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const entrante = req.headers['x-request-id'];
        const id = typeof entrante === 'string' && /^[\w-]{8,64}$/.test(entrante) ? entrante : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url.startsWith('/health') },
    }),
  );

  // 2) Seguridad
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(limiteGeneral);

  // 3) Parseo del cuerpo con límite de tamaño + cookies + compresión
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(compression());

  // 4) Rutas
  app.use('/health', healthRouter);
  app.use('/api/v1', apiRouter);

  // 5) 404 y manejador de errores (SIEMPRE al final)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
