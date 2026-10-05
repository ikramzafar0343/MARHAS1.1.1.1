#!/usr/bin/env bash
# Ensure marhas.pk is served on BOTH :80 and :443 (Cloudflare Full → origin HTTPS).
# Edits Zermae host-mounted nginx.conf in-place (same inode) and reloads.
set -euo pipefail

FRONT="${FRONT:-zermae-nginx-1}"
HOST_CONF="${HOST_CONF:-/var/www/zermae/deploy/hostinger/nginx.conf}"
CERT_DIR="/etc/letsencrypt/live/marhas.pk"
DOMAIN="marhas.pk"

detected="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/nginx/nginx.conf"}}{{.Source}}{{end}}{{end}}' "${FRONT}" 2>/dev/null || true)"
[[ -n "${detected}" ]] && HOST_CONF="${detected}"

echo "==> Pre-check"
echo "    :80  => $(curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1/api/v1/health" 2>/dev/null | head -c 80 || echo FAIL)"
echo "    :443 => $(curl -kfsS -H "Host: ${DOMAIN}" "https://127.0.0.1/api/v1/health" 2>/dev/null | head -c 80 || echo FAIL)"

echo "==> Ensuring TLS cert for ${DOMAIN} (self-signed OK for Cloudflare Full)..."
# Prefer host openssl writing into the shared letsencrypt mount
if [[ ! -f "${CERT_DIR}/fullchain.pem" || ! -f "${CERT_DIR}/privkey.pem" ]]; then
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:www.${DOMAIN}" 2>/dev/null \
    || openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
      -keyout "${CERT_DIR}/privkey.pem" \
      -out "${CERT_DIR}/fullchain.pem" \
      -subj "/CN=${DOMAIN}"
  echo "    created ${CERT_DIR}"
else
  echo "    cert already exists"
fi

echo "==> Rewriting MARHAS server blocks (HTTP + HTTPS) in ${HOST_CONF}..."
python3 - "${HOST_CONF}" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, "r", encoding="utf-8", errors="surrogateescape").read()
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

    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name marhas.pk www.marhas.pk;
        client_max_body_size 12M;

        ssl_certificate     /etc/letsencrypt/live/marhas.pk/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/marhas.pk/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://127.0.0.1:5080;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }
    }
# END MARHAS
"""

idx = text.rfind("}")
if idx < 0:
    raise SystemExit("no closing } in nginx.conf")
new = text[:idx] + block + text[idx:]
with open(path, "r+", encoding="utf-8", errors="surrogateescape") as f:
    f.seek(0)
    f.write(new)
    f.truncate()
print("    embedded HTTP+HTTPS OK")
PY

# Drop stale conf.d duplicate if any
docker exec "${FRONT}" rm -f /etc/nginx/conf.d/marhas.pk.conf 2>/dev/null || true

echo "==> Testing + reloading ${FRONT}..."
docker exec "${FRONT}" nginx -t
docker exec "${FRONT}" nginx -s reload

sleep 1
echo "==> Verify (use SNI — Host header alone on 127.0.0.1 causes HTTP 421)"
H80="$(curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1/api/v1/health" || true)"
# --resolve sets correct TLS SNI so nginx picks the marhas.pk server block
H443="$(curl -kfsS --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/api/v1/health" || true)"
echo "    :80  => ${H80:0:90}"
echo "    :443 => ${H443:0:90}"

if echo "${H443}" | grep -q '"status":"ok"'; then
  echo ""
  echo "==> SUCCESS: origin :443 serves MARHAS for ${DOMAIN} (Cloudflare Full OK)."
  echo "    Cloudflare → Caching → Purge Everything, then hard-refresh https://${DOMAIN}"
  exit 0
fi

echo "ERROR: :443 still not MARHAS. Dump listen/server_name:"
docker exec "${FRONT}" nginx -T 2>/dev/null | grep -E 'listen |server_name ' | head -60
exit 1
