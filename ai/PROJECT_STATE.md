# PROJECT STATE

Last known baseline:
- CompanyStore persists companies locally.
- SubmissionStore handles pending/approved/rejected submissions.
- CapabilityRegistry provides canonical capability definitions and coverage.
- MatchEngine provides deterministic explainable company matching.
- Dashboard consumes CapabilityRegistry and MatchEngine signals.
- Export/import/reset local data toolkit works.
- External JSON/CSV replace import is supported.
- CSV template download is supported.
- Imported companies can be displayed, edited, saved, and exported.
- Fake user/activity/live signals were removed.
- Fake app actions were hardened.
- Safe reset to seed: confirmed working.
- P11A Demo Readiness QA: passed, no changes needed — app is presentable as a truthful local MVP demo.
- AI runner workspace committed in 6b92645 (ai/ + scripts/run-claude-task.sh).
- Last known commit: 6b92645 chore: add token-efficient Claude runner.
- Known uncommitted file: ecos-qr.png, intentionally unstaged.

Workflow:
- ChatGPT prepares ai/NEXT_TASK.md content.
- Claude executes the task.
- Claude writes ai/CLAUDE_REPORT.md.
- User sends the report back to ChatGPT.
- ChatGPT prepares the next task.

Validation:
Run:
git status --short
git diff --check

Git:
Stage only:
- ai/NEXT_TASK.md
- ai/CLAUDE_REPORT.md
- ai/DECISIONS.md
- ai/PROJECT_STATE.md

Do not stage ecos-qr.png.

Commit:
git commit -m "docs: add AI handoff workspace"
