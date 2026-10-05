# MARHAS Backend API

Production-ready Node.js REST API for the MARHAS luxury fashion e-commerce platform.

## Tech Stack

- **Node.js 20+** · **Express 5** · **PostgreSQL 16** · **Prisma**
- **JWT** access + refresh tokens with rotation
- **Zod** validation · **Pino** logging · **Swagger UI**
- **Jest + Supertest** · **Docker**

## Quick Start

```bash
cd Backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets (32+ characters)

npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

API: `http://localhost:5000/api/v1`  
Swagger: `http://localhost:5000/api-docs`

## PostgreSQL

Local example:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/marhas?schema=public&connection_limit=10
```

Production (Hostinger Docker): Postgres runs as `marhas-db` on the internal `marhas_net` network — see [deploy/hostinger](../deploy/hostinger/README.md).

## Environment Variables

See `.env.example` for all options. Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `JWT_ACCESS_SECRET` | Min 32 characters |
| `JWT_REFRESH_SECRET` | Min 32 characters |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Watch mode |
| `npm start` | Production start |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run seed` | Seed admin + catalog |
| `npm test` | Jest (requires Postgres `marhas_test`) |

Seed admin defaults:

```env
SEED_ADMIN_EMAIL=admin@marhas.com
SEED_ADMIN_PASSWORD=Marhas@Admin123
SEED_ADMIN_NAME=MARHAS Admin
```
