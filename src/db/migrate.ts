import { pool } from './pool.js';
import { migrar } from './migrator.js';

try {
  await migrar(pool);
  console.log('Base de datos al día.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
