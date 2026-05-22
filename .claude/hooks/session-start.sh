#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install / update dependencies
npm install

# Start Next.js dev server if not already running
if ! lsof -i :3000 -t > /dev/null 2>&1; then
  nohup npm run dev > /tmp/nextjs.log 2>&1 &
  # Wait up to 15s for server to be ready
  for i in $(seq 1 15); do
    if curl -sf http://localhost:3000/api/metrics > /dev/null 2>&1; then
      echo "Next.js server ready on :3000"
      break
    fi
    sleep 1
  done
else
  echo "Next.js server already running on :3000"
fi
