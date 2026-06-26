#!/usr/bin/env bash
# Mercury installer — builds the single binary and links it onto your PATH.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/app" && pwd)"
BIN_DIR="${MERCURY_BIN_DIR:-$HOME/.local/bin}"

echo "Building Mercury…"
cd "$APP_DIR"
bun install
bun run build

mkdir -p "$BIN_DIR"
install -m 755 "$APP_DIR/dist/mercury" "$BIN_DIR/mercury"

echo
echo "✓ Installed mercury -> $BIN_DIR/mercury"
if ! command -v mercury >/dev/null 2>&1; then
  echo "  Note: add $BIN_DIR to your PATH:"
  echo "    export PATH=\"$BIN_DIR:\$PATH\""
fi
echo "Run: mercury init && mercury dashboard"
