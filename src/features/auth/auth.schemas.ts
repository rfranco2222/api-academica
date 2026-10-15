import { z } from 'zod';

export const loginSchema = z.strictObject({
  email: z.email('Email inválido').max(255).toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
});

// El tipo TypeScript se deduce del esquema: una sola fuente de verdad
export type LoginInput = z.output<typeof loginSchema>;
