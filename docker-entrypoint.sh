#!/bin/sh
set -e

echo "[pos] ensuring database schema..."
npx prisma db push --skip-generate

if [ "${SEED_ON_START}" = "true" ] && [ ! -f /data/.seeded ]; then
  echo "[pos] seeding demo data..."
  npx tsx prisma/seed.ts
  touch /data/.seeded
  echo "[pos] seed complete (demo PIN 1234)"
fi

echo "[pos] starting on :${PORT:-3000}"
exec node server.js
