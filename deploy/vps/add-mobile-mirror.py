"""Add marhas.greentechagency.com mirror + fix marhas.pk CORS on VPS."""
import paramiko
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")

SCRIPT = r"""#!/bin/bash
set -euo pipefail

SUBDOMAIN="marhas.greentechagency.com"
NGINX_CONF="/etc/nginx/sites-available/marhas-mirror.conf"

echo "==> Creating nginx config for $SUBDOMAIN..."
sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name marhas.greentechagency.com;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/marhas-mirror.conf
sudo nginx -t
sudo systemctl reload nginx

echo "==> SSL for $SUBDOMAIN..."
sudo certbot --nginx -d "$SUBDOMAIN" --non-interactive --agree-tos -m admin@marhas.pk || true

echo "==> Updating CORS in .env..."
ENV_FILE="/opt/marhas/Backend/.env"
if ! grep -q "marhas.greentechagency.com" "$ENV_FILE"; then
  sudo sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://marhas.pk,https://www.marhas.pk,https://marhas.greentechagency.com|' "$ENV_FILE"
fi

echo "==> Restarting marhas..."
sudo systemctl restart marhas
sleep 2
sudo systemctl is-active marhas

echo "==> Testing..."
curl -s -o /dev/null -w "local: %{http_code}\n" http://127.0.0.1:5000/api/v1/health
curl -sk -o /dev/null -w "mirror: %{http_code}\n" -H "Host: marhas.greentechagency.com" https://127.0.0.1/api/v1/health || true

echo "DONE"
"""

def main():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    c.connect(HOST, username=USER, password=PASSWORD, timeout=25, allow_agent=False, look_for_keys=False)
    sftp = c.open_sftp()
    path = "/tmp/add-mirror.sh"
    with sftp.file(path, "w") as f:
        f.write(SCRIPT)
    sftp.chmod(path, 0o755)
    sftp.close()
    stdin, stdout, stderr = c.exec_command(f"echo '{PASSWORD}' | sudo -S bash {path}", get_pty=True)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print(out)
    if err:
        print(err)
    c.close()

if __name__ == "__main__":
    main()
