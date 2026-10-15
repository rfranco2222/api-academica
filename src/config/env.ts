import { z } from 'zod';

// Todas las variables de entorno se validan al arrancar.
// Si falta alguna o tiene un formato incorrecto, la app NO inicia.
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().startsWith('postgres', 'DATABASE_URL debe ser una URL de PostgreSQL'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'Formato: 15m, 1h, 7d...').default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((valor) => valor.split(',').map((o) => o.trim()).filter(Boolean)),

  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error('❌ Variables de entorno inválidas:\n' + z.prettifyError(resultado.error));
  process.exit(1);
}

// El tipo de env se DEDUCE del esquema: si agregas una variable, TypeScript la conoce sola.
export const env = Object.freeze({
  ...resultado.data,
  esProduccion: resultado.data.NODE_ENV === 'production',
  esTest: resultado.data.NODE_ENV === 'test',
});

export type Env = typeof env;
