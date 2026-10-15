import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

// La carpeta /migrations está en la raíz del proyecto. Esta ruta funciona tanto
// desde src/db (desarrollo con tsx) como desde dist/db (código compilado).
const carpeta = fileURLToPath(new URL('../../migrations/', import.meta.url));

/** Aplica, en orden, los archivos .sql que aún no se han ejecutado. */
export async function migrar(pool: Pool, log: (mensaje: string) => void = console.log): Promise<void> {
  const client = await pool.connect();
  try {
    // Bloqueo para que dos procesos no migren a la vez
    await client.query('SELECT pg_advisory_lock(727274)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre      varchar(255) PRIMARY KEY,
        aplicada_en timestamptz NOT NULL DEFAULT now()
      )`);

    const { rows } = await client.query<{ nombre: string }>('SELECT nombre FROM schema_migrations');
    const aplicadas = new Set(rows.map((r) => r.nombre));
    const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();

    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;
      const sql = await readFile(carpeta + archivo, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
        await client.query('COMMIT');
        log(`✔ Migración aplicada: ${archivo}`);
      } catch (error) {
        await client.query('ROLLBACK');
        const mensaje = error instanceof Error ? error.message : String(error);
        throw new Error(`Falló la migración ${archivo}: ${mensaje}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(727274)').catch(() => {});
    client.release();
  }
}
