"""Add sslip.io instant mobile URL that works on Pakistani ISP DNS."""
import paramiko
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "132.148.73.92"
USER = "greentech"
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")
DOMAIN = "132-148-73-92.sslip.io"

SCRIPT = f"""#!/bin/bash
set -euo pipefail
DOMAIN="{DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/marhas-sslip.conf"

sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {{
    listen 80;
    listen [::]:80;
    server_name 132-148-73-92.sslip.io;

    client_max_body_size 12M;

    location / {{
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }}
}}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/marhas-sslip.conf
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@marhas.pk

ENV_FILE="/opt/marhas/Backend/.env"
if ! grep -q "sslip.io" "$ENV_FILE"; then
  sudo sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://marhas.pk,https://www.marhas.pk,https://132-148-73-92.sslip.io,https://marhas.greentechagency.com|' "$ENV_FILE"
fi

sudo systemctl restart marhas
sleep 2
curl -s https://$DOMAIN/api/v1/health
echo ""
echo "READY: https://$DOMAIN"
"""

def main():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=25, allow_agent=False, look_for_keys=False)
    sftp = c.open_sftp()
    path = "/tmp/add-sslip.sh"
    with sftp.file(path, "w") as f:
        f.write(SCRIPT)
    sftp.chmod(path, 0o755)
    sftp.close()
    stdin, stdout, stderr = c.exec_command(f"echo '{PASSWORD}' | sudo -S bash {path}", get_pty=True)
    print(stdout.read().decode(errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err:
        print(err)
    c.close()

if __name__ == "__main__":
    main()
