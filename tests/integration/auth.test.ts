import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Response } from 'supertest';
import type { EstudianteFila } from '../../src/features/estudiantes/estudiantes.repository.js';
import { app, crearEstudiante, limpiarBD, PASSWORD, pool, request } from '../helpers/db.js';

/** Extrae 'refresh_token=...' de la cabecera Set-Cookie */
const cookieRefresh = (res: Response): string => {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((c) => c.startsWith('refresh_token='))?.split(';')[0] ?? '';
};

describe('Autenticación', () => {
  let estudiante: EstudianteFila;
  beforeEach(async () => {
    await limpiarBD();
    estudiante = await crearEstudiante();
  });
  afterAll(() => pool.end());

  it('inicia sesión y devuelve access token + cookie httpOnly', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: estudiante.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.usuario).not.toHaveProperty('password_hash'); // ¡nunca exponer el hash!
    expect(cookieRefresh(res)).not.toBe('');
    expect(String(res.headers['set-cookie'])).toMatch(/HttpOnly/);
  });

  it('responde lo mismo si el email no existe o la contraseña es incorrecta', async () => {
    const a = await request(app).post('/api/v1/auth/login').send({ email: 'noexiste@test.com', password: 'x' });
    const b = await request(app).post('/api/v1/auth/login').send({ email: estudiante.email, password: 'incorrecta' });

    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.mensaje).toBe(b.body.error.mensaje);
  });

  it('protege las rutas: sin token -> 401, token falso -> 401', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401);
  });

  it('rota el refresh token y detecta su reutilización', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: estudiante.email, password: PASSWORD });
    const cookie1 = cookieRefresh(login);

    const r1 = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie1);
    expect(r1.status).toBe(200);
    const cookie2 = cookieRefresh(r1);
    expect(cookie2).not.toBe(cookie1); // token nuevo

    // Un atacante reutiliza el token viejo -> se revoca toda la familia
    const robo = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie1);
    expect(robo.status).toBe(401);

    // ...y el token "bueno" también quedó invalidado
    const r2 = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie2);
    expect(r2.status).toBe(401);
  });

  it('logout revoca el refresh token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: estudiante.email, password: PASSWORD });
    const cookie = cookieRefresh(login);

    expect((await request(app).post('/api/v1/auth/logout').set('Cookie', cookie)).status).toBe(204);
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });
});
