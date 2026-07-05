# SRC STRUCTURE

## Purpose

This folder is the modular source structure for the Ecosystem OS MVP.

## Migration Status (as of Batch K — 2026-07-05)

All runtime files (JSX, CSS, and data) have been migrated from root into `src/`. The root directory now only contains HTML entry points and static assets.

## Active src Runtime Files

### Shared Layer
- `src/shared/styles/styles.css` — loaded by `ecos.html` and `join.html`
- `src/shared/styles/join-styles.css` — loaded by `join.html`
- `src/shared/icons/icons.jsx` — `window.I` icon registry; loaded by `ecos.html` and `join.html`
- `src/shared/components/atoms.jsx` — `window.ScoreRing`, `window.CoLogo`, etc.; loaded by `ecos.html`
- `src/shared/components/tweaks-panel.jsx` — `window.TweaksPanel`; loaded by `ecos.html`

### Dashboard App
- `src/app/shell.jsx` — sidebar and shell layout
- `src/app/app.jsx` — React root mount

### Dashboard Modules
- `src/modules/dashboard/view-dashboard.jsx`
- `src/modules/organizations/view-companies.jsx`
- `src/modules/capabilities/view-capabilities.jsx`
- `src/modules/map/view-map.jsx`
- `src/modules/matches/view-matches.jsx`
- `src/modules/misc/view-misc.jsx`
- `src/modules/onboarding/view-onboard.jsx`

### Onboarding / Join App
- `src/modules/onboarding/join-app.jsx` — loaded by `join.html`

## Active Root Files (NOT in src)

| File | Role |
|---|---|
| `ecos.html` | Dashboard entry point |
| `join.html` | Onboarding entry point |
| `index.html` | Public landing page |

`src/data/data.js` is the active data source — loaded by all three HTML entry points.

## Batch Migration History

| Batch | Action |
|---|---|
| A | Copied shared files to `src/shared/` |
| B | Switched CSS `<link>` tags to `src/shared/styles/` |
| C | Switched shared JSX `<script>` tags to `src/shared/` |
| D | Deleted root shared duplicates |
| E | Copied dashboard files to `src/modules/` |
| F | Switched dashboard `<script>` tags to `src/` |
| G | Deleted root dashboard duplicates |
| H | Moved `join-app.jsx` to `src/modules/onboarding/`, updated `join.html` |
| J | Copied `data.js` → `src/data/data.js`; updated all 3 HTML entry points to load from `src/data/` |
| K | Deleted root `data.js` — migration complete |

## Important Rules

- Files in `src/` are all active runtime files (no longer reference-copies).
- Do not edit root files (`ecos.html`, `join.html`, `index.html`) expecting it to affect `src/` copies.
- There are no remaining root runtime JS files.
- See `docs/STRUCTURE_STATUS.md` for the full current state.
