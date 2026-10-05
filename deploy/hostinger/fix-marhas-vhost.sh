#!/usr/bin/env bash
# Attach marhas.pk to the existing Docker nginx on :80 (e.g. Zermae front proxy).
# Does not replace that site — only adds a server_name block for marhas.pk / www.
set -euo pipefail

DOMAIN="marhas.pk"
MARHAS_CONTAINER="marhas-nginx"
HEALTH_PATH="/api/v1/health"

echo "==> Locating container publishing host port 80..."
FRONT="$(
  docker ps --format '{{.Names}}\t{{.Ports}}' \
    | awk -F'\t' '$2 ~ /(^|[, ])0\.0\.0\.0:80->|:::80->|:80->80/ { print $1; exit }'
)"

if [[ -z "${FRONT}" ]]; then
  # Fallback: any published :80 mapping
  FRONT="$(
    docker ps --format '{{.Names}}\t{{.Ports}}' \
      | awk -F'\t' '$2 ~ /:80->/ { print $1; exit }'
  )"
fi

if [[ -z "${FRONT}" ]]; then
  echo "ERROR: No Docker container publishing port 80 was found."
  echo "Running containers:"
  docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}'
  exit 1
fi

echo "    Front proxy container: ${FRONT}"

if ! docker ps --format '{{.Names}}' | grep -qx "${MARHAS_CONTAINER}"; then
  echo "ERROR: ${MARHAS_CONTAINER} is not running. Start MARHAS first:"
  echo "  cd /opt/marhas && docker compose -p marhas -f deploy/hostinger/docker-compose.yml --env-file deploy/hostinger/.env up -d"
  exit 1
fi

echo "==> Connecting ${MARHAS_CONTAINER} to ${FRONT}'s Docker network(s)..."
mapfile -t NETWORKS < <(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${FRONT}")
if [[ "${#NETWORKS[@]}" -eq 0 ]]; then
  echo "ERROR: Could not read networks for ${FRONT}"
  exit 1
fi

for net in "${NETWORKS[@]}"; do
  [[ -z "${net}" ]] && continue
  echo "    network: ${net}"
  docker network connect "${net}" "${MARHAS_CONTAINER}" 2>/dev/null || true
done

echo "==> Detecting nginx conf drop-in directory inside ${FRONT}..."
CONF_DIR=""
for candidate in /etc/nginx/conf.d /etc/nginx/http.d /etc/nginx/sites-enabled; do
  if docker exec "${FRONT}" sh -c "test -d '${candidate}'"; then
    CONF_DIR="${candidate}"
    break
  fi
done

if [[ -z "${CONF_DIR}" ]]; then
  echo "ERROR: No nginx conf.d / http.d / sites-enabled found in ${FRONT}"
  docker exec "${FRONT}" sh -c 'ls -la /etc/nginx 2>/dev/null || true'
  exit 1
fi

echo "    Using ${CONF_DIR}/marhas.pk.conf"

echo "==> Writing marhas.pk vhost (proxy → ${MARHAS_CONTAINER}:80)..."
docker exec -i "${FRONT}" sh -c "cat > '${CONF_DIR}/marhas.pk.conf'" <<'EOF'
# MARHAS — added by fix-marhas-vhost.sh (isolated from other server_name blocks)
server {
    listen 80;
    listen [::]:80;
    server_name marhas.pk www.marhas.pk;

    client_max_body_size 12M;

    location / {
        proxy_pass http://marhas-nginx:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

echo "==> Testing and reloading front nginx..."
docker exec "${FRONT}" nginx -t
docker exec "${FRONT}" nginx -s reload

echo "==> Verifying..."
sleep 1
OK_LOCAL="$(curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1${HEALTH_PATH}" || true)"
OK_DIRECT="$(curl -fsS "http://127.0.0.1:5080${HEALTH_PATH}" || true)"

echo "    MARHAS :5080 -> ${OK_DIRECT:0:80}"
echo "    Host :80 Host=${DOMAIN} -> ${OK_LOCAL:0:80}"

if echo "${OK_LOCAL}" | grep -q '"status":"ok"'; then
  echo ""
  echo "==> SUCCESS: marhas.pk now routes to MARHAS (Zermae untouched)."
  echo "    Open https://marhas.pk (Cloudflare SSL/TLS = Full, purge cache if needed)."
  exit 0
fi

echo ""
echo "WARN: Front :80 still not returning MARHAS health JSON."
echo "      Check Cloudflare A records for marhas.pk → this server IP,"
echo "      and that ${FRONT} includes ${CONF_DIR}/*.conf."
echo "      Debug: docker exec ${FRONT} nginx -T | grep -A20 'server_name marhas'"
exit 1
