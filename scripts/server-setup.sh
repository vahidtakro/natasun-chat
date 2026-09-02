#!/usr/bin/env bash
# ============================================================
#  One-time server setup for Natasun Chat
#  Run this ONCE as root/sudo on a fresh server.
#  It installs Docker, clones the repo, and prepares .env.
# ============================================================
set -e

GIT_REPO="${GIT_REPO:-}"
APP_DIR="${APP_DIR:-/opt/natasun-chat}"

echo "=== Natasun Chat — Server Setup ==="
echo "App directory: $APP_DIR"

# 1. System dependencies
if ! command -v docker >/dev/null 2>&1; then
  echo ">> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi
command -v docker >/dev/null 2>&1 || { echo "Docker install failed"; exit 1; }
command -v docker compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 \
  || echo ">> Note: 'docker compose' plugin not found; install docker-compose-plugin."

if command -v git >/dev/null 2>&1; then
  echo ">> git is ready."
else
  echo ">> Installing git..."
  apt-get update >/dev/null && apt-get install -y git >/dev/null
fi

# 2. Clone repository
if [ ! -d "$APP_DIR" ]; then
  if [ -z "$GIT_REPO" ]; then
    echo "!! Set GIT_REPO to your GitHub repository URL, e.g.:"
    echo "     GIT_REPO=https://github.com/you/natasun-chat ./server-setup.sh"
    exit 1
  fi
  echo ">> Cloning $GIT_REPO into $APP_DIR"
  git clone "$GIT_REPO" "$APP_DIR"
else
  echo ">> Repo already exists at $APP_DIR (pulling latest)"
  git -C "$APP_DIR" pull || true
fi

# 3. Create .env from example if missing (already gitignored, so safe)
if [ ! -f "$APP_DIR/.env" ]; then
  echo ">> Creating .env from .env.example"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "!!! IMPORTANT: Edit $APP_DIR/.env and set your real values:"
  echo "    - DATABASE_URL (your MySQL connection string)"
  echo "    - SESSION_SECRET (a long random string)"
  echo "    - NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_WS_URL (your public URLs)"
  echo "    - ALLOWED_ORIGINS"
  echo ""
  echo "    Then run:  cd $APP_DIR && ./deploy.sh"
  exit 0
fi

echo ""
echo "=== Done. Next step: ==="
echo "  1. Edit $APP_DIR/.env  (if needed)"
echo "  2. cd $APP_DIR && ./deploy.sh"