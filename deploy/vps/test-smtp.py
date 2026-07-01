"""Send a test OTP email from the VPS using current SMTP settings."""
import os
import sys
import time

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("MARHAS_VPS_HOST", "132.148.73.92")
USER = os.environ.get("MARHAS_VPS_USER", "greentech")
PASSWORD = os.environ.get("MARHAS_VPS_PASSWORD", "")

REMOTE_SCRIPT = r"""#!/usr/bin/env bash
set -euo pipefail
cd /opt/marhas/Backend
node --input-type=module <<'NODE'
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  SUPPORT_EMAIL = 'support@marhas.pk'
} = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error('SMTP is not fully configured in Backend/.env');
  process.exit(1);
}

const port = Number(SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: SMTP_SECURE === 'true' || port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

const otp = String(Math.floor(100000 + Math.random() * 900000));
const info = await transporter.sendMail({
  from: EMAIL_FROM || SMTP_USER,
  to: SUPPORT_EMAIL,
  subject: 'MARHAS SMTP test — admin OTP delivery check',
  text: `SMTP test successful. Sample OTP: ${otp}`,
  html: `<p>SMTP test successful.</p><p style="font-size:28px;letter-spacing:0.35em;">${otp}</p>`
});

console.log('Test email sent:', info.messageId);
console.log('Recipient:', SUPPORT_EMAIL);
NODE
"""


def run():
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
    )

    sftp = client.open_sftp()
    remote_path = "/tmp/marhas-test-smtp.sh"
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
    sys.exit(code)


if __name__ == "__main__":
    run()
