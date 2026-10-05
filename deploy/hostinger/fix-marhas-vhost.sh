#!/usr/bin/env bash
# Attach marhas.pk to Zermae's Docker nginx (often host-network + bind-mounted nginx.conf).
# Patches the host nginx.conf to include conf.d when missing, then adds marhas.pk → :5080.
set -euo pipefail

DOMAIN="marhas.pk"
MARHAS_CONTAINER="marhas-nginx"
HEALTH_PATH="/api/v1/health"
USE_HOST_PROXY=0
FRONT=""
HOST_NGINX_CONF=""

echo "==> Locating front nginx (published :80 or host network)..."

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

if [[ -z "${FRONT}" ]]; then
  echo "ERROR: No front nginx container found."
  docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}'
  exit 1
fi

mode="$(docker inspect -f '{{.HostConfig.NetworkMode}}' "${FRONT}" 2>/dev/null || true)"
[[ "${mode}" == "host" ]] && USE_HOST_PROXY=1

echo "    Front proxy container: ${FRONT}"
echo "    Host-network / 127.0.0.1:5080 proxy: ${USE_HOST_PROXY}"

if ! docker ps --format '{{.Names}}' | grep -qx "${MARHAS_CONTAINER}"; then
  echo "ERROR: ${MARHAS_CONTAINER} is not running."
  exit 1
fi

# Find bind-mounted nginx.conf on the host (Zermae pattern)
while IFS= read -r line; do
  src="${line%% *}"
  dst="${line#* }"
  if [[ "${dst}" == "/etc/nginx/nginx.conf" || "${dst}" == *"/nginx.conf" ]]; then
    HOST_NGINX_CONF="${src}"
    break
  fi
done < <(docker inspect -f '{{range .Mounts}}{{.Source}} {{.Destination}}{{"\n"}}{{end}}' "${FRONT}")

if [[ -n "${HOST_NGINX_CONF}" && -f "${HOST_NGINX_CONF}" ]]; then
  echo "    Host-mounted nginx.conf: ${HOST_NGINX_CONF}"
  if ! grep -qE 'include[[:space:]]+/etc/nginx/conf\.d/\*\.conf' "${HOST_NGINX_CONF}"; then
    echo "==> Adding include /etc/nginx/conf.d/*.conf; to host nginx.conf..."
    if grep -qE '[[:space:]]*http[[:space:]]*\{' "${HOST_NGINX_CONF}"; then
      # Insert include once, right after the first http { line
      awk '
        BEGIN { done=0 }
        {
          print
          if (!done && $0 ~ /^[[:space:]]*http[[:space:]]*\{/) {
            print "    include /etc/nginx/conf.d/*.conf;"
            done=1
          }
        }
      ' "${HOST_NGINX_CONF}" > "${HOST_NGINX_CONF}.marhas.tmp"
      mv "${HOST_NGINX_CONF}.marhas.tmp" "${HOST_NGINX_CONF}"
    else
      echo "ERROR: No http { block found in ${HOST_NGINX_CONF}"
      exit 1
    fi
  else
    echo "    conf.d include already present"
  fi
else
  echo "    No host bind for nginx.conf (using container filesystem only)"
fi

UPSTREAM="marhas-nginx:80"
if [[ "${USE_HOST_PROXY}" -eq 1 ]]; then
  UPSTREAM="127.0.0.1:5080"
else
  echo "==> Connecting ${MARHAS_CONTAINER} to ${FRONT}'s Docker network(s)..."
  mapfile -t NETWORKS < <(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "${FRONT}")
  for net in "${NETWORKS[@]}"; do
    [[ -z "${net}" ]] && continue
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
  echo "ERROR: No nginx conf.d / http.d / sites-enabled in ${FRONT}"
  exit 1
fi

# Ensure conf.d exists even if image didn't have it
docker exec "${FRONT}" sh -c "mkdir -p '${CONF_DIR}'"

echo "    Using ${CONF_DIR}/marhas.pk.conf → http://${UPSTREAM}"

docker exec -i "${FRONT}" sh -c "cat > '${CONF_DIR}/marhas.pk.conf'" <<EOF
# BEGIN MARHAS
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
# END MARHAS
EOF

# Also drop a copy next to host nginx.conf for operators (not auto-loaded unless mounted)
if [[ -n "${HOST_NGINX_CONF}" ]]; then
  HOST_DIR="$(dirname "${HOST_NGINX_CONF}")"
  cp /dev/null "${HOST_DIR}/marhas.pk.conf.example" 2>/dev/null || true
  docker exec "${FRONT}" cat "${CONF_DIR}/marhas.pk.conf" > "${HOST_DIR}/marhas.pk.conf.example" || true
fi

echo "==> Testing and reloading front nginx..."
if ! docker exec "${FRONT}" nginx -t; then
  echo "ERROR: nginx -t failed. Showing http { head of config:"
  docker exec "${FRONT}" sh -c 'head -n 40 /etc/nginx/nginx.conf'
  exit 1
fi
docker exec "${FRONT}" nginx -s reload

echo "==> Confirming server_name is loaded..."
if ! docker exec "${FRONT}" nginx -T 2>/dev/null | grep -q 'server_name marhas.pk'; then
  echo "ERROR: marhas.pk server block still not in nginx -T output."
  echo "       Dumping include lines from nginx.conf:"
  docker exec "${FRONT}" sh -c 'grep -n include /etc/nginx/nginx.conf || true'
  exit 1
fi
echo "    server_name marhas.pk is active"

echo "==> Verifying health..."
sleep 1
OK_DIRECT="$(curl -fsS "http://127.0.0.1:5080${HEALTH_PATH}" || true)"
OK_LOCAL="$(curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1${HEALTH_PATH}" || true)"
echo "    MARHAS :5080 -> ${OK_DIRECT:0:90}"
echo "    Host :80 Host=${DOMAIN} -> ${OK_LOCAL:0:90}"

if echo "${OK_LOCAL}" | grep -q '"status":"ok"'; then
  echo ""
  echo "==> SUCCESS: marhas.pk routes to MARHAS (Zermae untouched)."
  exit 0
fi

echo ""
echo "WARN: Still not healthy on :80. Response headers:"
curl -sS -D- -o /dev/null -H "Host: ${DOMAIN}" "http://127.0.0.1${HEALTH_PATH}" || true
echo "Active server blocks:"
docker exec "${FRONT}" nginx -T 2>/dev/null | grep -E 'server_name|listen ' | head -40
exit 1
