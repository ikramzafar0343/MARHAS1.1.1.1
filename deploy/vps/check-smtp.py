"""Check VPS SMTP configuration and recent mail logs."""
import os
import paramiko

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")

cmds = [
    r"grep -E '^(SMTP_|EMAIL_FROM|SUPPORT_EMAIL|NODE_ENV)=' /opt/marhas/Backend/.env | sed 's/SMTP_PASS=.*/SMTP_PASS=***hidden***/'",
    "journalctl -u marhas -n 60 --no-pager 2>/dev/null | grep -iE 'smtp|email|otp|mail|skipped' || echo 'no-mail-logs'",
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASSWORD, timeout=30, allow_agent=False, look_for_keys=False)
for cmd in cmds:
    print(f">>> {cmd}")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode(errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err:
        print("ERR:", err)
c.close()
