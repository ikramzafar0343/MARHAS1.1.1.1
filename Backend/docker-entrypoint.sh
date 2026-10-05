#!/bin/sh
set -eu

echo "==> Running Prisma migrate deploy..."
npx prisma migrate deploy

echo "==> Starting MARHAS API..."
exec node src/server.js
