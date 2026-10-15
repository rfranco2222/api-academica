import pg from 'pg';
import type { PoolClient, QueryResultRow } from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Tipos: NUMERIC llega como texto por defecto (para no perder precisión).
// Nuestras notas tienen 2 decimales, así que es seguro convertirlas a número.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor: string) => Number.parseFloat(valor));
// DATE se devuelve como texto 'YYYY-MM-DD' para evitar desfases de zona horaria.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor: string) => valor);

// UN solo pool para toda la aplicación, con límites y timeouts.
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX, // conexiones simultáneas máximas
  idleTimeoutMillis: 30_000, // cierra conexiones inactivas tras 30 s
  connectionTimeoutMillis: 5_000, // error si no consigue conexión en 5 s
  statement_timeout: 10_000, // ninguna consulta puede durar más de 10 s
  application_name: 'api-academica',
});

pool.on('error', (err) => {
  logger.error({ err }, 'Error inesperado en una conexión inactiva del pool');
});

/** Algo capaz de ejecutar consultas: el pool o un cliente dentro de una transacción. */
export type Db = Pick<pg.Pool, 'query'> | PoolClient;

/** Ejecuta una consulta parametrizada y tipada. NUNCA concatenes valores en el SQL. */
export async function query<T extends QueryResultRow>(texto: string, parametros?: unknown[], db: Db = pool) {
  return db.query<T>(texto, parametros);
}

/**
 * Ejecuta varias operaciones en una transacción: o todas se guardan o ninguna.
 * La función recibe un "client" que debes pasar a los repositorios.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
