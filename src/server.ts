import { crearApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { logger } from './utils/logger.js';

// server.ts arranca el proceso: verifica la BD, escucha el puerto y gestiona el apagado.
async function iniciar() {
  await pool.query('SELECT 1'); // si la BD no responde, fallamos al arrancar
  logger.info('Conectado a PostgreSQL');

  const app = crearApp();
  const server = app.listen(env.PORT, (error?: Error) => {
    // En Express 5 el callback recibe el error si no se pudo abrir el puerto (p. ej. ya está en uso)
    if (error) {
      logger.fatal({ err: error }, `No se pudo escuchar en el puerto ${env.PORT}`);
      process.exit(1);
    }
    logger.info(`API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Tiempos de espera del servidor HTTP
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  // ---------- Apagado ordenado (graceful shutdown) ----------
  let cerrando = false;
  async function apagar(senal: NodeJS.Signals): Promise<void> {
    if (cerrando) return;
    cerrando = true;
    logger.info(`${senal} recibido: cerrando de forma ordenada...`);

    // Si algo se queda colgado, forzamos la salida a los 10 s
    const forzar = setTimeout(() => {
      logger.error('Cierre forzado por tiempo de espera');
      process.exit(1);
    }, 10_000);
    forzar.unref();

    server.close(async (err) => {
      // 1) ya no acepta peticiones nuevas y terminó las que estaban en curso
      if (err) logger.error({ err }, 'Error cerrando el servidor HTTP');
      await pool.end(); // 2) cierra las conexiones a la BD
      logger.info('Servidor detenido correctamente');
      process.exit(err ? 1 : 0);
    });
    server.closeIdleConnections();
  }

  process.on('SIGTERM', () => apagar('SIGTERM'));
  process.on('SIGINT', () => apagar('SIGINT'));
}

// Errores que nadie capturó: se registran y el proceso termina (PM2/Docker lo reinicia)
process.on('unhandledRejection', (razon) => {
  logger.fatal({ err: razon }, 'Promesa rechazada sin manejar');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Excepción no capturada');
  process.exit(1);
});

iniciar().catch((err) => {
  logger.fatal({ err }, 'No se pudo iniciar la aplicación');
  process.exit(1);
});
