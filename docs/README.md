# Documentation Index

## Start here

- `active/CURRENT_STATUS.md` — current HEAD, architecture, product direction,
  boundaries. The authoritative current-status doc; prefer it over anything
  below when they disagree.

## Core Project Docs

- PROJECT_MAP.md — project map
- SAFE_REFACTOR_PLAN.md — structural refactor plan (currency not reverified)
- STRUCTURE_STATUS.md — structure status (currency not reverified)
- UX_MISSION_CONTROL_BLUEPRINT.md — UX blueprint (currency not reverified)

## Archive

Superseded/historical docs (baseline status, dependency map, refactor log,
batch self-reviews, root-runtime audit, data-layer migration plan, the old
working-rules and functional-reality-audit docs, and earlier batch history)
now live under:

docs/archive/refactor-history/

## Current Architecture Status

Runtime JS and CSS now live under src/. Root contains active HTML entry
points and static assets. See `active/CURRENT_STATUS.md` for the current
service seams (EcosRepo, EcosLocalAdapter, EcosSession, EcosAuthz,
EcosOwnership, CompanyFeed) and next task.
