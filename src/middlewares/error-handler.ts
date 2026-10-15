import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

/** Forma de los errores que lanza el driver de PostgreSQL (pg) */
interface ErrorPostgres {
  code: string;
  constraint?: string;
}

const esErrorPostgres = (err: unknown): err is ErrorPostgres =>
  typeof err === 'object' && err !== null && 'code' in err &&
  typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code);

// Traduce errores de PostgreSQL a respuestas comprensibles
function traducirErrorPostgres(err: ErrorPostgres): AppError | null {
  switch (err.code) {
    case '23505': return new AppError(409, 'Ya existe un registro con esos datos', 'DUPLICADO', { restriccion: err.constraint });
    case '23503': return new AppError(409, 'El registro está relacionado con datos inexistentes o en uso', 'REFERENCIA_INVALIDA');
    case '23514': return new AppError(400, 'Un valor no cumple las reglas de la base de datos', 'RESTRICCION', { restriccion: err.constraint });
    case '22P02': return new AppError(400, 'Formato de dato inválido', 'FORMATO_INVALIDO');
    default: return null;
  }
}

/** Convierte cualquier error conocido en un AppError; devuelve null si es un error de programación */
function normalizar(err: unknown): AppError | null {
  if (err instanceof AppError) return err;
  if (typeof err === 'object' && err !== null && 'type' in err) {
    // Errores de express.json(): JSON mal formado o demasiado grande
    if (err.type === 'entity.parse.failed') return new AppError(400, 'El cuerpo no es un JSON válido', 'JSON_INVALIDO');
    if (err.type === 'entity.too.large') return new AppError(413, 'El cuerpo de la solicitud es demasiado grande', 'PAYLOAD_GRANDE');
  }
  if (esErrorPostgres(err)) return traducirErrorPostgres(err);
  return null;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const error = normalizar(err);

  if (error) {
    // Error esperado (operacional): se informa al cliente tal cual
    if (error.statusCode >= 500) req.log?.error({ err }, error.message);
    else req.log?.warn({ codigo: error.codigo }, error.message);

    res.status(error.statusCode).json({
      error: { codigo: error.codigo, mensaje: error.message, detalles: error.detalles, requestId: req.id },
    });
    return;
  }

  // Error de programación: se registra completo, pero el cliente NO ve detalles internos
  req.log?.error({ err }, 'Error no controlado');
  res.status(500).json({
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado',
      requestId: req.id,
      ...(!env.esProduccion && { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
};
