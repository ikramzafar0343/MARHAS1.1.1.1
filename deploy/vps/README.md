# MARHAS VPS Deploy (`marhas.pk`)

For **Ubuntu 24.04** VPS with an existing website. MARHAS runs on port **5000** behind nginx.

## Your server

| Item | Value |
|------|-------|
| IP | `132.148.73.92` |
| OS | Ubuntu 24.04 |
| RAM | 2 GB (use MongoDB Atlas — not on VPS) |
| Domain | `marhas.pk` |

## Before you start

1. Point DNS **A records** for `marhas.pk` and `www.marhas.pk` → `132.148.73.92`
2. SSH into VPS as **root**
3. Edit secrets in `Backend/.env` (MongoDB URI, JWT secrets)

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/ikramzafar0343/MARHAS1.1.1.1/main/deploy/vps/setup-marhas.sh -o /tmp/setup-marhas.sh
chmod +x /tmp/setup-marhas.sh
sudo bash /tmp/setup-marhas.sh
```

First run creates `/opt/marhas/Backend/.env` from template — **edit it**, then:

```bash
sudo bash /tmp/setup-marhas.sh --continue
```

## Update after git push

```bash
sudo bash /opt/marhas/deploy/vps/setup-marhas.sh --continue
```

## Useful commands

```bash
sudo systemctl status marhas
sudo journalctl -u marhas -f
sudo systemctl restart marhas
```
