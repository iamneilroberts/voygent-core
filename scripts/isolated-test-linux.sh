#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/iamneilroberts/voygent-core.git"
WORKDIR="${WORKDIR:-/tmp/voygent-core-test}"
PORT="${PORT:-8787}"
KEY="${KEY:-demo.key}"
CLAUDE_BIN="${CLAUDE_BIN:-claude-desktop}"
NO_SERVER="${NO_SERVER:-0}"
LAUNCH_CLAUDE="${LAUNCH_CLAUDE:-0}"

usage() {
  cat <<USAGE
Usage:
  ./scripts/isolated-test-linux.sh [--temp-home] [--create-user]

Options:
  --temp-home     Use temporary HOME and XDG_CONFIG_HOME under WORKDIR (default).
  --create-user   Create a fresh Linux user (requires sudo/root). Then log in as that user and rerun this script.

Environment overrides:
  WORKDIR=/tmp/voygent-core-test
  PORT=8787
  KEY=demo.key
  CLAUDE_BIN=claude-desktop
  NO_SERVER=1
  LAUNCH_CLAUDE=1
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--create-user" ]]; then
  TEST_USER="voygenttest"
  if [[ $EUID -ne 0 ]]; then
    echo "Run with sudo: sudo $0 --create-user"
    exit 1
  fi
  if id "$TEST_USER" &>/dev/null; then
    echo "User $TEST_USER already exists. Log in as that user and rerun: $0 --temp-home"
    exit 0
  fi
  useradd -m "$TEST_USER"
  echo "Created user $TEST_USER. Set a password with: sudo passwd $TEST_USER"
  echo "Log in as $TEST_USER and run: $0 --temp-home"
  exit 0
fi

USE_TEMP_HOME=1
if [[ "${1:-}" == "--temp-home" || -z "${1:-}" ]]; then
  USE_TEMP_HOME=1
fi

if [[ "$USE_TEMP_HOME" -eq 1 ]]; then
  export HOME="$WORKDIR/home"
  export XDG_CONFIG_HOME="$WORKDIR/config"
  mkdir -p "$HOME" "$XDG_CONFIG_HOME"
fi

mkdir -p "$WORKDIR"

if [[ ! -d "$WORKDIR/voygent-core/.git" ]]; then
  echo "Cloning repo into $WORKDIR..."
  git clone "$REPO_URL" "$WORKDIR/voygent-core"
fi

cd "$WORKDIR/voygent-core"

if [[ ! -f .dev.vars ]]; then
  echo "AUTH_KEYS=$KEY" > .dev.vars
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Seeding demo data (local KV)..."
npm run seed

CONFIG_DIR="$XDG_CONFIG_HOME/Claude"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/claude_desktop_config.json" <<CONFIG
{
  "mcpServers": {
    "voygent-core": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://127.0.0.1:${PORT}/sse?key=${KEY}"]
    }
  }
}
CONFIG

echo "\nClaude Desktop config written to: $CONFIG_DIR/claude_desktop_config.json"

echo "\nLocal MCP URL: http://127.0.0.1:${PORT}/sse?key=${KEY}"

echo "\nIf Claude Desktop is installed, launch it with the isolated config:"
if command -v "$CLAUDE_BIN" >/dev/null 2>&1; then
  echo "XDG_CONFIG_HOME=$XDG_CONFIG_HOME HOME=$HOME $CLAUDE_BIN"
  if [[ "$LAUNCH_CLAUDE" == "1" ]]; then
    XDG_CONFIG_HOME="$XDG_CONFIG_HOME" HOME="$HOME" "$CLAUDE_BIN" &
  fi
else
  echo "(Claude Desktop not found in PATH. Start it from your app launcher.)"
  echo "Use env vars: XDG_CONFIG_HOME=$XDG_CONFIG_HOME HOME=$HOME"
fi

if [[ "$NO_SERVER" == "1" ]]; then
  echo "\nStart the dev server manually:"
  echo "npx wrangler dev --local --persist --port ${PORT}"
else
  echo "\nStarting dev server (Ctrl+C to stop)..."
  npx wrangler dev --local --persist --port "$PORT"
fi
