# CLAUDE RUNNER

One-task runner for Claude Code CLI.

## How to use

1. Put the next task in `ai/NEXT_TASK.md`.
2. Run:
   ```
   bash scripts/run-claude-task.sh
   ```
3. Claude executes the task.
4. Claude writes the result to `ai/CLAUDE_REPORT.md`.
5. Send `ai/CLAUDE_REPORT.md` back to ChatGPT.
6. ChatGPT prepares the next task for `ai/NEXT_TASK.md`.

## Requirements

Claude Code CLI must be installed:
```
npm install -g @anthropic-ai/claude-code
```

## Notes

- Keep `ai/NEXT_TASK.md` short and scoped to one task.
- The runner always reads `CLAUDE.md` first — project rules are enforced.
- Do not auto-push. Commit only what the task allows.
- One task per run. No queue.
