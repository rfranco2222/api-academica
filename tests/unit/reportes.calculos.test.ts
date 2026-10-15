import { describe, expect, it } from 'vitest';
import { construirReporte, estadoDe, promedioPonderado } from '../../src/features/reportes/reportes.calculos.js';

describe('promedioPonderado', () => {
  it('calcula el promedio según el peso de cada evaluación', () => {
    // (80*30 + 90*70) / 100 = 87
    expect(promedioPonderado([{ nota: 80, peso: 30 }, { nota: 90, peso: 70 }])).toBe(87);
  });

  it('devuelve null si no hay calificaciones', () => {
    expect(promedioPonderado([])).toBeNull();
  });
});

describe('estadoDe', () => {
  it.each([
    [70, 'aprobado'],
    [69.99, 'reprobado'],
    [null, 'sin_calificaciones'],
  ])('un promedio de %s queda %s', (promedio, esperado) => {
    expect(estadoDe(promedio)).toBe(esperado);
  });
});

describe('construirReporte', () => {
  it('agrupa las calificaciones por curso y resume', () => {
    const filas = [
      { curso_id: 'c1', codigo: 'MAT', curso: 'Mate', periodo: '2026-1', calificacion_id: 'a', evaluacion: 'P1', nota: 60, peso: 1 },
      { curso_id: 'c1', codigo: 'MAT', curso: 'Mate', periodo: '2026-1', calificacion_id: 'b', evaluacion: 'P2', nota: 70, peso: 1 },
      { curso_id: 'c2', codigo: 'LEN', curso: 'Lengua', periodo: '2026-1', calificacion_id: 'c', evaluacion: 'P1', nota: 95, peso: 1 },
      { curso_id: 'c3', codigo: 'HIS', curso: 'Historia', periodo: '2026-1', calificacion_id: null },
    ];
    const r = construirReporte(filas);

    expect(r.cursos).toHaveLength(3);
    expect(r.cursos[0]).toMatchObject({ promedio: 65, estado: 'reprobado' });
    expect(r.cursos[2]).toMatchObject({ promedio: null, estado: 'sin_calificaciones', calificaciones: [] });
    expect(r.resumen).toMatchObject({ cursos: 3, aprobados: 1, reprobados: 1, promedioGeneral: 80 });
  });
});
