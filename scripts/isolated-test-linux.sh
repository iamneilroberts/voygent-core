#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/iamneilroberts/voygent-core.git"
WORKDIR="${WORKDIR:-/tmp/voygent-core-test}"
PORT="${PORT:-8787}"
KEY="${KEY:-demo.key}"
REMOTE="${REMOTE:-0}"
MCP_URL="${MCP_URL:-}"
CLAUDE_BIN="${CLAUDE_BIN:-claude-desktop}"
NO_SERVER="${NO_SERVER:-0}"
LAUNCH_CLAUDE="${LAUNCH_CLAUDE:-0}"

usage() {
  cat <<USAGE
Usage:
  ./scripts/isolated-test-linux.sh [--temp-home] [--create-user] [--remote] [--no-server]

Options:
  --temp-home     Use temporary HOME and XDG_CONFIG_HOME under WORKDIR (default).
  --create-user   Create a fresh Linux user (requires sudo/root). Then log in as that user and rerun this script.
  --remote        Use wrangler --remote (public URL for Claude/ChatGPT web clients).
  --no-server     Skip starting the dev server.

Environment overrides:
  WORKDIR=/tmp/voygent-core-test
  PORT=8787
  KEY=demo.key
  REMOTE=1
  MCP_URL=https://your-remote-url/sse?key=demo.key
  CLAUDE_BIN=claude-desktop
  NO_SERVER=1
  LAUNCH_CLAUDE=1
USAGE
}

SHOW_HELP=0
CREATE_USER=0
USE_TEMP_HOME=1

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      SHOW_HELP=1
      ;;
    --create-user)
      CREATE_USER=1
      ;;
    --temp-home)
      USE_TEMP_HOME=1
      ;;
    --remote)
      REMOTE=1
      ;;
    --no-server)
      NO_SERVER=1
      ;;
    *)
      echo "Unknown option: $arg"
      usage
      exit 1
      ;;
  esac
done

if [[ "$SHOW_HELP" -eq 1 ]]; then
  usage
  exit 0
fi

if [[ "$CREATE_USER" -eq 1 ]]; then
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

if [[ -z "${MCP_URL}" ]]; then
  MCP_URL="http://127.0.0.1:${PORT}/sse?key=${KEY}"
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

if [[ "$REMOTE" -eq 1 ]]; then
  if command -v rg >/dev/null 2>&1; then
    HAS_PLACEHOLDER=$(rg -q "YOUR_KV_NAMESPACE_ID" wrangler.toml && echo "1" || echo "0")
  else
    HAS_PLACEHOLDER=$(grep -q "YOUR_KV_NAMESPACE_ID" wrangler.toml && echo "1" || echo "0")
  fi
  if [[ "$HAS_PLACEHOLDER" -eq 1 ]]; then
    echo "Remote dev requires a real KV namespace ID in wrangler.toml."
    echo "Run: npx wrangler kv:namespace create TRIPS"
    echo "Then replace YOUR_KV_NAMESPACE_ID in wrangler.toml."
    exit 1
  fi
  export KV_MODE=remote
fi

if [[ ! -f .dev.vars ]]; then
  echo "AUTH_KEYS=$KEY" > .dev.vars
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ "$REMOTE" -eq 1 ]]; then
  echo "Seeding demo data (remote KV)..."
else
  echo "Seeding demo data (local KV)..."
fi
npm run seed

CONFIG_DIR="$XDG_CONFIG_HOME/Claude"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/claude_desktop_config.json" <<CONFIG
{
  "mcpServers": {
    "voygent-core": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}
CONFIG

echo "\nClaude Desktop config written to: $CONFIG_DIR/claude_desktop_config.json"

if [[ "$REMOTE" -eq 1 && "$MCP_URL" == "http://127.0.0.1:${PORT}/sse?key=${KEY}" ]]; then
  echo "\nRemote mode enabled. Wrangler will print a public URL."
  echo "Set MCP_URL=<public-url>/sse?key=${KEY} and rerun with --no-server to rewrite config."
fi

echo "\nMCP URL: ${MCP_URL}"

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
  if [[ "$REMOTE" == "1" ]]; then
    echo "npx wrangler dev --remote --port ${PORT}"
  else
    echo "npx wrangler dev --local --persist --port ${PORT}"
  fi
else
  echo "\nStarting dev server (Ctrl+C to stop)..."
  if [[ "$REMOTE" == "1" ]]; then
    npx wrangler dev --remote --port "$PORT"
  else
    npx wrangler dev --local --persist --port "$PORT"
  fi
fi
