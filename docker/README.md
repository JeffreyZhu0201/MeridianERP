# Docker production deployment

## One-command start

```bash
cp docker/.env.example docker/.env   # first time
rtk pnpm docker:prod
```

## What runs

| Service     | Port | Image                         |
| ----------- | ---- | ----------------------------- |
| postgres    | 5432 | postgres:16                   |
| redis       | 6379 | redis:7                       |
| api         | 3001 | `apps/api/Dockerfile`         |
| admin       | 3000 | `apps/admin/Dockerfile`       |
| merchant    | 3002 | `apps/merchant/Dockerfile`    |
| store       | 3003 | `apps/store/Dockerfile`       |
| landing     | 3004 | `apps/landing/Dockerfile`     |
| distributor | 3005 | `apps/distributor/Dockerfile` |

Volumes: `postgres_data`, `api_uploads` (media files).

## Environment

Edit `docker/.env` before deploy:

- **JWT secrets** — required for production
- **`NEXT_PUBLIC_API_URL`** — browser-facing API URL (baked into Next.js at **build** time)
- **`*_APP_URL`** — portal links on landing page
- **`RUN_SEED`** — set `false` to skip demo seed on startup

SSR inside containers uses `API_URL=http://api:3001` (Docker network). Browsers use `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

## Commands

```bash
rtk pnpm docker:prod          # build + up + seed
rtk pnpm docker:prod:down     # stop stack
rtk pnpm docker:prod:logs     # tail logs
rtk pnpm docker:prod:seed     # re-run seed only
```

## Local dev infra only

```bash
rtk pnpm deps                 # Redis only
rtk pnpm db:setup && rtk pnpm dev
```

Full dev stack via compose profile:

```bash
rtk docker compose -f docker/docker-compose.yml --profile dev up --build
```
