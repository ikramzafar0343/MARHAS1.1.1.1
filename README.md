# MARHAS 1.1.1.1

**MARHAS** is a full-stack luxury fashion e-commerce platform with a React storefront, Express REST API, MongoDB database, and an admin dashboard for products, orders, inventory, analytics, and storefront content.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./Backend/package.json)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deploy on Render](#deploy-on-render)
- [Deploy on Railway](#deploy-on-railway)
- [Production Notes](#production-notes)
- [Scripts Reference](#scripts-reference)
- [License](#license)

---

## Features

### Customer Storefront
- Product catalog, collections, search & filters
- Product detail pages with gallery
- Shopping cart, wishlist & checkout
- Customer accounts, order history & settings
- Newsletter signup & dynamic storefront content

### Admin Dashboard
- Secure admin authentication (JWT)
- Product & inventory management
- Order management & analytics
- Storefront content CMS
- File uploads for product/media assets

### Backend API
- RESTful API with `/api/v1` prefix
- JWT access & refresh tokens
- Role-based access control
- Rate limiting, Helmet, CORS & input validation (Zod)
- Swagger docs at `/api-docs`
- Health checks at `/api/v1/health`

---

## Tech Stack

| Layer      | Technologies |
|-----------|--------------|
| Frontend  | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, Framer Motion |
| Backend   | Node.js 20+, Express 5, Mongoose, JWT, Multer, Nodemailer, Pino |
| Database  | MongoDB Atlas |
| Storage   | Local (dev), Cloudinary or AWS S3 (production) |

---

## Project Structure

```
MARHAS/
├── Backend/                 # Express API server
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, products, orders, etc.)
│   │   ├── middlewares/
│   │   ├── database/
│   │   └── server.js
│   ├── swagger/openapi.json
│   ├── .env.example
│   ├── railway.toml
│   └── package.json
├── frontend/                # React + Vite SPA
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── railway.toml
│   └── package.json
├── render.yaml              # Render Blueprint (one-click deploy)
└── README.md
```

---

## Prerequisites

- **Node.js** 20 or higher
- **npm** 10+
- **MongoDB Atlas** cluster (free tier works)
- **Cloudinary** account (recommended for production uploads)
- Git

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/ikramzafar0343/MARHAS1.1.1.1.git
cd MARHAS1.1.1.1
```

### 2. Backend setup

```bash
cd Backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets (min 32 characters each)
npm install
npm run seed    # optional — seeds admin user & sample data
npm run dev
```

API runs at: `http://localhost:5000/api/v1`

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Yes | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Min 32 characters |
| `CORS_ORIGIN` | Yes | Comma-separated allowed origins (e.g. `http://localhost:5173`) |
| `APP_URL` | Yes | Frontend URL for emails/links |
| `STORAGE_PROVIDER` | No | `local`, `cloudinary`, or `s3` (use `cloudinary` in production) |
| `CLOUDINARY_*` | If using Cloudinary | Cloud name, API key, API secret |
| `SMTP_*` | No | Email configuration for transactional emails |

See [`Backend/.env.example`](./Backend/.env.example) for the full list.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL including prefix, e.g. `http://localhost:5000/api/v1` |
| `VITE_ASSET_URL` | Yes | Backend host for uploaded media, e.g. `http://localhost:5000` |

See [`frontend/.env.example`](./frontend/.env.example).

> **Important:** Never commit `.env` files. Only `.env.example` is tracked in Git.

---

## API Documentation

When the backend is running:

| Resource | URL |
|----------|-----|
| Swagger UI | `http://localhost:5000/api-docs` |
| Health check | `http://localhost:5000/api/v1/health` |
| Readiness | `http://localhost:5000/api/v1/health/ready` |

---

## Deploy on Render

This repo deploys as **one Docker service** — API and React frontend on the same URL (e.g. `https://marhas.onrender.com`).

The root [`Dockerfile`](./Dockerfile) builds the frontend and serves it from the Express server at `/`.

### Step 1 — MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Add your IP (or `0.0.0.0/0` for cloud hosts) under **Network Access**.
3. Create a database user and copy the connection string.

### Step 2 — Deploy via Blueprint

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect `ikramzafar0343/MARHAS1.1.1.1`.
4. Render will detect `render.yaml` and create one **Docker web service** (`marhas`).

### Step 3 — Set environment variables

**Service (`marhas`):**

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=marhas
JWT_ACCESS_SECRET=<random-32+-char-string>
JWT_REFRESH_SECRET=<random-32+-char-string>
CORS_ORIGIN=https://marhas.onrender.com
APP_URL=https://marhas.onrender.com
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

> `VITE_API_URL` is not needed — the Docker build uses `/api/v1` on the same domain.
> Render injects `PORT` automatically. Do not hardcode it in production.

### Step 4 — Seed production data (optional)

In the Render shell for `marhas-api`:

```bash
npm run seed
```

---

## Deploy on Railway

Deploy **backend** and **frontend** as **two separate Railway services** from the same GitHub repo.

### Backend service (choose one option)

**Option A — Root directory `Backend` (recommended, no Docker)**

| Setting | Value |
|---------|-------|
| Root Directory | `Backend` |
| Builder | Nixpacks |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check | `/api/v1/health` |

**Option B — Deploy from repo root (Docker)**

| Setting | Value |
|---------|-------|
| Root Directory | `/` (leave empty) |
| Builder | Dockerfile |
| Dockerfile Path | `Dockerfile` |
| Health Check | `/api/v1/health` |

> If you see `open Dockerfile: no such file or directory`, redeploy after pulling the latest `main` — the root `Dockerfile` is included for this setup.

Add the same backend environment variables listed in the Render section. Railway sets `PORT` automatically.

Config file: [`Backend/railway.toml`](./Backend/railway.toml)

### Frontend service

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npx serve -s dist -l $PORT` |

Environment variables:

```
VITE_API_URL=https://<your-backend>.up.railway.app/api/v1
VITE_ASSET_URL=https://<your-backend>.up.railway.app
```

Config file: [`frontend/railway.toml`](./frontend/railway.toml)

### Railway setup steps

1. Go to [Railway](https://railway.app/) → **New Project** → **Deploy from GitHub repo**.
2. Select `MARHAS1.1.1.1`.
3. Add **Service 1** → set root directory to `Backend` → add env vars → deploy.
4. Add **Service 2** → set root directory to `frontend` → add `VITE_*` vars pointing to the backend URL → deploy.
5. Copy each service's public URL and update `CORS_ORIGIN` / `APP_URL` on the backend.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `open Dockerfile: no such file or directory` | Pull latest `main` — root `Dockerfile` is included |
| `Route / not found` JSON on homepage | Redeploy latest `main` — frontend is now bundled in the Docker image |
| CSS MIME type `text/html` error | Hard refresh after redeploy — stale `index.html` was requesting old `/assets/*.css`; server now returns 404 for missing assets instead of HTML |
| API starts but frontend cannot connect | Redeploy; single-service build uses `/api/v1` on the same domain |
| CORS errors in browser | Add your exact frontend URL to backend `CORS_ORIGIN` |
| Upload images return **404** on Render | Local uploads from dev are not on the server. Set `SYNC_DEFAULT_MEDIA=true`, redeploy once, then remove it — or run `npm run reset:content` in Render Shell |
| Uploads disappear after redeploy | Set `STORAGE_PROVIDER=cloudinary` (local disk is ephemeral on cloud hosts) |
| `MONGODB_URI is required` | Add MongoDB Atlas connection string in service environment variables |

---

## Production Notes

1. **File uploads:** Render and Railway use ephemeral disks. Set `STORAGE_PROVIDER=cloudinary` (or `s3`) so uploads persist.
2. **CORS:** `CORS_ORIGIN` must include your exact frontend URL (no trailing slash).
3. **JWT secrets:** Generate strong random strings (32+ characters). Never reuse dev secrets.
4. **SPA routing:** The frontend includes `public/_redirects` and `render.yaml` rewrites so React Router works on static hosts.
5. **HTTPS:** Always use `https://` URLs in production env vars.

---

## Scripts Reference

### Backend (`Backend/`)

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with file watch |
| `npm run seed` | Seed database with admin & sample data |
| `npm test` | Run Jest test suite |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |

---

## License

MIT — see [Backend/package.json](./Backend/package.json).

---

## Author

**MARHAS** — [GitHub: ikramzafar0343](https://github.com/ikramzafar0343)
