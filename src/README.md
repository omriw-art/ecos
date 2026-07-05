# SRC STRUCTURE

## Purpose

This folder is the future modular source structure for the Ecosystem OS MVP.

## Current Status (after Batch E)

The active runtime files for the shared layer are now loaded from `src/shared/`:
- `src/shared/styles/styles.css` — active (loaded by `ecos.html`, `join.html`)
- `src/shared/styles/join-styles.css` — active (loaded by `join.html`)
- `src/shared/icons/icons.jsx` — active (loaded by `ecos.html`, `join.html`)
- `src/shared/components/atoms.jsx` — active (loaded by `ecos.html`)
- `src/shared/components/tweaks-panel.jsx` — active (loaded by `ecos.html`)

The core dashboard and app files are **reference copies only** — not yet active:
- `ecos.html` still loads `app.jsx`, `shell.jsx`, and all `view-*.jsx` from the root.

## Copied Files (Batch A — now active via Batches B + C)

- `src/shared/icons/icons.jsx` ← was root `icons.jsx` (root copy deleted in Batch D)
- `src/shared/components/atoms.jsx` ← was root `atoms.jsx` (root copy deleted in Batch D)
- `src/shared/components/tweaks-panel.jsx` ← was root `tweaks-panel.jsx` (root copy deleted in Batch D)
- `src/shared/styles/styles.css` ← was root `styles.css` (root copy deleted in Batch D)
- `src/shared/styles/join-styles.css` ← was root `join-styles.css` (root copy deleted in Batch D)

## Copied Files (Batch E — reference copies, not yet active)

- `src/app/app.jsx` ← copy of root `app.jsx`
- `src/app/shell.jsx` ← copy of root `shell.jsx`
- `src/modules/dashboard/view-dashboard.jsx` ← copy of root `view-dashboard.jsx`
- `src/modules/organizations/view-companies.jsx` ← copy of root `view-companies.jsx`
- `src/modules/capabilities/view-capabilities.jsx` ← copy of root `view-capabilities.jsx`
- `src/modules/map/view-map.jsx` ← copy of root `view-map.jsx`
- `src/modules/matches/view-matches.jsx` ← copy of root `view-matches.jsx`
- `src/modules/misc/view-misc.jsx` ← copy of root `view-misc.jsx`
- `src/modules/onboarding/view-onboard.jsx` ← copy of root `view-onboard.jsx`

## Important Rule

Files in `src/` that are not yet active are reference copies only.
Do not edit them expecting those changes to appear in the running app.
Until `ecos.html` script tags are updated to point to `src/`, the root files remain the source of truth.

## Migration Status

| Batch | Action | Status |
|---|---|---|
| A | Copy shared files to `src/shared/` | Done |
| B | Switch CSS `<link>` tags to `src/shared/styles/` | Done — active |
| C | Switch shared JSX `<script>` tags to `src/shared/` | Done — active |
| D | Delete root shared duplicates | Done |
| E | Copy dashboard files to `src/modules/` | Done — not yet active |
| F (next) | Switch `<script>` tags in `ecos.html` to `src/` dashboard files | Pending approval |
