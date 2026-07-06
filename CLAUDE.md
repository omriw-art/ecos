# Ecosystem OS — AI Workflow Rules

## Project Context
- This is an existing codebase, not a new project.
- The user works locally in VS Code.
- The app is being gradually turned from a visual prototype into a local functional MVP.
- Do not migrate to Vite, add a backend, or redesign the UI unless explicitly requested.

## Core Workflow
- Separate planning from coding.
- Prefer small, scoped batches.
- Make the smallest safe change.
- Do not expand scope without asking.
- Preserve existing working flows.

## Token / Context Budget Rules
- Work surgically.
- Do not scan the whole repo unless explicitly asked.
- Inspect only files relevant to the task.
- Do not print full file contents.
- Do not paste long diffs.
- Do not repeat long project history.
- Final reports should be short and practical.
- If more context is needed, ask before exploring broadly.

## File Discipline
- Every task should define allowed files.
- Do not modify files outside the allowed list without asking.
- Do not stage unrelated files.
- Never stage ecos-qr.png unless explicitly approved.
- Do not stage unrequested docs or report files.

## Current Functional Baseline
- CompanyStore persists companies locally.
- SubmissionStore handles pending/approved/rejected join submissions.
- CapabilityRegistry provides canonical capability definitions and coverage.
- MatchEngine provides deterministic explainable company matching.
- Dashboard consumes CapabilityRegistry and MatchEngine signals.
- The app still uses browser-side React/Babel/global scripts.
- Fake live/user/activity/social-proof signals were removed in Batch P5B (ed20346).
- Dashboard activity must be backed by real local SubmissionStore data.
- If no real user/activity data exists, show an honest empty state.

## Product Truthfulness Rules
- UI must not imply real users exist unless backed by real data.
- UI must not claim live sync, backend connection, AI activity, or real-time activity unless actually connected.
- Use "local", "demo", "preview", or honest empty-state copy where appropriate.
- Seed ecosystem company data may remain, but fake registered-user activity must not be surfaced as real.
- Do not introduce fake users, fake live status, fake activity, fake registrations, or fake social proof.

## Validation Checklist
Before committing, run relevant checks:
- git status --short
- git diff --check
- node --check src/data/data.js
- node --check src/services/company-store.js if touched or relevant
- node --check src/services/submission-store.js if touched or relevant
- node --check src/services/capability-registry.js if touched or relevant
- node --check src/services/match-engine.js if touched or relevant

## Git Rules
- Stage only files directly related to the task.
- Confirm staged files with:
  git diff --cached --name-only
- Commit with a clear conventional commit message.
- Do not push unless explicitly asked.

## Final Report Format
Keep the final report under 15 lines:
- what changed
- files changed
- validation run
- commit hash, if committed
- remaining uncommitted files
- known limitations
