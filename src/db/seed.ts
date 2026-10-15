import { pool, withTransaction } from './pool.js';
import { crearCuenta } from '../features/usuarios/usuarios.service.js';
import * as usuariosRepo from '../features/usuarios/usuarios.repository.js';

// Datos iniciales para desarrollo. Se puede ejecutar varias veces sin duplicar.
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

try {
  if (!adminEmail || !adminPassword) throw new Error('Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env');

  if (await usuariosRepo.buscarPorEmailConPassword(adminEmail)) {
    console.log('El seed ya fue ejecutado (el admin existe).');
  } else {
    await withTransaction(async (client) => {
      await crearCuenta(client, { email: adminEmail, password: adminPassword, nombres: 'Admin', apellidos: 'Principal' }, 'admin');

      const prof = await crearCuenta(client,
        { email: 'profesora@academico.test', password: 'Profesora123', nombres: 'Ana', apellidos: 'Martínez' }, 'profesor');
      const { rows: [profesor] } = await client.query<{ id: string }>(
        'INSERT INTO profesores (usuario_id, especialidad) VALUES ($1, $2) RETURNING id', [prof.id, 'Matemáticas']);

      const { rows: [curso] } = await client.query<{ id: string }>(
        `INSERT INTO cursos (codigo, nombre, periodo, profesor_id) VALUES ('MAT-101', 'Matemática I', '2026-1', $1) RETURNING id`,
        [profesor!.id]);

      const nombres: [string, string][] = [['Luis', 'Pérez'], ['María', 'Gómez'], ['Carlos', 'Díaz']];
      for (const [i, [n, a]] of nombres.entries()) {
        const u = await crearCuenta(client,
          { email: `estudiante${i + 1}@academico.test`, password: 'Estudiante123', nombres: n, apellidos: a }, 'estudiante');
        const { rows: [est] } = await client.query<{ id: string }>(
          'INSERT INTO estudiantes (usuario_id, matricula, nivel) VALUES ($1, $2, $3) RETURNING id',
          [u.id, `2026-000${i + 1}`, '1ro Bachillerato']);
        await client.query('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES ($1, $2)', [est!.id, curso!.id]);
      }
    });
    console.log('✔ Seed completado. Usuarios de prueba:');
    console.log(`  admin:      ${adminEmail} / ${adminPassword}`);
    console.log('  profesora:  profesora@academico.test / Profesora123');
    console.log('  estudiante: estudiante1@academico.test / Estudiante123');
  }
} catch (error) {
  console.error('Error en el seed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
