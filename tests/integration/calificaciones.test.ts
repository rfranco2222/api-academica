import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { CursoFila } from '../../src/features/cursos/cursos.repository.js';
import * as cursosService from '../../src/features/cursos/cursos.service.js';
import type { EstudianteFila } from '../../src/features/estudiantes/estudiantes.repository.js';
import type { ProfesorFila } from '../../src/features/profesores/profesores.repository.js';
import { app, crearCurso, crearEstudiante, crearProfesor, limpiarBD, pool, request, tokenDe } from '../helpers/db.js';

describe('Calificaciones y reportes', () => {
  let profesor: ProfesorFila, otroProfesor: ProfesorFila;
  let estudiante: EstudianteFila, otroEstudiante: EstudianteFila;
  let curso: CursoFila;
  let tokenProf: string;

  beforeEach(async () => {
    await limpiarBD();
    profesor = await crearProfesor();
    otroProfesor = await crearProfesor();
    estudiante = await crearEstudiante();
    otroEstudiante = await crearEstudiante(); // NO inscrito
    curso = await crearCurso(profesor.id);
    await cursosService.inscribir(curso.id, estudiante.id);
    tokenProf = await tokenDe(profesor.email);
  });
  afterAll(() => pool.end());

  const calificar = (token: string, body: object, cursoId = curso.id) =>
    request(app).post(`/api/v1/cursos/${cursoId}/calificaciones`).set('Authorization', `Bearer ${token}`).send(body);

  it('el profesor del curso registra una calificación', async () => {
    const res = await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'Parcial 1', nota: 88.5, peso: 40 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ nota: 88.5, peso: 40 });
  });

  it('otro profesor NO puede calificar en un curso ajeno (IDOR)', async () => {
    const res = await calificar(await tokenDe(otroProfesor.email), { estudianteId: estudiante.id, evaluacion: 'X', nota: 100 });
    expect(res.status).toBe(403);
  });

  it('no se puede calificar a un estudiante que no está inscrito', async () => {
    const res = await calificar(tokenProf, { estudianteId: otroEstudiante.id, evaluacion: 'X', nota: 50 });
    expect(res.status).toBe(400);
  });

  it('rechaza notas fuera de rango y evaluaciones duplicadas', async () => {
    expect((await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'P', nota: 101 })).status).toBe(400);
    await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'P', nota: 90 }).expect(201);
    expect((await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'P', nota: 80 })).status).toBe(409);
  });

  it('un estudiante no puede registrar calificaciones', async () => {
    const res = await calificar(await tokenDe(estudiante.email), { estudianteId: estudiante.id, evaluacion: 'Yo', nota: 100 });
    expect(res.status).toBe(403);
  });

  it('el estudiante ve su reporte con promedio ponderado', async () => {
    await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'Parcial', nota: 60, peso: 40 }).expect(201);
    await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'Final', nota: 90, peso: 60 }).expect(201);

    const res = await request(app).get('/api/v1/reportes/mis-calificaciones')
      .set('Authorization', `Bearer ${await tokenDe(estudiante.email)}`);

    expect(res.status).toBe(200);
    const [c] = res.body.data.cursos;
    expect(c.calificaciones).toHaveLength(2);
    expect(c.promedio).toBe(78); // (60*40 + 90*60) / 100
    expect(c.estado).toBe('aprobado');
  });

  it('un estudiante no puede ver los datos de otro estudiante', async () => {
    const res = await request(app).get(`/api/v1/estudiantes/${otroEstudiante.id}`)
      .set('Authorization', `Bearer ${await tokenDe(estudiante.email)}`);
    expect(res.status).toBe(404);
  });

  it('el profesor solo puede editar calificaciones de su curso', async () => {
    const { body } = await calificar(tokenProf, { estudianteId: estudiante.id, evaluacion: 'Quiz', nota: 70 });
    const url = `/api/v1/calificaciones/${body.data.id}`;

    expect((await request(app).patch(url).set('Authorization', `Bearer ${await tokenDe(otroProfesor.email)}`).send({ nota: 100 })).status).toBe(403);

    const ok = await request(app).patch(url).set('Authorization', `Bearer ${tokenProf}`).send({ nota: 75 });
    expect(ok.status).toBe(200);
    expect(ok.body.data.nota).toBe(75);
  });
});
