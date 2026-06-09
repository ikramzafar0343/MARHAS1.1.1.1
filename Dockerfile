# MARHAS full-stack — API + React frontend (single Render/Railway service)
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Same-origin deploy: API and UI share one domain (e.g. marhas.onrender.com)
ENV VITE_API_URL=/api/v1
ENV VITE_ASSET_URL=

RUN npm run build

FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache tini

COPY Backend/package*.json ./
RUN npm ci --omit=dev

COPY Backend/ .
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p logs src/uploads

ENV NODE_ENV=production

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
