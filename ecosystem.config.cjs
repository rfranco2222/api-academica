// Configuración de PM2 para producción: npm i -g pm2  &&  pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api-academica',
      script: 'dist/server.js', // código compilado con npm run build
      node_args: '--env-file-if-exists=.env --enable-source-maps',
      instances: 'max', // un proceso por núcleo de CPU
      exec_mode: 'cluster', // reparte las peticiones entre procesos
      max_memory_restart: '400M', // reinicia si hay fuga de memoria
      kill_timeout: 12000, // tiempo para el apagado ordenado (graceful shutdown)
      env: { NODE_ENV: 'production' },
    },
  ],
};
