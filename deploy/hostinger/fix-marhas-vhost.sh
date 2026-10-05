#!/usr/bin/env bash
# Attach marhas.pk to Zermae Docker nginx (host-network + bind-mounted nginx.conf).
# CRITICAL: edit bind-mounted files in-place (same inode). Never mv/sed -i replace.
set -euo pipefail

DOMAIN="marhas.pk"
MARHAS_CONTAINER="marhas-nginx"
HEALTH_PATH="/api/v1/health"
FRONT="zermae-nginx-1"
HOST_CONF="/var/www/zermae/deploy/hostinger/nginx.conf"

write_inplace() {
  # $1 = path, stdin = new content — truncates same inode (safe for Docker binds)
  local path="$1"
  local tmp
  tmp="$(mktemp)"
  cat > "${tmp}"
  # Prefer python in-place same-inode write; fallback to cat >
  if command -v python3 >/dev/null 2>&1; then
    python3 - "${path}" "${tmp}" <<'PY'
import sys
path, tmp = sys.argv[1], sys.argv[2]
data = open(tmp, "rb").read()
with open(path, "r+b") as f:
    f.seek(0)
    f.write(data)
    f.truncate()
PY
    rm -f "${tmp}"
  else
    cat "${tmp}" > "${path}"
    rm -f "${tmp}"
  fi
}

echo "==> Front nginx: ${FRONT}"
if ! docker ps --format '{{.Names}}' | grep -qx "${FRONT}"; then
  # auto-detect
  FRONT="$(docker ps --format '{{.Names}}' | grep -Ei 'nginx' | grep -vx "${MARHAS_CONTAINER}" | head -1 || true)"
fi
[[ -n "${FRONT}" ]] || { echo "ERROR: front nginx not found"; exit 1; }

# Resolve host nginx.conf from mounts
detected="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/nginx/nginx.conf"}}{{.Source}}{{end}}{{end}}' "${FRONT}" || true)"
if [[ -n "${detected}" ]]; then
  HOST_CONF="${detected}"
fi
echo "    Host nginx.conf: ${HOST_CONF}"

[[ -f "${HOST_CONF}" ]] || { echo "ERROR: missing ${HOST_CONF}"; exit 1; }
docker ps --format '{{.Names}}' | grep -qx "${MARHAS_CONTAINER}" || { echo "ERROR: ${MARHAS_CONTAINER} not running"; exit 1; }

MARHAS_BLOCK='# BEGIN MARHAS
    server {
        listen 80;
        listen [::]:80;
        server_name marhas.pk www.marhas.pk;
        client_max_body_size 12M;
        location / {
            proxy_pass http://127.0.0.1:5080;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }
    }
# END MARHAS'

echo "==> Embedding marhas.pk server block into host nginx.conf (in-place)..."
python3 - "${HOST_CONF}" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, "r", encoding="utf-8", errors="surrogateescape").read()
# strip previous MARHAS block
text = re.sub(r"\n?# BEGIN MARHAS.*?# END MARHAS\n?", "\n", text, flags=re.S)

block = """
# BEGIN MARHAS
    server {
        listen 80;
        listen [::]:80;
        server_name marhas.pk www.marhas.pk;
        client_max_body_size 12M;
        location / {
            proxy_pass http://127.0.0.1:5080;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }
    }
# END MARHAS
"""

# Insert before the last closing brace of the file (end of http { })
idx = text.rfind("}")
if idx < 0:
    sys.stderr.write("ERROR: no closing } in nginx.conf\n")
    sys.exit(1)
new = text[:idx] + block + text[idx:]
with open(path, "r+", encoding="utf-8", errors="surrogateescape") as f:
    f.seek(0)
    f.write(new)
    f.truncate()
print("    embedded OK")
PY

echo "==> Writing conf.d copy inside container (backup path)..."
docker exec -i "${FRONT}" sh -c 'mkdir -p /etc/nginx/conf.d && cat > /etc/nginx/conf.d/marhas.pk.conf' <<'EOF'
# BEGIN MARHAS
server {
    listen 80;
    listen [::]:80;
    server_name marhas.pk www.marhas.pk;
    client_max_body_size 12M;
    location / {
        proxy_pass http://127.0.0.1:5080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
# END MARHAS
EOF

echo "==> Restarting ${FRONT} so bind-mount picks up edits..."
docker restart "${FRONT}" >/dev/null
sleep 2

echo "==> Testing nginx config..."
docker exec "${FRONT}" nginx -t

echo "==> Confirming server_name loaded..."
if ! docker exec "${FRONT}" nginx -T 2>/dev/null | grep -q 'server_name marhas.pk'; then
  echo "ERROR: marhas.pk still not in nginx -T"
  echo "--- host file markers ---"
  grep -n 'MARHAS\|server_name marhas' "${HOST_CONF}" || true
  echo "--- container nginx.conf markers ---"
  docker exec "${FRONT}" sh -c 'grep -n "MARHAS\|server_name marhas" /etc/nginx/nginx.conf || true'
  exit 1
fi
echo "    server_name marhas.pk is active"

echo "==> Verifying health..."
OK_DIRECT="$(curl -fsS "http://127.0.0.1:5080${HEALTH_PATH}" || true)"
OK_LOCAL="$(curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1${HEALTH_PATH}" || true)"
echo "    MARHAS :5080 -> ${OK_DIRECT:0:90}"
echo "    Host :80 Host=${DOMAIN} -> ${OK_LOCAL:0:90}"

if echo "${OK_LOCAL}" | grep -q '"status":"ok"'; then
  echo ""
  echo "==> SUCCESS: marhas.pk → MARHAS (Zermae untouched)."
  exit 0
fi

echo "WARN: unexpected response on :80"
curl -sS -D- -o /tmp/marhas-host.out -H "Host: ${DOMAIN}" "http://127.0.0.1${HEALTH_PATH}" || true
head -c 200 /tmp/marhas-host.out; echo
exit 1
