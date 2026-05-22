#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Restore .env.local from .env.keys if available (file is gitignored — add keys there once)
if [ -f ".env.keys" ] && [ ! -f ".env.local" ]; then
  cp .env.keys .env.local
  echo ".env.local restaurado a partir de .env.keys"
elif [ ! -f ".env.local" ]; then
  echo "AVISO: .env.local ausente. Crie .env.keys com suas chaves de API para restauração automática."
fi

# Install / update dependencies
npm install

# Start Next.js dev server if not already running
if ! lsof -i :3000 -t > /dev/null 2>&1; then
  nohup npm run dev > /tmp/nextjs.log 2>&1 &
  for i in $(seq 1 20); do
    if curl -sf http://localhost:3000/api/metrics > /dev/null 2>&1; then
      echo "Next.js server pronto em :3000"
      break
    fi
    sleep 1
  done
else
  echo "Next.js server já rodando em :3000"
fi
