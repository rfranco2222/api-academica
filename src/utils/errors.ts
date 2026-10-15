// Errores "operacionales": situaciones esperadas que el cliente debe conocer.
// Todo lo que NO sea un AppError se considera un error de programación (500).

export interface DetalleError {
  ubicacion: string;
  campo: string;
  mensaje: string;
}

export class AppError extends Error {
  readonly esOperacional = true;

  constructor(
    readonly statusCode: number,
    mensaje: string,
    readonly codigo: string = 'ERROR',
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(mensaje = 'Solicitud inválida', detalles?: unknown) {
    super(400, mensaje, 'SOLICITUD_INVALIDA', detalles);
  }
}

export class ValidationError extends AppError {
  constructor(detalles: DetalleError[]) {
    super(400, 'Los datos enviados no son válidos', 'VALIDACION', detalles);
  }
}

export class UnauthorizedError extends AppError {
  constructor(mensaje = 'No autenticado') {
    super(401, mensaje, 'NO_AUTENTICADO');
  }
}

export class ForbiddenError extends AppError {
  constructor(mensaje = 'No tienes permiso para realizar esta acción') {
    super(403, mensaje, 'PROHIBIDO');
  }
}

export class NotFoundError extends AppError {
  constructor(recurso = 'Recurso') {
    super(404, `${recurso} no encontrado`, 'NO_ENCONTRADO');
  }
}

export class ConflictError extends AppError {
  constructor(mensaje = 'El recurso ya existe') {
    super(409, mensaje, 'CONFLICTO');
  }
}
