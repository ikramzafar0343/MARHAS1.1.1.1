#!/usr/bin/env bash
# MARHAS VPS installer — Ubuntu 24.04
# Run on your VPS as root: bash setup-marhas.sh
set -euo pipefail

APP_DIR="/opt/marhas"
REPO_URL="https://github.com/ikramzafar0343/MARHAS1.1.1.1.git"
BRANCH="main"
SERVICE_NAME="marhas"
DOMAIN="marhas.pk"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run as root: sudo bash setup-marhas.sh"
  exit 1
fi

echo "==> Installing system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates gnupg nginx certbot python3-certbot-nginx

echo "==> Installing MongoDB (local)..."
if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -qq
  apt-get install -y -qq mongodb-org
fi
systemctl enable mongod
systemctl start mongod

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Adding swap (helps frontend build on 2GB RAM)..."
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Cloning or updating MARHAS..."
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull origin "$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

if [[ ! -f "$APP_DIR/Backend/.env" ]]; then
  cp "$APP_DIR/deploy/vps/env.template" "$APP_DIR/Backend/.env"
  echo ""
  echo "IMPORTANT: Edit $APP_DIR/Backend/.env with MongoDB URI and JWT secrets, then run:"
  echo "  sudo bash $APP_DIR/deploy/vps/setup-marhas.sh --continue"
  exit 0
fi

if [[ "${1:-}" != "--continue" ]] && grep -q 'CHANGE_ME' "$APP_DIR/Backend/.env" 2>/dev/null; then
  echo "ERROR: $APP_DIR/Backend/.env still has placeholder values."
  echo "Edit it, then run: sudo bash $0 --continue"
  exit 1
fi

echo "==> Building frontend..."
cd "$APP_DIR/frontend"
export VITE_API_URL=/api/v1
export VITE_ASSET_URL=
npm ci --silent
npm run build

echo "==> Installing backend dependencies..."
cd "$APP_DIR/Backend"
npm ci --omit=dev --silent
rm -rf public
cp -r "$APP_DIR/frontend/dist" public
mkdir -p src/uploads/images src/uploads/products src/uploads/avatars logs
chown -R www-data:www-data "$APP_DIR/Backend" 2>/dev/null || true

echo "==> Installing systemd service..."
cp "$APP_DIR/deploy/vps/marhas.service" "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo "==> Configuring nginx..."
cp "$APP_DIR/deploy/vps/nginx-marhas.pk.conf" /etc/nginx/sites-available/marhas.pk
ln -sf /etc/nginx/sites-available/marhas.pk /etc/nginx/sites-enabled/marhas.pk
nginx -t
systemctl reload nginx

echo "==> SSL (Let's Encrypt)..."
if certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
  certbot renew --quiet || true
else
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || {
    echo "SSL failed — point marhas.pk DNS to this server IP first, then run:"
    echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  }
fi

echo ""
echo "==> MARHAS deploy complete"
echo "    App:    http://127.0.0.1:5000"
echo "    Site:   https://$DOMAIN"
echo "    Logs:   journalctl -u $SERVICE_NAME -f"
echo "    Env:    $APP_DIR/Backend/.env"
systemctl --no-pager status "$SERVICE_NAME" || true
