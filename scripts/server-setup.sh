#!/usr/bin/env bash
# ============================================================
#  One-time server prerequisites for Natasun Chat.
#  Installs Docker + git, then launches the interactive installer.
#  Run:  sudo bash server-setup.sh
# ============================================================
set -e

echo "===> [natasun] Installing prerequisites (Docker + git)..."
if ! command -v docker >/dev/null 2>&1; then
  echo ">> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi
command -v docker >/dev/null 2>&1 || { echo "[ERROR] Docker not available"; exit 1; }
if ! command -v git >/dev/null 2>&1; then
  echo ">> Installing git..."
  apt-get update >/dev/null && apt-get install -y git >/dev/null
fi

echo ">> Prerequisites ready."
echo ""
echo ">> Starting the interactive installer..."
bash install.sh
