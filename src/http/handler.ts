import type { Request, RequestHandler, Response } from 'express';
import type { z, ZodType } from 'zod';
import { UnauthorizedError, ValidationError, type DetalleError } from '../utils/errors.js';
import type { UsuarioAutenticado } from '../types/index.js';

/** Esquemas opcionales para cada parte de la petición */
export interface Esquemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

// Si hay esquema, el tipo es el que produce Zod; si no, undefined.
type Salida<E, K extends keyof Esquemas> = E extends Record<K, infer S extends ZodType> ? z.output<S> : undefined;

/** Datos ya validados y con su tipo deducido automáticamente de los esquemas */
export interface DatosValidados<E extends Esquemas> {
  params: Salida<E, 'params'>;
  query: Salida<E, 'query'>;
  body: Salida<E, 'body'>;
}

const PARTES = ['params', 'query', 'body'] as const;

/** Valida params, query y body. Si algo falla lanza ValidationError (400) con TODOS los errores. */
export function validar<E extends Esquemas>(req: Request, esquemas: E): DatosValidados<E> {
  const errores: DetalleError[] = [];
  const datos: Record<string, unknown> = {};

  for (const parte of PARTES) {
    const esquema = esquemas[parte];
    if (!esquema) continue;
    const resultado = esquema.safeParse(req[parte] ?? {});
    if (resultado.success) {
      datos[parte] = resultado.data;
      continue;
    }
    for (const issue of resultado.error.issues) {
      const campo = issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : issue.path.join('.');
      errores.push({ ubicacion: parte, campo: campo || parte, mensaje: issue.message });
    }
  }

  if (errores.length > 0) throw new ValidationError(errores);
  // Zod ya comprobó la forma de cada parte, así que esta conversión es segura
  return datos as unknown as DatosValidados<E>;
}

/**
 * Crea un controlador que primero valida la petición y luego llama a tu función
 * con los datos ya TIPADOS. Así es imposible usar un dato sin validar.
 *
 *   export const crear = handler({ body: crearCursoSchema }, async ({ body }, req, res) => { ... })
 */
export function handler<E extends Esquemas>(
  esquemas: E,
  fn: (datos: DatosValidados<E>, req: Request, res: Response) => Promise<unknown> | unknown,
): RequestHandler {
  return async (req, res) => {
    const datos = validar(req, esquemas);
    await fn(datos, req, res);
  };
}

/** Devuelve el usuario autenticado o lanza 401. Úsalo en rutas protegidas por authenticate. */
export function usuarioDe(req: Request): UsuarioAutenticado {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
