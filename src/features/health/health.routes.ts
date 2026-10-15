import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const healthRouter: Router = Router();

// ¿El proceso está vivo? (no toca dependencias)
healthRouter.get('/live', (_req, res) => {
  res.json({ estado: 'ok', uptime: Math.round(process.uptime()) });
});

// ¿Está listo para recibir tráfico? (verifica la base de datos)
healthRouter.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDeDatos: 'ok' });
  } catch {
    res.status(503).json({ estado: 'no_disponible', baseDeDatos: 'error' });
  }
});
