# API Académica (Express 5 + TypeScript + PostgreSQL)

API REST para gestionar estudiantes, profesores, cursos, calificaciones y reportes,
con autenticación por tokens (JWT + refresh token rotativo) y roles (admin, profesor, estudiante).

## Requisitos
- Node.js 22 o superior
- PostgreSQL 15 o superior

## Puesta en marcha (desarrollo)
```bash
npm install
cp .env.example .env        # y ajusta los valores
npm run db:migrate
npm run db:seed
npm run dev                 # tsx: ejecuta TypeScript directamente y recarga al guardar
```

## Comprobar tipos y pruebas
```bash
npm run typecheck           # tsc sin generar archivos
npm test                    # usa la base de datos de .env.test
```

## Producción
```bash
npm ci
npm run build               # compila src/ -> dist/
npm run db:migrate:prod
npm start                   # node dist/server.js
```
