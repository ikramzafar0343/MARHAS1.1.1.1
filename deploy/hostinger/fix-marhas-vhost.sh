#!/usr/bin/env bash
# Attach marhas.pk to the existing Docker nginx on :80 (e.g. Zermae front proxy).
# Handles published :80 AND host-network nginx (PORTS column empty).
# Does not replace other sites — only adds server_name marhas.pk / www.
set -euo pipefail

DOMAIN="marhas.pk"
MARHAS_CONTAINER="marhas-nginx"
HEALTH_PATH="/api/v1/health"
USE_HOST_PROXY=0
FRONT=""

echo "==> Locating front nginx (published :80 or host network)..."

# 1) Container with published host port 80
FRONT="$(
  docker ps --format '{{.Names}}\t{{.Ports}}' \
    | awk -F'\t' '$2 ~ /(^|[, ])0\.0\.0\.0:80->|:::80->|:80->80/ { print $1; exit }'
)"
if [[ -z "${FRONT}" ]]; then
  FRONT="$(
    docker ps --format '{{.Names}}\t{{.Ports}}' \
      | awk -F'\t' '$2 ~ /:80->/ { print $1; exit }'
  )"
fi

# 2) Host-network nginx (common on Hostinger multi-site) — inspect NetworkMode
if [[ -z "${FRONT}" ]]; then
  while IFS= read -r name; do
    [[ -z "${name}" || "${name}" == "${MARHAS_CONTAINER}" ]] && continue
    mode="$(docker inspect -f '{{.HostConfig.NetworkMode}}' "${name}" 2>/dev/null || true)"
    image="$(docker inspect -f '{{.Config.Image}}' "${name}" 2>/dev/null || true)"
    if [[ "${mode}" == "host" ]] && echo "${image}${name}" | grep -qi 'nginx'; then
      FRONT="${name}"
      USE_HOST_PROXY=1
      break
    fi
  done < <(docker ps --format '{{.Names}}')
fi

# 3) Fallback: any running *nginx* that is not marhas-nginx
if [[ -z "${FRONT}" ]]; then
  FRONT="$(
    docker ps --format '{{.Names}}' \
      | grep -Ei 'nginx' \
      | grep -vx "${MARHAS_CONTAINER}" \
      | head -1
  )"
  if [[ -n "${FRONT}" ]]; then
    mode="$(docker inspect -f '{{.HostConfig.NetworkMode}}' "${FRONT}" 2>/dev/null || true)"
    [[ "${mode}" == "host" ]] && USE_HOST_PROXY=1
  fi
fi

# 4) Confirm something is listening on :80 (informational)
if command -v ss >/dev/null 2>&1; then
  echo "    Host listeners on :80:"
  ss -tlnp 2>/dev/null | grep -E ':80\s' | sed 's/^/      /' || echo "      (none via ss)"
fi

if [[ -z "${FRONT}" ]]; then
  echo "ERROR: No front nginx container found."
  docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}'
  exit 1
fi

echo "    Front proxy container: ${FRONT}"
echo "    Host-network / 127.0.0.1:5080 proxy: ${USE_HOST_PROXY}"

if ! docker ps --format '{{.Names}}' | grep -qx "${MARHAS_CONTAINER}"; then
  echo "ERROR: ${MARHAS_CONTAINER} is not running. Start MARHAS first."
  exit 1
fi

UPSTREAM="marhas-nginx:80"
if [[ "${USE_HOST_PROXY}" -eq 1 ]]; then
  # Host-network nginx shares the host stack → hit MARHAS published bind
  UPSTREAM="127.0.0.1:5080"
else
  echo "==> Connecting ${MARHAS_CONTAINER} to ${FRONT}'s Docker network(s)..."
  mapfile -t NETWORKS < <(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${FRONT}")
  for net in "${NETWORKS[@]}"; do
    [[ -z "${net}" ]] && continue
    echo "    network: ${net}"
    docker network connect "${net}" "${MARHAS_CONTAINER}" 2>/dev/null || true
  done
fi

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
echo "    proxy_pass → http://${UPSTREAM}"

echo "==> Writing marhas.pk vhost..."
docker exec -i "${FRONT}" sh -c "cat > '${CONF_DIR}/marhas.pk.conf'" <<EOF
# MARHAS — added by fix-marhas-vhost.sh (isolated from other server_name blocks)
server {
    listen 80;
    listen [::]:80;
    server_name marhas.pk www.marhas.pk;

    client_max_body_size 12M;

    location / {
        proxy_pass http://${UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
echo "      Debug: docker exec ${FRONT} nginx -T | grep -A25 'server_name marhas'"
echo "      Also check if Zermae mounts conf from a host volume that overwrites conf.d."
docker inspect -f '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' "${FRONT}" || true
exit 1
