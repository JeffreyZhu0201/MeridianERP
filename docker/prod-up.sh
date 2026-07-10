#!/usr/bin/env sh
set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/docker/.env"

cd "$ROOT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/docker/.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE from docker/.env.example"
fi

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

echo "Building and starting MeridianERP production stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo "Waiting for API health..."
TRIES=0
until docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 60 ]; then
    echo "API did not become healthy in time. Check: docker compose -f docker/docker-compose.prod.yml logs api"
    exit 1
  fi
  sleep 2
done

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding demo data (idempotent)..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile seed run --rm api-seed
fi

echo ""
echo "MeridianERP production stack is up."
echo "  Landing     http://localhost:3004"
echo "  Admin       http://localhost:3000"
echo "  API         http://localhost:3001"
echo "  Merchant    http://localhost:3002"
echo "  Store       http://localhost:3003/shop"
echo "  Distributor http://localhost:3005"
echo ""
echo "Logs:  rtk pnpm docker:prod:logs"
echo "Stop:  rtk pnpm docker:prod:down"
