# Demo Ready Status

Status: **DEMO READY** (local MVP)

## Scope
This is a browser-local MVP demo. All data (companies, submissions, edits) is
stored in the browser's localStorage. There is no backend, no cloud sync, no
email delivery, and no real-time/live sync unless explicitly implemented and
documented elsewhere.

## Manual QA — Passed
The following flows were manually checked in the browser and passed:
- index.html
- join.html
- ecos.html
- join → pending → approve → company flow
- company edit / save / refresh
- dashboard
- capabilities
- map
- matches
- export / import / reset
- console errors (none observed)
- logo rendering

## Company Logos
- Source: Israel Space Ecosystem Mapping 2026 PDF (assets/source/, intentionally
  untracked in git).
- Extracted and cropped logo badges saved to assets/logos/, with transparent
  backgrounds outside the badge shape.
- Wired into 89 of 90 companies in src/data/data.js via logoUrl / logoSource /
  logoSourcePage. One company (Planetanya) has no matching PDF page and has no
  local logo asset.

## Known Uncommitted / Untracked Files (intentional)
- ecos-qr.png — intentionally left unstaged.
- assets/source/israel-space-ecosystem-mapping-2026.pdf — intentionally untracked.

## Known Limitations
- Planetanya has no logo asset (not present in the source PDF).
- Demo data and edits are local to the browser/device; nothing is synced or shared.
