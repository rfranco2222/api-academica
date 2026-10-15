import { z } from 'zod';
import { ROLES } from '../types/index.js';

// Piezas de validación reutilizables en toda la API

export const uuid = (nombre = 'id') => z.uuid(`${nombre} debe ser un UUID válido`);
export const paramsId = z.strictObject({ id: uuid() });

export const rol = z.enum(ROLES);

export const email = z.email('Email inválido').max(255).toLowerCase();

// Contraseña robusta: 10+ caracteres, con letras y números
export const password = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128)
  .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
  .regex(/\d/, 'La contraseña debe contener números');

// Texto limpio: sin espacios sobrantes y sin vacíos
export const texto = (max: number) => z.string().trim().min(1, 'No puede estar vacío').max(max);

// Cédula dominicana: 000-0000000-0 o 11 dígitos; se guarda solo con dígitos
export const cedula = z
  .string()
  .trim()
  .regex(/^\d{3}-?\d{7}-?\d$/, 'Cédula inválida (formato 000-0000000-0)')
  .transform((v) => v.replaceAll('-', ''));

export const telefono = z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, 'Teléfono inválido');

export const fecha = z.iso.date('Fecha inválida (formato AAAA-MM-DD)');

// Datos personales usados al crear cualquier cuenta
export const datosPersonales = {
  nombres: texto(80),
  apellidos: texto(80),
  cedula: cedula.optional(),
  fechaNacimiento: fecha.optional(),
  telefono: telefono.optional(),
  direccion: texto(255).optional(),
};

const datosPersonalesSchema = z.object(datosPersonales);
export type DatosPersonales = z.output<typeof datosPersonalesSchema>;

/** Datos necesarios para crear una cuenta (usuario + perfil) */
export type DatosCuenta = DatosPersonales & { email: string; password: string };
