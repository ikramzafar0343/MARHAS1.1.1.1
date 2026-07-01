"""Pull latest MARHAS from GitHub on VPS and rebuild production bundle."""
import os
import sys
import time

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")
REPO = os.environ.get("MARHAS_GITHUB_REPO", "https://github.com/ikramzafar0343/MARHAS1.1.1.1.git")
BRANCH = os.environ.get("MARHAS_GITHUB_BRANCH", "main")

REMOTE_SCRIPT = r"""#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/marhas
DEPLOY_USER="${MARHAS_DEPLOY_USER:-greentech}"
cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "ERROR: $APP_DIR is not a git repository"
  exit 1
fi

echo "==> Preparing repository permissions..."
git config --global --add safe.directory "$APP_DIR"
if id "$DEPLOY_USER" >/dev/null 2>&1; then
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.git" "$APP_DIR/frontend" "$APP_DIR/deploy" 2>/dev/null || true
fi

echo "==> Pulling latest code..."
git -c safe.directory="$APP_DIR" fetch origin
git -c safe.directory="$APP_DIR" reset --hard "origin/__BRANCH__"

echo "==> Rotating JWT secrets..."
ENV_FILE="$APP_DIR/Backend/.env"
if [ -f "$ENV_FILE" ]; then
  ACCESS="$(openssl rand -base64 48 | tr -d '/+=')"
  REFRESH="$(openssl rand -base64 48 | tr -d '/+=')"
  export ENV_FILE ACCESS REFRESH
  python3 - <<'PY'
from pathlib import Path
import os

env_path = Path(os.environ["ENV_FILE"])
access = os.environ["ACCESS"]
refresh = os.environ["REFRESH"]
lines = env_path.read_text().splitlines()
updated = []
for line in lines:
    if line.startswith("JWT_ACCESS_SECRET="):
        updated.append(f"JWT_ACCESS_SECRET={access}")
    elif line.startswith("JWT_REFRESH_SECRET="):
        updated.append(f"JWT_REFRESH_SECRET={refresh}")
    else:
        updated.append(line)
env_path.write_text("\n".join(updated) + "\n")
PY
fi

echo "==> Installing dependencies..."
cd "$APP_DIR/Backend"
npm ci --silent
cd "$APP_DIR/frontend"
npm ci --silent

echo "==> Building frontend..."
export VITE_API_URL=/api/v1
export VITE_ASSET_URL=
npm run build

echo "==> Publishing static assets..."
cd "$APP_DIR/Backend"
rm -rf public
cp -r "$APP_DIR/frontend/dist" public
chown -R www-data:www-data "$APP_DIR/Backend"

echo "==> Restarting service..."
systemctl restart marhas
sleep 2

echo "==> Health check..."
curl -sf http://127.0.0.1:5000/api/v1/health
echo ""
if grep -rl 'localhost:5000' "$APP_DIR/Backend/public/assets/"*.js 2>/dev/null; then
  echo "WARN: localhost still referenced in bundle"
  exit 1
fi
echo "OK: production bundle is healthy"
""".replace("__BRANCH__", BRANCH)


def run():
    if not PASSWORD:
        print("Set MARHAS_VPS_PASSWORD environment variable first.")
        sys.exit(1)

    for attempt in range(3):
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            print(f"Connecting to {USER}@{HOST} (attempt {attempt + 1})...")
            client.connect(
                HOST,
                username=USER,
                password=PASSWORD,
                timeout=30,
                allow_agent=False,
                look_for_keys=False,
            )

            sftp = client.open_sftp()
            remote_path = "/tmp/marhas-pull-rebuild.sh"
            with sftp.file(remote_path, "w") as remote_file:
                remote_file.write(REMOTE_SCRIPT)
            sftp.chmod(remote_path, 0o755)
            sftp.close()

            stdin, stdout, stderr = client.exec_command(
                f"echo '{PASSWORD}' | sudo -S bash {remote_path}",
                get_pty=True,
            )
            print(stdout.read().decode(errors="replace"))
            err = stderr.read().decode(errors="replace")
            if err:
                print(err)
            code = stdout.channel.recv_exit_status()
            client.close()
            if code != 0:
                raise RuntimeError(f"Remote script exited with code {code}")
            return
        except Exception as error:
            print(f"Attempt {attempt + 1} failed: {error}")
            time.sleep(5)

    sys.exit(1)


if __name__ == "__main__":
    run()
