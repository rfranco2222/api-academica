import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup-env.ts'], // carga .env.test antes de cada archivo
    globalSetup: ['./tests/global-setup.ts'], // prepara la BD de pruebas una vez
    fileParallelism: false, // los tests de integración comparten la BD
    testTimeout: 15_000,
  },
});
