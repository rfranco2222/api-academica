import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const mensaje = (texto: string) => ({ error: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: texto } });

// Límite general para toda la API
export const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.esTest,
  message: mensaje('Demasiadas solicitudes, intenta más tarde.'),
});

// Límite estricto para el login: protege contra fuerza bruta
export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.esTest,
  message: mensaje('Demasiados intentos de inicio de sesión. Espera 15 minutos.'),
});
