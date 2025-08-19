#!/usr/bin/env bash
set -euo pipefail

echo "[init-db] Running Prisma migrate..."
npx prisma migrate dev --name init

echo "[init-db] Seeding database..."
npx tsx prisma/seed.ts

echo "[init-db] Done."


