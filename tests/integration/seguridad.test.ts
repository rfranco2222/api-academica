import { afterAll, describe, expect, it } from 'vitest';
import { app, pool, request } from '../helpers/db.js';

describe('Seguridad de la aplicación', () => {
  afterAll(() => pool.end());

  it('envía cabeceras de seguridad (helmet) y oculta X-Powered-By', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('CORS: permite el origen de la lista blanca', async () => {
    const res = await request(app).get('/health/live').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('CORS: rechaza orígenes desconocidos', async () => {
    const res = await request(app).get('/health/live').set('Origin', 'https://sitio-malicioso.com');
    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rechaza cuerpos JSON demasiado grandes (413)', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@a.com', password: 'x'.repeat(200_000) }));
    expect(res.status).toBe(413);
  });

  it('rechaza JSON mal formado (400) sin filtrar detalles internos', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{malo');
    expect(res.status).toBe(400);
    expect(res.body.error).not.toHaveProperty('stack');
  });

  it('responde 404 en JSON para rutas inexistentes', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('sin token no se procesa nada, aunque el id sea inválido', async () => {
    const res = await request(app).get('/api/v1/cursos/123').set('Authorization', 'Bearer x');
    expect(res.status).toBe(401); // primero autentica; nunca llega a la BD con un id inválido
  });
});
