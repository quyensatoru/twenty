#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Usage: ./run.sh [dev|prod]  (default: prod)
MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  # Dev: Postgres/Redis + .env + db init (idempotent), rồi chạy front + server + worker
  # xem: https://docs.twenty.com/developers/contribute/capabilities/local-setup
  bash packages/twenty-utils/setup-dev-env.sh
  exec yarn start
fi

# 1. Build package chung (front + server đều phụ thuộc)
npx nx build twenty-shared

# 2. Build frontend production
npx nx build twenty-front

# 3. Build backend production
npx nx build twenty-server

# 4. Copy frontend build vào dist/front của server (đúng như Dockerfile chính thức)
rm -rf packages/twenty-server/dist/front
cp -r packages/twenty-front/build packages/twenty-server/dist/front

# 5. Chạy server + worker production (serve luôn cả front, 1 port duy nhất)
cd packages/twenty-server
env NODE_ENV=production node dist/main.js &
SERVER_PID=$!
env NODE_ENV=production node dist/queue-worker/queue-worker.js &
WORKER_PID=$!
trap 'kill "$SERVER_PID" "$WORKER_PID" 2>/dev/null' EXIT
wait -n "$SERVER_PID" "$WORKER_PID"
