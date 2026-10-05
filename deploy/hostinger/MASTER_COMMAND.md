# Hostinger master console command (private repo)

Repo `ikramzafar0343/MARHAS1.1.1.1` is **private**. Anonymous `curl` to `raw.githubusercontent.com` returns **404**. Use a GitHub PAT with **Contents: Read** (classic: `repo` scope).

## First install

On the VPS (`root@72.61.19.3`):

```bash
export GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE

curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/hostinger/setup-hostinger.sh \
  -o /tmp/setup-hostinger.sh

chmod +x /tmp/setup-hostinger.sh
bash /tmp/setup-hostinger.sh
```

Or clone first:

```bash
export GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
git clone --depth 1 -b main "https://${GITHUB_TOKEN}@github.com/ikramzafar0343/MARHAS1.1.1.1.git" /opt/marhas
bash /opt/marhas/deploy/hostinger/setup-hostinger.sh
```

Edit SMTP password:

```bash
nano /opt/marhas/deploy/hostinger/.env
```

Continue:

```bash
export GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
bash /opt/marhas/deploy/hostinger/setup-hostinger.sh --continue
```

## Verify

```bash
curl -sS http://127.0.0.1:5080/api/v1/health
curl -sS http://127.0.0.1:5080/api/v1/health/ready
```

Admin: `admin@marhas.com` / `Marhas@Admin123`

Cloudflare A records → `72.61.19.3`, SSL/TLS **Full**.
