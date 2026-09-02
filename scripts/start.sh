#!/bin/sh
set -e

echo "[natasun-chat] Starting..."

# Apply any pending database schema changes automatically.
# Comment this out if you prefer to manage migrations manually.
if [ -n "$DATABASE_URL" ]; then
  echo "[natasun-chat] Applying database schema..."
  npx prisma db push --skip-generate > /dev/null 2>&1 || echo "[natasun-chat] db push skipped/failed (non-fatal)"
fi

echo "[natasun-chat] Starting Next.js (port ${PORT:-3000}) and WebSocket (port ${WS_PORT:-3001})..."

# Run both processes, forwarding signals.
node node_modules/next/dist/bin/next start -p "${PORT:-3000}" &
NEXT_PID=$!

node dist/ws-server.js &
WS_PID=$!

# Trap signals and forward them so both shut down cleanly.
trap "kill -TERM $NEXT_PID $WS_PID 2>/dev/null || true" INT TERM EXIT

wait -n $NEXT_PID $WS_PID
