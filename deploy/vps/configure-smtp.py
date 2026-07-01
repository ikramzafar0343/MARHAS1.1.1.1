"""Configure Hostinger SMTP on the VPS for admin OTP emails."""
import base64
import os
import sys
import time

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")
SMTP_USER = os.environ.get("MARHAS_SMTP_USER", "support@marhas.pk")
SMTP_PASS = os.environ.get("MARHAS_SMTP_PASS", "")
SMTP_HOST = os.environ.get("MARHAS_SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = os.environ.get("MARHAS_SMTP_PORT", "465")
SMTP_SECURE = os.environ.get("MARHAS_SMTP_SECURE", "true")
EMAIL_FROM = os.environ.get("MARHAS_EMAIL_FROM", "MARHAS <support@marhas.pk>")
SUPPORT_EMAIL = os.environ.get("MARHAS_SUPPORT_EMAIL", "support@marhas.pk")

PAYLOAD = base64.b64encode(
    f"{SMTP_HOST}\n{SMTP_PORT}\n{SMTP_SECURE}\n{SMTP_USER}\n{SMTP_PASS}\n{EMAIL_FROM}\n{SUPPORT_EMAIL}\n".encode()
).decode()

REMOTE_SCRIPT = f"""#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import base64
from pathlib import Path

host, port, secure, user, password, email_from, support = (
    base64.b64decode("{PAYLOAD}").decode().splitlines()
)
env_path = Path("/opt/marhas/Backend/.env")
values = {{
    "SMTP_HOST": host,
    "SMTP_PORT": port,
    "SMTP_SECURE": secure,
    "SMTP_USER": user,
    "SMTP_PASS": password,
    "EMAIL_FROM": email_from,
    "SUPPORT_EMAIL": support,
}}
lines = env_path.read_text().splitlines() if env_path.exists() else []
seen = set()
updated = []
for line in lines:
    key = line.split("=", 1)[0] if "=" in line else ""
    if key in values:
        updated.append(f"{{key}}={{values[key]}}")
        seen.add(key)
    else:
        updated.append(line)
for key, value in values.items():
    if key not in seen:
        updated.append(f"{{key}}={{value}}")
env_path.write_text("\\n".join(updated).rstrip() + "\\n")
print("SMTP settings written to", env_path)
PY

systemctl restart marhas
sleep 2
curl -sf http://127.0.0.1:5000/api/v1/health
echo ""
echo "SMTP configured for {SMTP_USER}"
"""


def run():
    if not PASSWORD:
        print("Set MARHAS_VPS_PASSWORD environment variable first.")
        sys.exit(1)

    if not SMTP_PASS:
        print("Set MARHAS_SMTP_PASS to the support@marhas.pk mailbox password.")
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
            remote_path = "/tmp/marhas-configure-smtp.sh"
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
            print("Done. Try admin login again — OTP should arrive in support@marhas.pk inbox.")
            return
        except Exception as error:
            print(f"Attempt {attempt + 1} failed: {error}")
            time.sleep(5)

    sys.exit(1)


if __name__ == "__main__":
    run()
