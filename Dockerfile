# MARHAS full-stack — API + React frontend + Prisma (PostgreSQL)
# Hostinger: used by deploy/hostinger/docker-compose.yml (behind marhas-nginx)
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
ENV VITE_API_URL=/api/v1
ENV VITE_ASSET_URL=
RUN npm run build && test -f dist/index.html && test -d dist/assets

FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache tini openssl

COPY Backend/package*.json ./
COPY Backend/prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY Backend/ .
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p logs src/uploads \
  && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./docker-entrypoint.sh"]
