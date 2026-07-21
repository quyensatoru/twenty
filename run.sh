#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 1. Build package chung (front + server đều phụ thuộc)
npx nx build twenty-shared

# 2. Build frontend production
npx nx build twenty-front

# 3. Build backend production
npx nx build twenty-server

# 4. Copy frontend build vào dist/front của server (đúng như Dockerfile chính thức)
rm -rf packages/twenty-server/dist/front
cp -r packages/twenty-front/build packages/twenty-server/dist/front

# 5. Chạy server production (serve luôn cả front, 1 port duy nhất)
cd packages/twenty-server
exec env NODE_ENV=production node dist/main.js
