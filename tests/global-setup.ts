import pg from 'pg';
import { migrar } from '../src/db/migrator.js';

// Se ejecuta UNA vez antes de todos los tests: deja la BD de pruebas vacía y migrada.
export default async function (): Promise<void> {
  process.loadEnvFile('.env.test');
  const url = process.env.DATABASE_URL ?? '';
  if (!url.includes('test')) {
    throw new Error('Por seguridad, la BD de pruebas debe contener "test" en su nombre');
  }
  const pool = new pg.Pool({ connectionString: url });
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrar(pool, () => {});
  await pool.end();
}
