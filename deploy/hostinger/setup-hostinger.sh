#!/usr/bin/env bash
# MARHAS Hostinger installer — Ubuntu 24.04 + Docker + PostgreSQL
# Isolates MARHAS in Docker (project: marhas). Does not touch other sites/containers.
#
# Private GitHub repo — set a PAT (repo read) first:
#   export GITHUB_TOKEN=ghp_xxxxxxxx
#   curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" \
#     https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/hostinger/setup-hostinger.sh \
#     -o /tmp/setup-hostinger.sh
#   chmod +x /tmp/setup-hostinger.sh && bash /tmp/setup-hostinger.sh
#
# Or clone then run (also needs token for private repo):
#   git clone --depth 1 -b main "https://${GITHUB_TOKEN}@github.com/ikramzafar0343/MARHAS1.1.1.1.git" /opt/marhas
#   bash /opt/marhas/deploy/hostinger/setup-hostinger.sh
#
# After editing SMTP_PASS in /opt/marhas/deploy/hostinger/.env:
#   bash /opt/marhas/deploy/hostinger/setup-hostinger.sh --continue
set -euo pipefail

APP_DIR="/opt/marhas"
BRANCH="main"
DOMAIN="marhas.pk"
COMPOSE_FILE="deploy/hostinger/docker-compose.yml"
ENV_FILE="deploy/hostinger/.env"
HOST_NGINX_SRC="deploy/hostinger/host-nginx-marhas.pk.conf"
DOCKER_PUBLISH_PORT="5080"
HOSTINGER_IP="72.61.19.3"

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  REPO_URL="https://${GITHUB_TOKEN}@github.com/ikramzafar0343/MARHAS1.1.1.1.git"
else
  REPO_URL="https://github.com/ikramzafar0343/MARHAS1.1.1.1.git"
fi

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run as root: sudo bash setup-hostinger.sh"
  exit 1
fi

echo "==> Hostinger MARHAS deploy (isolated Docker + PostgreSQL)"
echo "    Target IP: ${HOSTINGER_IP}  |  Domain: ${DOMAIN}"
echo "    Will NOT bind host :80/:443 and will NOT modify other Docker projects"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "WARN: GITHUB_TOKEN is unset. Private repos will fail to clone/pull."
  echo "      export GITHUB_TOKEN=ghp_your_pat_with_repo_read"
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates gnupg nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin missing"
  exit 1
fi

echo "==> Cloning or updating MARHAS into ${APP_DIR}..."
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" remote set-url origin "${REPO_URL}"
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

# Avoid leaving the token in git remote permanently
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  git -C "${APP_DIR}" remote set-url origin "https://github.com/ikramzafar0343/MARHAS1.1.1.1.git"
fi

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp deploy/hostinger/.env.example "${ENV_FILE}"
  JWT_ACCESS="$(openssl rand -base64 48)"
  JWT_REFRESH="$(openssl rand -base64 48)"
  PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)"
  sed -i "s|CHANGE_ME_ACCESS_SECRET_MIN_32_CHARS_LONG_VALUE|${JWT_ACCESS}|g" "${ENV_FILE}"
  sed -i "s|CHANGE_ME_REFRESH_SECRET_MIN_32_CHARS_LONG_VALUE|${JWT_REFRESH}|g" "${ENV_FILE}"
  sed -i "s|CHANGE_ME_POSTGRES_PASSWORD|${PG_PASS}|g" "${ENV_FILE}"
  echo ""
  echo "Created ${APP_DIR}/${ENV_FILE}"
  echo "Edit SMTP_PASS (Hostinger mailbox for support@marhas.pk), then:"
  echo "  nano ${APP_DIR}/${ENV_FILE}"
  echo "  bash ${APP_DIR}/deploy/hostinger/setup-hostinger.sh --continue"
  exit 0
fi

if [[ "${1:-}" != "--continue" ]] && grep -Eq 'CHANGE_ME' "${ENV_FILE}"; then
  echo "ERROR: ${APP_DIR}/${ENV_FILE} still has placeholder values."
  echo "Edit it, then run: bash $0 --continue"
  exit 1
fi

grep -q '^SEED_ADMIN_EMAIL=' "${ENV_FILE}" || echo 'SEED_ADMIN_EMAIL=admin@marhas.com' >> "${ENV_FILE}"
grep -q '^SEED_ADMIN_PASSWORD=' "${ENV_FILE}" || echo 'SEED_ADMIN_PASSWORD=Marhas@Admin123' >> "${ENV_FILE}"
grep -q '^SEED_ADMIN_NAME=' "${ENV_FILE}" || echo 'SEED_ADMIN_NAME=MARHAS Admin' >> "${ENV_FILE}"
grep -q '^POSTGRES_USER=' "${ENV_FILE}" || echo 'POSTGRES_USER=marhas' >> "${ENV_FILE}"
grep -q '^POSTGRES_DB=' "${ENV_FILE}" || echo 'POSTGRES_DB=marhas' >> "${ENV_FILE}"

sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' "${ENV_FILE}" || true
sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://marhas.pk,https://www.marhas.pk|' "${ENV_FILE}" || true
sed -i 's|^APP_URL=.*|APP_URL=https://marhas.pk|' "${ENV_FILE}" || true

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "ERROR: POSTGRES_PASSWORD missing in ${ENV_FILE}"
  exit 1
fi

export DATABASE_URL="postgresql://${POSTGRES_USER:-marhas}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-marhas}?schema=public&connection_limit=10"
# Keep .env DATABASE_URL in sync for compose
if grep -q '^DATABASE_URL=' "${ENV_FILE}"; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "${ENV_FILE}"
else
  echo "DATABASE_URL=${DATABASE_URL}" >> "${ENV_FILE}"
fi

echo "==> Building and starting isolated Docker stack (project: marhas)..."
docker compose -p marhas -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --build

echo "==> Waiting for API health..."
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${DOCKER_PUBLISH_PORT}/api/v1/health" >/dev/null 2>&1; then
    echo "    API is healthy"
    break
  fi
  if [[ "$i" -eq 40 ]]; then
    echo "ERROR: API did not become healthy. Check: docker logs marhas-api"
    exit 1
  fi
  sleep 3
done

echo "==> Waiting for readiness (PostgreSQL)..."
for i in $(seq 1 30); do
  READY="$(curl -fsS "http://127.0.0.1:${DOCKER_PUBLISH_PORT}/api/v1/health/ready" 2>/dev/null || true)"
  if echo "${READY}" | grep -q '"status":"ready"'; then
    echo "    Database ready"
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "ERROR: readiness failed. Check: docker logs marhas-api / marhas-db"
    exit 1
  fi
  sleep 3
done

echo "==> Seeding admin + catalog (idempotent)..."
docker compose -p marhas -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T api \
  node src/database/seed.js || {
  echo "WARN: seed failed — run manually after fixing env:"
  echo "  docker compose -p marhas -f ${APP_DIR}/${COMPOSE_FILE} --env-file ${APP_DIR}/${ENV_FILE} exec api node src/database/seed.js"
}

echo "==> Installing host nginx site for ${DOMAIN} only (other sites untouched)..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp "${APP_DIR}/${HOST_NGINX_SRC}" /etc/nginx/sites-available/marhas.pk
ln -sf /etc/nginx/sites-available/marhas.pk /etc/nginx/sites-enabled/marhas.pk
nginx -t
systemctl reload nginx

echo "==> SSL (Let's Encrypt) for ${DOMAIN} only..."
if certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
  certbot renew --quiet || true
else
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}" || {
    echo "SSL pending — in Cloudflare set A records for ${DOMAIN} + www → ${HOSTINGER_IP}, then:"
    echo "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
  }
fi

echo ""
echo "==> MARHAS Hostinger deploy complete (isolated PostgreSQL stack)"
echo "    Docker:   marhas-db + marhas-api + marhas-nginx (127.0.0.1:${DOCKER_PUBLISH_PORT})"
echo "    Health:   http://127.0.0.1:${DOCKER_PUBLISH_PORT}/api/v1/health"
echo "    Ready:    http://127.0.0.1:${DOCKER_PUBLISH_PORT}/api/v1/health/ready"
echo "    Public:   https://${DOMAIN}"
echo "    Env:      ${APP_DIR}/${ENV_FILE}"
echo "    Admin:    admin@marhas.com / Marhas@Admin123"
echo ""
echo "Cloudflare DNS:"
echo "  marhas.pk     A  ${HOSTINGER_IP}"
echo "  www.marhas.pk A  ${HOSTINGER_IP}"
echo "  SSL/TLS mode: Full"
