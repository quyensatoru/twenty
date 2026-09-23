#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Usage: ./run.sh [dev|prod]  (default: prod)
MODE="${1:-prod}"

if [ "$MODE" = "dev" ]; then
  # Dev: Postgres/Redis + .env + db init (idempotent), rồi chạy front + server + worker
  # xem: https://docs.twenty.com/developers/contribute/capabilities/local-setup
  bash packages/twenty-utils/setup-dev-env.sh
  yarn install
  # setup-dev-env.sh chỉ chạy database:init khi schema chưa tồn tại, nên sau khi
  # pull code mới nó bỏ qua migration im lặng. Phải tự nâng version ở đây.
  npx nx command twenty-server -- upgrade
  npx nx command-no-deps twenty-server -- cache:flush
  exec yarn start
fi

# 1. Đồng bộ dependency (yarn.lock đổi theo mỗi lần pull upstream)
# yarn install

# 2. Build package chung (front + server đều phụ thuộc)
npx nx build twenty-shared

# 3. Build frontend production
npx nx build twenty-front

# 4. Build backend production
npx nx build twenty-server

# 5. Copy frontend build vào dist/front của server (đúng như Dockerfile chính thức)
rm -rf packages/twenty-server/dist/front
cp -r packages/twenty-front/build packages/twenty-server/dist/front

# 6. Nâng version DB rồi xoá cache (bắt buộc sau khi pull code mới)
#    Phải dùng "upgrade", KHÔNG dùng "run-instance-commands": lệnh sau chỉ chạy
#    instance commands rồi đẩy cursor lên version mới, khiến mọi workspace command
#    nằm trước cursor bị bỏ qua vĩnh viễn mà không báo lỗi.
#    Flush cache vì cache giữ bản entity cũ, thiếu nó GraphQL trả null cho cột vừa thêm.
cd packages/twenty-server
env NODE_ENV=production node dist/command/command.js upgrade
env NODE_ENV=production node dist/command/command.js cache:flush

# 7. Chạy server + worker production (serve luôn cả front, 1 port duy nhất)
env NODE_ENV=production node dist/main.js &
SERVER_PID=$!
env NODE_ENV=production node dist/queue-worker/queue-worker.js &
WORKER_PID=$!
trap 'kill "$SERVER_PID" "$WORKER_PID" 2>/dev/null' EXIT
wait -n "$SERVER_PID" "$WORKER_PID"
