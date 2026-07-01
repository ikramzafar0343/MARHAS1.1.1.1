#!/usr/bin/env bash
# Run ONCE on VPS after SSH login:
#   curl -fsSL https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/vps/quick-deploy.sh | sudo bash

set -euo pipefail

curl -fsSL https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/vps/setup-marhas.sh -o /tmp/setup-marhas.sh
chmod +x /tmp/setup-marhas.sh
bash /tmp/setup-marhas.sh || true

JWT_ACCESS="$(openssl rand -base64 48)"
JWT_REFRESH="$(openssl rand -base64 48)"

cat > /opt/marhas/Backend/.env <<EOF
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
MONGODB_URI=mongodb://127.0.0.1:27017/marhas
DATABASE_NAME=marhas
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://marhas.pk,https://www.marhas.pk
APP_URL=https://marhas.pk
STORAGE_PROVIDER=local
UPLOAD_DIR=src/uploads
UPLOAD_MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
SEED_ADMIN_EMAIL=admin@marhas.com
SEED_ADMIN_PASSWORD=Marhas@Admin123
SEED_ADMIN_NAME=MARHAS Admin
EOF

bash /tmp/setup-marhas.sh --continue

echo ""
echo "Done. Set Cloudflare SSL/TLS to FULL, then open https://marhas.pk"
