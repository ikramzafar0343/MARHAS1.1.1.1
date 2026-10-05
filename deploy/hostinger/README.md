# MARHAS → Hostinger VPS (isolated Docker + Nginx + PostgreSQL)

Migrates `marhas.pk` onto Hostinger **without mixing** with the other site on the same server.

| Item | Value |
|------|-------|
| Hostinger IP | `72.61.19.3` |
| Hostname | `srv2029499.hstgr.cloud` |
| OS | Ubuntu 24.04 LTS |
| SSH | `ssh root@72.61.19.3` |
| Domain | `marhas.pk` |
| Database | PostgreSQL 16 (`marhas-db`, internal only) |
| Docker publish | `127.0.0.1:5080` only |
| Containers | `marhas-db`, `marhas-api`, `marhas-nginx` |

**Do not use** the old GoDaddy IP `132.148.73.92`.

## Isolation

1. Compose project `marhas` + network `marhas_net`
2. Postgres has **no host ports**
3. Nginx publishes only `127.0.0.1:5080`
4. Host nginx site for `marhas.pk` / `www` only → `127.0.0.1:5080`

## Cloudflare DNS

- `marhas.pk` → `72.61.19.3`
- `www.marhas.pk` → `72.61.19.3`
- SSL/TLS: **Full**

## Master console command

See [MASTER_COMMAND.md](./MASTER_COMMAND.md).

## Env checklist

| Variable | Production value |
|----------|------------------|
| `DATABASE_URL` | `postgresql://marhas:…@db:5432/marhas?schema=public&connection_limit=10` |
| `CORS_ORIGIN` | `https://marhas.pk,https://www.marhas.pk` |
| `APP_URL` | `https://marhas.pk` |
| `SEED_ADMIN_EMAIL` | `admin@marhas.com` |
| `SEED_ADMIN_PASSWORD` | `Marhas@Admin123` |
| `SEED_ADMIN_NAME` | `MARHAS Admin` |

## Stack

```
Internet → Cloudflare → Hostinger host nginx (marhas.pk only)
                              ↓
                     127.0.0.1:5080 (marhas-nginx)
                              ↓
                     marhas-api:5000
                              ↓
                     marhas-db:5432 (Postgres 16)
```
