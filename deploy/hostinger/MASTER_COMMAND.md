# Hostinger master console command

Run as **root** on `72.61.19.3` after this branch is on GitHub `main` and Cloudflare A records point to `72.61.19.3`.

## First install

```bash
curl -fsSL https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/hostinger/setup-hostinger.sh -o /tmp/setup-hostinger.sh && chmod +x /tmp/setup-hostinger.sh && bash /tmp/setup-hostinger.sh
```

Edit SMTP password:

```bash
nano /opt/marhas/deploy/hostinger/.env
```

Continue (build, migrate, seed, nginx, certbot):

```bash
bash /opt/marhas/deploy/hostinger/setup-hostinger.sh --continue
```

## One-liner after secrets are already filled

```bash
bash /opt/marhas/deploy/hostinger/setup-hostinger.sh --continue
```

## Verify

```bash
curl -sS http://127.0.0.1:5080/api/v1/health
curl -sS http://127.0.0.1:5080/api/v1/health/ready
docker compose -p marhas -f /opt/marhas/deploy/hostinger/docker-compose.yml --env-file /opt/marhas/deploy/hostinger/.env ps
```

Admin: `admin@marhas.com` / `Marhas@Admin123`
