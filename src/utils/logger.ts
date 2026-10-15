import { pino } from 'pino';
import { env } from '../config/env.js';

// Logs estructurados en JSON. En desarrollo se muestran "bonitos" con pino-pretty.
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    // Nunca escribir secretos en los logs
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.password', '*.token'],
    censor: '[OCULTO]',
  },
  ...(env.NODE_ENV === 'development' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
  }),
});
