"""Deploy MARHAS to VPS via SSH with local MongoDB."""
import paramiko
import sys
import time
import os

# Avoid Windows console UnicodeEncodeError on apt/progress output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")

DEPLOY_SCRIPT = r"""#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "==> Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl ca-certificates gnupg nginx certbot python3-certbot-nginx

echo "==> Installing MongoDB (local)..."
if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
  sudo apt-get update -qq
  sudo apt-get install -y -qq mongodb-org
fi
sudo systemctl enable mongod
sudo systemctl start mongod

echo "==> Adding swap if needed..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> Installing Node.js 20..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

APP_DIR="/opt/marhas"
REPO_URL="https://github.com/ikramzafar0343/MARHAS1.1.1.1.git"
BRANCH="main"

echo "==> Cloning or updating MARHAS..."
if [ -d "$APP_DIR/.git" ]; then
  sudo git -C "$APP_DIR" fetch origin
  sudo git -C "$APP_DIR" checkout "$BRANCH"
  sudo git -C "$APP_DIR" pull origin "$BRANCH"
else
  sudo rm -rf "$APP_DIR"
  sudo git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

JWT_ACCESS="$(openssl rand -base64 48)"
JWT_REFRESH="$(openssl rand -base64 48)"

echo "==> Writing .env..."
sudo tee "$APP_DIR/Backend/.env" > /dev/null <<EOF
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

echo "==> Building frontend..."
cd "$APP_DIR/frontend"
export VITE_API_URL=/api/v1
export VITE_ASSET_URL=
sudo npm ci --silent
sudo npm run build

echo "==> Installing backend..."
cd "$APP_DIR/Backend"
sudo npm ci --omit=dev --silent
sudo rm -rf public
sudo cp -r "$APP_DIR/frontend/dist" public
sudo mkdir -p src/uploads/images src/uploads/products src/uploads/avatars logs
sudo chown -R www-data:www-data "$APP_DIR/Backend"

echo "==> systemd service..."
sudo tee /etc/systemd/system/marhas.service > /dev/null <<'SVCEOF'
[Unit]
Description=MARHAS API and storefront
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/marhas/Backend
EnvironmentFile=/opt/marhas/Backend/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node --max-old-space-size=384 src/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
SVCEOF
sudo systemctl daemon-reload
sudo systemctl enable marhas
sudo systemctl restart marhas

echo "==> nginx..."
sudo cp "$APP_DIR/deploy/vps/nginx-marhas.pk.conf" /etc/nginx/sites-available/marhas.pk
sudo ln -sf /etc/nginx/sites-available/marhas.pk /etc/nginx/sites-enabled/marhas.pk
sudo nginx -t
sudo systemctl reload nginx

echo "==> SSL..."
sudo certbot --nginx -d marhas.pk -d www.marhas.pk --non-interactive --agree-tos -m admin@marhas.pk || echo "SSL skipped - run certbot manually"

echo "==> Seeding database..."
cd "$APP_DIR/Backend"
sudo -u www-data npm run seed || echo "Seed skipped or already done"

echo "==> Status..."
sudo systemctl --no-pager status marhas || true
sudo systemctl --no-pager status mongod || true
curl -s http://127.0.0.1:5000/api/v1/health || true
echo ""
echo "DEPLOY COMPLETE"
"""


def run_remote_command(client, command, timeout=3600):
    print(f"\n>>> Running remote deploy (timeout {timeout}s)...")
    stdin, stdout, stderr = client.exec_command(
        f"echo '{PASSWORD}' | sudo -S bash -c {repr(command)}",
        get_pty=True,
        timeout=timeout,
    )
    # Stream output
    while True:
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode(errors="replace")
            print(data, end="", flush=True)
        if stderr.channel.recv_stderr_ready():
            data = stderr.channel.recv_stderr(4096).decode(errors="replace")
            print(data, end="", flush=True)
        if stdout.channel.exit_status_ready():
            break
        time.sleep(0.5)
    # Drain remaining
    print(stdout.read().decode(errors="replace"), end="")
    err = stderr.read().decode(errors="replace")
    if err:
        print(err, end="")
    return stdout.channel.recv_exit_status()


def main():
    if not PASSWORD:
        print("Set MARHAS_VPS_PASSWORD environment variable first.")
        sys.exit(1)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    client.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
        banner_timeout=30,
    )
    print("Connected.")

    # Test sudo
    stdin, stdout, stderr = client.exec_command(
        f"echo '{PASSWORD}' | sudo -S whoami", timeout=30
    )
    out = stdout.read().decode().strip()
    print(f"Sudo test: {out}")

    # Upload and run deploy script
    sftp = client.open_sftp()
    remote_path = "/tmp/marhas-deploy.sh"
    with sftp.file(remote_path, "w") as f:
        f.write(DEPLOY_SCRIPT)
    sftp.chmod(remote_path, 0o755)
    sftp.close()

    stdin, stdout, stderr = client.exec_command(
        f"echo '{PASSWORD}' | sudo -S bash {remote_path}",
        get_pty=True,
    )

    while True:
        if stdout.channel.recv_ready():
            print(stdout.channel.recv(4096).decode(errors="replace"), end="", flush=True)
        if stderr.channel.recv_stderr_ready():
            print(stderr.channel.recv_stderr(4096).decode(errors="replace"), end="", flush=True)
        if stdout.channel.exit_status_ready():
            break
        time.sleep(1)

    exit_code = stdout.channel.recv_exit_status()
    print(f"\nExit code: {exit_code}")
    client.close()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
