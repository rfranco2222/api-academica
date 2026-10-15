// Tipos compartidos por toda la aplicación

export const ROLES = ['admin', 'profesor', 'estudiante'] as const;
export type Rol = (typeof ROLES)[number]; // 'admin' | 'profesor' | 'estudiante'

/** Lo que guardamos en req.user tras verificar el token */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: Rol;
  profesorId: string | null; // null si no es profesor
  estudianteId: string | null; // null si no es estudiante
}

/** Respuesta paginada genérica */
export interface Paginado<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; paginas: number };
}
