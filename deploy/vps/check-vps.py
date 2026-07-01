"""Check VPS deploy status."""
import paramiko
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")

cmds = [
    "systemctl is-active mongod 2>/dev/null || echo mongod-inactive",
    "systemctl is-active marhas 2>/dev/null || echo marhas-inactive",
    "test -d /opt/marhas/.git && echo repo-exists || echo no-repo",
    "test -f /opt/marhas/Backend/.env && echo env-exists || echo no-env",
    "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5000/api/v1/health 2>/dev/null || echo curl-failed",
    "ls -la /etc/nginx/sites-enabled/ 2>/dev/null",
    "free -h | head -2",
]

if not PASSWORD:
    print("Set MARHAS_VPS_PASSWORD environment variable first.")
    sys.exit(1)

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to {USER}@{HOST}...")
c.connect(HOST, username=USER, password=PASSWORD, timeout=20, allow_agent=False, look_for_keys=False, banner_timeout=20)
print("Connected.")
for cmd in cmds:
    _, stdout, stderr = c.exec_command(cmd)
    print(f">>> {cmd}")
    print(stdout.read().decode(errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err:
        print("ERR:", err)
c.close()
