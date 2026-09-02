#!/usr/bin/env bash
# ============================================================
#  Deploy / update Natasun Chat on a server
#  Safe to run on a FRESH clone OR an existing install.
#  Run:  ./deploy.sh
# ============================================================
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "=== Natasun Chat — Deploy ==="
echo "Working directory: $APP_DIR"

# 1. Pull latest code from GitHub (skip if no git / no remote)
if [ -d .git ] && git remote get-url origin >/dev/null 2>&1; then
  echo ">> Pulling latest code from GitHub..."
  git pull --ff-only || echo ">> Note: git pull had no changes or failed (continuing with local files)."
else
  echo ">> Not a git checkout with an 'origin' remote; using local files."
fi

# 2. Ensure .env exists
if [ ! -f .env ]; then
  echo ">> No .env found. Creating from example..."
  cp .env.example .env
  echo ""
  echo "!!! STOP: Edit .env with your real DATABASE_URL and secrets, then re-run ./deploy.sh"
  exit 1
fi

# 3. Build and start with Docker Compose
echo ">> Building and starting containers (this applies DB schema on startup too)..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --pull
docker compose up -d

# 4. Show status
echo ""
echo "=== Done! ==="
echo "Containers:"
docker compose ps

echo ""
echo "Logs (last 40 lines):"
docker compose logs --tail=40

echo ""
echo ">> Natasun Chat is running."
echo "   Dashboard: http://<your-server-ip>:3000"
echo "   WebSocket: http://<your-server-ip>:3001"
echo ""
echo "   To see live logs:         docker compose logs -f"
echo "   To stop:                  docker compose down"
echo "   To reinstall/refresh:     re-run ./deploy.sh"