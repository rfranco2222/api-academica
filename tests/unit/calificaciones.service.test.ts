import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CursoFila } from '../../src/features/cursos/cursos.repository.js';
import type { CalificacionFila } from '../../src/features/calificaciones/calificaciones.repository.js';
import type { UsuarioAutenticado } from '../../src/types/index.js';

// Reemplazamos los repositorios por "dobles": el servicio se prueba SIN base de datos
vi.mock('../../src/features/cursos/cursos.service.js', () => ({ obtenerOFallar: vi.fn() }));
vi.mock('../../src/features/cursos/cursos.repository.js', () => ({ buscarInscripcion: vi.fn() }));
vi.mock('../../src/features/calificaciones/calificaciones.repository.js', () => ({ crear: vi.fn() }));

const cursosService = await import('../../src/features/cursos/cursos.service.js');
const cursosRepo = await import('../../src/features/cursos/cursos.repository.js');
const repo = await import('../../src/features/calificaciones/calificaciones.repository.js');
const service = await import('../../src/features/calificaciones/calificaciones.service.js');

// vi.mocked() le dice a TypeScript que estas funciones ahora son mocks
const obtenerCurso = vi.mocked(cursosService.obtenerOFallar);
const buscarInscripcion = vi.mocked(cursosRepo.buscarInscripcion);
const crearCalificacion = vi.mocked(repo.crear);

const profesor: UsuarioAutenticado = { id: 'u1', email: 'p@test.com', rol: 'profesor', profesorId: 'p1', estudianteId: null };
const datos = { estudianteId: 'e1', evaluacion: 'Parcial', nota: 90, peso: 1 };

/** Curso de prueba: solo nos importa a quién pertenece */
const cursoDe = (profesorId: string) => ({ id: 'c1', profesor_id: profesorId }) as CursoFila;

describe('calificaciones.service.crear', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra la nota si el profesor es dueño del curso y el estudiante está inscrito', async () => {
    obtenerCurso.mockResolvedValue(cursoDe('p1'));
    buscarInscripcion.mockResolvedValue({ id: 'i1' });
    crearCalificacion.mockResolvedValue({ id: 'n1', nota: 90 } as CalificacionFila);

    const resultado = await service.crear(profesor, 'c1', datos);

    expect(resultado).toEqual({ id: 'n1', nota: 90 });
    expect(crearCalificacion).toHaveBeenCalledWith(expect.objectContaining({ inscripcionId: 'i1', registradaPor: 'p1' }));
  });

  it('rechaza a un profesor que no es dueño del curso', async () => {
    obtenerCurso.mockResolvedValue(cursoDe('OTRO'));

    await expect(service.crear(profesor, 'c1', datos)).rejects.toMatchObject({ statusCode: 403 });
    expect(crearCalificacion).not.toHaveBeenCalled();
  });

  it('rechaza calificar a un estudiante que no está inscrito', async () => {
    obtenerCurso.mockResolvedValue(cursoDe('p1'));
    buscarInscripcion.mockResolvedValue(null);

    await expect(service.crear(profesor, 'c1', datos)).rejects.toMatchObject({ statusCode: 400 });
  });
});
