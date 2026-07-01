"""Deploy API URL + CSP fix to VPS via base64 transfer."""
import base64
import paramiko
import sys
import os
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "132.148.73.92"
USER = "greentech"
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FILES = {
    "/opt/marhas/frontend/src/services/api.js": "frontend/src/services/api.js",
    "/opt/marhas/Backend/src/middlewares/security.middleware.js": "Backend/src/middlewares/security.middleware.js",
}

REBUILD = r"""
set -euo pipefail
APP_DIR=/opt/marhas
cd "$APP_DIR/frontend"
export VITE_API_URL=/api/v1
export VITE_ASSET_URL=
npm ci --silent
npm run build
cd "$APP_DIR/Backend"
rm -rf public
cp -r "$APP_DIR/frontend/dist" public
chown -R www-data:www-data "$APP_DIR/Backend"
systemctl restart marhas
sleep 2
curl -s http://127.0.0.1:5000/api/v1/health
echo ""
if grep -rl 'localhost:5000' "$APP_DIR/Backend/public/assets/"*.js 2>/dev/null; then
  echo "WARN: localhost still in bundle"
else
  echo "OK: production bundle uses same-origin API"
fi
"""


def run():
    for attempt in range(3):
        try:
            c = paramiko.SSHClient()
            c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            print(f"Connecting (attempt {attempt + 1})...")
            c.connect(HOST, username=USER, password=PASSWORD, timeout=30, allow_agent=False, look_for_keys=False)

            for remote, local_rel in FILES.items():
                local = os.path.join(ROOT, local_rel.replace("/", os.sep))
                data = base64.b64encode(open(local, "rb").read()).decode()
                cmd = f"echo '{PASSWORD}' | sudo -S bash -c 'echo {data} | base64 -d > {remote}'"
                stdin, stdout, stderr = c.exec_command(cmd)
                stdout.channel.recv_exit_status()
                print(f"Uploaded {local_rel}")

            sftp = c.open_sftp()
            rebuild_path = "/tmp/rebuild-marhas.sh"
            with sftp.file(rebuild_path, "w") as f:
                f.write(REBUILD)
            sftp.chmod(rebuild_path, 0o755)
            sftp.close()

            stdin, stdout, stderr = c.exec_command(
                f"echo '{PASSWORD}' | sudo -S bash {rebuild_path}",
                get_pty=True,
            )
            print(stdout.read().decode(errors="replace"))
            err = stderr.read().decode(errors="replace")
            if err:
                print(err)
            c.close()
            return
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(5)
    sys.exit(1)


if __name__ == "__main__":
    run()
