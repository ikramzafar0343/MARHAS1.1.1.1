# MARHAS Backend API

Production-ready Node.js REST API for the MARHAS luxury fashion e-commerce platform.

## Tech Stack

- **Node.js 20+** · **Express 5** · **MongoDB Atlas** · **Mongoose**
- **JWT** access + refresh tokens with rotation
- **Zod** validation · **Pino** logging · **Swagger UI**
- **Jest + Supertest** · **Docker** · **PM2**

## Quick Start

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT secrets (32+ characters)

npm install
npm run seed
npm run dev
```

API: `http://localhost:5000/api/v1`  
Swagger: `http://localhost:5000/api-docs`

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for development)
4. Copy the connection string into `.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=marhas
```

## Environment Variables

See `.env.example` for all options. Required:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Min 32 characters |
| `JWT_REFRESH_SECRET` | Min 32 characters |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with file watch |
| `npm start` | Production start |
| `npm run seed` | Seed admin, products, CMS, orders |
| `npm test` | Run tests with coverage |

## Default Seed Credentials

```
Email: admin@marhas.com
Password: Marhas@Admin123
Role: SUPER_ADMIN
```

## API Modules

| Prefix | Description |
|--------|-------------|
| `/auth` | Register, login, refresh, password reset, sessions |
| `/products` | Catalog CRUD, search, best sellers |
| `/orders` | Guest/customer checkout |
| `/admin/orders` | Order management |
| `/admin/inventory` | Stock management + restock |
| `/admin/analytics` | Revenue, KPIs, charts |
| `/admin/dashboard` | Dashboard metrics |
| `/content` | Storefront CMS |
| `/uploads` | Image/video/document uploads |
| `/newsletter` | Email subscriptions |
| `/health` | Health + readiness probes |

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

## Docker

```bash
docker compose up --build
```

## PM2 (Production)

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Deployment

### Render / Railway
1. Connect GitHub repo
2. Set root directory to `backend`
3. Build: `npm install`
4. Start: `npm start`
5. Add environment variables from `.env.example`

### VPS / DigitalOcean
```bash
git clone <repo>
cd backend
npm ci --omit=dev
cp .env.example .env
npm run seed
pm2 start ecosystem.config.cjs
```

### AWS
- Run on ECS/EC2 with Dockerfile
- Use DocumentDB or MongoDB Atlas
- Store uploads on S3 (`STORAGE_PROVIDER=s3`)

## Frontend Integration

Set in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

The frontend `services/api.js` already expects Bearer tokens in `luxury_token`.

## Architecture

See `docs/BACKEND_ARCHITECTURE_REPORT.md` for the full frontend audit, collection design, and API mapping.

## License

MIT
