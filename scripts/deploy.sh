#!/usr/bin/env bash
# ============================================================
#  Deploy / update Natasun Chat on a server
#  Safe to run on a FRESH clone OR an existing install.
#  Run:  ./deploy.sh
# ============================================================
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

# 3. Detect whether a bundled DB is being used (DB_HOST=db) -> enable db profile
COMPOSE_PROFILE=""
if grep -q '^DB_HOST=["]*db' .env 2>/dev/null; then
  COMPOSE_PROFILE="--profile db"
  echo ">> Bundled MySQL detected, using profile 'db'."
fi

# 4. Build and start with Docker Compose
echo ">> Building and starting containers (this applies DB schema on startup too)..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --pull
docker compose $COMPOSE_PROFILE up -d

# 5. Show status
echo ""
echo "=== Done! ==="
echo "Containers:"
docker compose $COMPOSE_PROFILE ps

echo ""
echo "Logs (last 40 lines):"
docker compose logs --tail=40

echo ""
say() { echo ">> $*"; }
say "Natasun Chat is running."
if grep -q '^NEXT_PUBLIC_APP_URL=' .env 2>/dev/null; then
  URL=$(grep '^NEXT_PUBLIC_APP_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')
  say "Dashboard: $URL"
fi
say ""
say "   To see live logs:         docker compose logs -f"
say "   To restart:               docker compose restart"
say "   To stop:                  docker compose down"
say "   To reinstall/refresh:     re-run ./deploy.sh"
