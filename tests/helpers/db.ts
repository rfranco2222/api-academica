import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import * as cursosService from '../../src/features/cursos/cursos.service.js';
import * as estudiantesService from '../../src/features/estudiantes/estudiantes.service.js';
import * as profesoresService from '../../src/features/profesores/profesores.service.js';
import * as usuariosService from '../../src/features/usuarios/usuarios.service.js';

export const app = crearApp();
export const PASSWORD = 'Clave12345segura';

let contador = 0;
const unico = () => `${Date.now()}${++contador}`;

/** Vacía todas las tablas entre tests */
export async function limpiarBD() {
  await pool.query(`TRUNCATE usuarios, perfiles, estudiantes, profesores, cursos,
    inscripciones, calificaciones, refresh_tokens RESTART IDENTITY CASCADE`);
}

// ---------- Fábricas de datos ----------
export const crearAdmin = () =>
  usuariosService.crearAdmin({ email: `admin${unico()}@test.com`, password: PASSWORD, nombres: 'Ada', apellidos: 'Admin' });

export const crearProfesor = () =>
  profesoresService.crear({ email: `prof${unico()}@test.com`, password: PASSWORD, nombres: 'Pedro', apellidos: 'Profe', especialidad: 'Física' });

export const crearEstudiante = () =>
  estudiantesService.crear({ email: `est${unico()}@test.com`, password: PASSWORD, nombres: 'Eva', apellidos: 'Estudiante', matricula: `M${unico()}`, nivel: '1ro' });

export const crearCurso = (profesorId: string) =>
  cursosService.crear({ codigo: `C${unico()}`.slice(0, 20), nombre: 'Curso de prueba', periodo: '2026-1', profesorId });

/** Inicia sesión y devuelve el access token */
export async function tokenDe(email: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken as string;
}

export { pool, request };
