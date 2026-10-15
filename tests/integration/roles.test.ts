import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { UsuarioFila } from '../../src/features/usuarios/usuarios.repository.js';
import { app, crearAdmin, crearEstudiante, crearProfesor, limpiarBD, pool, request, tokenDe } from '../helpers/db.js';

describe('Roles y gestión de usuarios', () => {
  let admin: UsuarioFila;
  let tokenAdmin: string;
  beforeEach(async () => {
    await limpiarBD();
    admin = await crearAdmin();
    tokenAdmin = await tokenDe(admin.email);
  });
  afterAll(() => pool.end());

  it('un estudiante NO puede acceder a la gestión de usuarios', async () => {
    const est = await crearEstudiante();
    const res = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${await tokenDe(est.email)}`);
    expect(res.status).toBe(403);
  });

  it('el admin crea un estudiante con su información personal', async () => {
    const res = await request(app)
      .post('/api/v1/estudiantes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        email: 'NUEVO@Test.com', password: 'Clave12345segura', nombres: '  Juan ', apellidos: 'Soto',
        cedula: '001-1234567-8', matricula: '2026-0099', nivel: '2do',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'nuevo@test.com', nombres: 'Juan', cedula: '00112345678' });
  });

  it('valida los datos y explica cada error', async () => {
    const res = await request(app)
      .post('/api/v1/estudiantes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ email: 'malo', password: '123', nombres: '', rol: 'admin' });

    expect(res.status).toBe(400);
    const campos = res.body.error.detalles.map((d: { campo: string }) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['email', 'password', 'nombres', 'matricula', 'rol']));
  });

  it('rechaza emails duplicados con 409', async () => {
    const est = await crearEstudiante();
    const res = await request(app)
      .post('/api/v1/profesores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ email: est.email.toUpperCase(), password: 'Clave12345segura', nombres: 'A', apellidos: 'B', especialidad: 'Arte' });
    expect(res.status).toBe(409);
  });

  it('cambia el rol de un estudiante a profesor y cierra sus sesiones', async () => {
    const est = await crearEstudiante();
    const tokenViejo = await tokenDe(est.email);

    const res = await request(app)
      .patch(`/api/v1/usuarios/${est.usuario_id}/rol`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'profesor', especialidad: 'Química' });

    expect(res.status).toBe(200);
    expect(res.body.data.rol).toBe('profesor');
    // El token viejo sigue siendo válido 15 min, pero el rol se lee de la BD en cada petición:
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenViejo}`);
    expect(me.body.usuario.rol).toBe('profesor');
  });

  it('el admin no puede quitarse su propio rol', async () => {
    const res = await request(app)
      .patch(`/api/v1/usuarios/${admin.id}/rol`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'estudiante', matricula: 'X', nivel: 'Y' });
    expect(res.status).toBe(403);
  });

  it('un usuario desactivado pierde el acceso inmediatamente', async () => {
    const prof = await crearProfesor();
    const tokenProf = await tokenDe(prof.email);

    await request(app).patch(`/api/v1/usuarios/${prof.usuario_id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`).send({ activo: false }).expect(200);

    const res = await request(app).get('/api/v1/perfil').set('Authorization', `Bearer ${tokenProf}`);
    expect(res.status).toBe(401);
  });

  it('cada usuario edita solo sus datos permitidos del perfil', async () => {
    const est = await crearEstudiante();
    const token = await tokenDe(est.email);

    const ok = await request(app).patch('/api/v1/perfil').set('Authorization', `Bearer ${token}`).send({ telefono: '809-555-1234' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.telefono).toBe('809-555-1234');

    // Intentar cambiarse el nombre o la cédula no está permitido
    const no = await request(app).patch('/api/v1/perfil').set('Authorization', `Bearer ${token}`).send({ nombres: 'Hacker' });
    expect(no.status).toBe(400);
  });
});
