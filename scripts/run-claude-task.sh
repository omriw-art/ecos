#!/usr/bin/env bash
# Run the current task in ai/NEXT_TASK.md through Claude Code CLI.
# Usage: bash scripts/run-claude-task.sh

set -e

# ── Locate project root (directory containing this script's parent) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# ── Guards ──
if [ ! -f "CLAUDE.md" ]; then
  echo "ERROR: CLAUDE.md not found. Run this from the project root." >&2
  exit 1
fi
if [ ! -f "ai/NEXT_TASK.md" ]; then
  echo "ERROR: ai/NEXT_TASK.md not found." >&2
  exit 1
fi

# ── Locate claude binary ──
CLAUDE=""
for candidate in \
  "claude" \
  "$HOME/.npm/bin/claude" \
  "/usr/local/bin/claude" \
  "/opt/homebrew/bin/claude" \
  "$(npm root -g 2>/dev/null)/.bin/claude"; do
  if command -v "$candidate" &>/dev/null 2>&1 || [ -x "$candidate" ]; then
    CLAUDE="$candidate"
    break
  fi
done

if [ -z "$CLAUDE" ]; then
  echo "Claude CLI not found."
  echo "Install it with:  npm install -g @anthropic-ai/claude-code"
  echo ""
  echo "Then run:  bash scripts/run-claude-task.sh"
  echo ""
  echo "Task is waiting in:  ai/NEXT_TASK.md"
  exit 1
fi

# ── Run ──
PROMPT="Read CLAUDE.md and ai/NEXT_TASK.md. Execute exactly. Write the final report to ai/CLAUDE_REPORT.md."

echo "Running Claude task from ai/NEXT_TASK.md …"
"$CLAUDE" -p "$PROMPT"
echo "Done. Check ai/CLAUDE_REPORT.md for the report."
