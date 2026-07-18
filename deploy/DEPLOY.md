# Deployment Guide — run the site 24/7 (desktop off)

The app is split into three deployable pieces:
- **Web** (Next.js) → Vercel (free)
- **API** (NestJS) → Railway (free tier, runs your existing Dockerfile)
- **Postgres** → Neon (free, managed)

ClickHouse (telemetry charts) is optional — see the "Optional: ClickHouse" note.

---

## 0. Prereqs
- A GitHub repo containing this project (push it).
- Accounts: [Vercel](https://vercel.com), [Railway](https://railway.app), [Neon](https://neon.tech). All have free tiers.
- A domain is optional — Vercel and Railway give you `.vercel.app` / `.up.railway.app` URLs for free.

---

## 1. Neon — Postgres
1. New project → region close to you → copy the **connection string** (looks like `postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`).
2. Change the DB name to `dataviz` (or just use the provided one and set `DATABASE_URL` accordingly). Easiest: in Neon, run `CREATE DATABASE dataviz;`.
3. Keep this string handy — you'll paste it as `DATABASE_URL` in Railway.

## 2. Railway — API
1. New project → "Deploy from GitHub repo" → select this repo.
2. Railway auto-detects `railway.toml`. It builds `apps/api/Dockerfile`.
3. Set **variables** (Railway dashboard → Variables):
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `JWT_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
   - `DATABASE_URL` = the Neon string from step 1 (append `?sslmode=require` if missing)
   - `CORS_ORIGIN` = your Vercel URL (e.g. `https://your-app.vercel.app`) — you can set this after step 3.
   - Leave `CLICKHOUSE_*` unset for v1 (telemetry page will be empty but app won't crash).
4. Deploy. Railway gives you a URL like `https://xxx.up.railway.app`. Note it.

## 3. Run migrations + seed against Neon (one time)
From your local machine (with the repo checked out and `node` installed):
```bash
DATABASE_URL="<neon-connection-string>" npm run db:migrate
DATABASE_URL="<neon-connection-string>" npm run db:seed
```
This creates the tables (with RLS) and the demo dataset. Run `db:migrate` again after any schema change.

## 4. Vercel — Web
1. New project → import the GitHub repo.
2. **Root Directory:** set to `apps/web` (Project Settings → Build & Development).
3. Framework preset: Next.js (auto-detected). Build command `npm run build`, output `.next`.
4. **Environment Variable:** `NEXT_PUBLIC_API_URL` = `https://<your-railway-url>/api/v1`
   (must include `/api/v1` — the web appends bare paths like `/datasets`).
5. Deploy. Vercel gives you `https://your-app.vercel.app`.
6. Go back to **Railway → Variables** and set `CORS_ORIGIN` = `https://your-app.vercel.app`. Redeploy the API.

## 5. Done
- Visit your Vercel URL. Register an account (or use the dev-token only on non-prod — it's gated off when `NODE_ENV=production`).
- Upload a CSV/Excel → it's stored in Neon, visualized via the Railway API.

---

## Optional: ClickHouse (telemetry charts)
Telemetry charts need ClickHouse. For v1 you can skip it. To enable later:
1. Create a free [ClickHouse Cloud](https://clickhouse.cloud) service.
2. In Railway, set `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DB`.
3. Apply the ClickHouse schema (from `packages/db/clickhouse/001_schema.sql`) to that instance.

---

## Alternative: single VPS (Docker + Caddy)
If you prefer one $5/mo server instead of three services:
1. Rent any VPS (Hetzner/Oracle Free Tier/DigitalOcean), install Docker.
2. Scp `docker-compose.deploy.yml`, `Caddyfile`, and `apps/web/Dockerfile` to it.
3. `export DOMAIN=your.domain JWT_SECRET=$(openssl rand -hex 32) POSTGRES_PASSWORD=... CLICKHOUSE_PASSWORD=...`
4. `docker compose -f docker-compose.deploy.yml up -d`
5. Point your domain's DNS A record at the VPS IP. Caddy auto-issues HTTPS.
6. Run migrations: `docker compose exec api sh -c "node packages/db/scripts/migrate.js && node packages/db/scripts/seed.js"`

---

## Notes / gotchas
- **Secrets never go in git.** `.env.production.example` documents names only.
- **`transpilePackages`** is already set in `apps/web/next.config.js` so Vercel compiles the `@platform/shared` workspace package without a prebuilt `dist`.
- **Neon free tier cold start:** first API query after idle may take ~1–2s. Neon Pro ($19/mo) keeps it warm.
- **Local vs prod:** your desktop still runs the local stack via `start-local.cmd`. The deployed version is fully independent — closing your desktop won't affect it.
