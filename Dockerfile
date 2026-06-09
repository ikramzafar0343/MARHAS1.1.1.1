# MARHAS API — build from repository root (Railway / Render Docker)
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache tini

COPY Backend/package*.json ./
RUN npm ci --omit=dev

COPY Backend/ .

RUN mkdir -p logs src/uploads

ENV NODE_ENV=production

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
