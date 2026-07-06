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
- P11A Demo Readiness QA: passed, no changes needed.
- P11C: Onboarding confirm card uses real computed overlap data (no fake AI/social proof).
- P11D completed in b834999: public entry copy is now truthfulness-aligned (no fake email, no fake registration, no fake 24h promise).
- P11E completed: final demo wrap-up done. All fake claims removed. docs/DEMO_CHECKLIST.md created.
- AI runner workspace committed in 6b92645 (ai/ + scripts/run-claude-task.sh).
- Known uncommitted file: ecos-qr.png, intentionally unstaged.
- Demo is ready for manual browser walkthrough using docs/DEMO_CHECKLIST.md.
- P12A: company logos extracted from the official Israel Space Ecosystem Mapping 2026 PDF (assets/source/, untracked by design), cropped into assets/logos/, and wired into 89/90 companies via logoUrl/logoSource/logoSourcePage in src/data/data.js (97f568d, 8fcf5a0). Logo backgrounds cleaned to transparent (66dc39e).
- P12B: manual browser QA completed and passed — index.html, join.html, ecos.html, join→pending→approve→company flow, company edit/save/refresh, dashboard, capabilities, map, matches, export/import/reset, console errors, and logo rendering all checked.
- STATUS: DEMO READY (local MVP). All data is browser-local (localStorage); no backend, cloud, email, or live sync exists unless explicitly implemented.
- Known uncommitted/untracked files remain intentional: ecos-qr.png (unstaged), assets/source/israel-space-ecosystem-mapping-2026.pdf (untracked).

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
