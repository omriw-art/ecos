# ROOT_RUNTIME_AUDIT

Date: 2026-07-05
Status: Post Batch H (join-app.jsx migrated)

---

## 1. Purpose

This document audits all remaining active root-level runtime files after the structural migration of dashboard and join app files into `src/`. It establishes a clear boundary between what is active, what is static, and what remains as planned structural debt.

---

## 2. Active Root Entry Points

| File | Role | Status |
|---|---|---|
| `ecos.html` | Internal dashboard SPA | Active — entry point |
| `join.html` | Public onboarding wizard | Active — entry point |
| `index.html` | Public landing page (vanilla JS) | Active — entry point |

All three entry points remain at root. They are loaded directly by the browser and must stay at root.

---

## 3. Active Root Runtime Dependencies

| File | Used By | Notes |
|---|---|---|
| `data.js` | `ecos.html`, `join.html`, `index.html` | Last major root runtime dependency. Assigns all globals via `Object.assign(window, {...})`. Migration requires updating all three HTML files. |

`data.js` is the only remaining root JSX/JS runtime dependency that is not an entry point.

---

## 4. Runtime Now Loaded From src

All JSX and CSS runtime files now load from `src/`:

**Shared CSS** (`src/shared/styles/`):
- `styles.css` — loaded by `ecos.html` and `join.html`
- `join-styles.css` — loaded by `join.html`

**Shared JSX** (`src/shared/`):
- `src/shared/icons/icons.jsx` — loaded by `ecos.html` and `join.html`
- `src/shared/components/atoms.jsx` — loaded by `ecos.html`
- `src/shared/components/tweaks-panel.jsx` — loaded by `ecos.html`

**Dashboard app** (`src/app/`):
- `src/app/shell.jsx`
- `src/app/app.jsx`

**Dashboard modules** (`src/modules/`):
- `src/modules/dashboard/view-dashboard.jsx`
- `src/modules/organizations/view-companies.jsx`
- `src/modules/capabilities/view-capabilities.jsx`
- `src/modules/map/view-map.jsx`
- `src/modules/matches/view-matches.jsx`
- `src/modules/misc/view-misc.jsx`
- `src/modules/onboarding/view-onboard.jsx`

**Join app**:
- `src/modules/onboarding/join-app.jsx`

`index.html` uses inline CSS only and does not load from `src/`.

---

## 5. Static / Support Root Files

| File/Dir | Purpose | Safe to move? |
|---|---|---|
| `logos/` | Company and partner logo images, loaded by `index.html` | No — `index.html` uses hardcoded paths like `logos/manhelet-halal.png` and dynamic `logos/${p.file}`. Moving requires updating `index.html`. |
| `spec.html` | Standalone Hebrew product spec document | Yes — not linked from any runtime file |
| `attachments.zip` | Source attachments archive | Yes — not referenced at runtime |
| `ecos-qr.png` | QR code image asset | Yes — not referenced at runtime |
| `assets/` | Empty folder placeholder | n/a — just a `.gitkeep` |
| `scripts/` | Python utility scripts (non-runtime) | Already moved in Step 8 |

---

## 6. data.js References

Every HTML file that loads `data.js`, with exact path and cache-buster:

| HTML file | Exact script tag | Line |
|---|---|---|
| `ecos.html` | `<script src="data.js?v=3"></script>` | 21 |
| `join.html` | `<script src="data.js"></script>` | 22 |
| `index.html` | `<script src="data.js?v=4"></script>` | 450 |

Note: `ecos.html` uses `?v=3` and `index.html` uses `?v=4`. These cache-buster versions are different and must each be preserved or intentionally updated when migrating.

---

## 7. Root Files Removed So Far

| Batch | Files Removed |
|---|---|
| Batch D | `styles.css`, `join-styles.css`, `icons.jsx`, `atoms.jsx`, `tweaks-panel.jsx` |
| Batch G | `app.jsx`, `shell.jsx`, `view-dashboard.jsx`, `view-companies.jsx`, `view-capabilities.jsx`, `view-map.jsx`, `view-matches.jsx`, `view-misc.jsx`, `view-onboard.jsx` |
| Batch H | `join-app.jsx` |

Total root JSX/CSS files removed: **14**

---

## 8. Remaining Structural Debt

| Item | Description |
|---|---|
| `data.js` still root/global | All data is loaded into `window.*` globals from a single root file. No data access layer exists. |
| Runtime Babel transpilation | JSX is transpiled in the browser at runtime using `@babel/standalone` via CDN. Not a production setup. |
| CDN React | React and ReactDOM are loaded from `unpkg.com` CDN, not bundled. |
| `window.*` globals | All components communicate via `window.*` globals, not ES module imports/exports. |
| `index.html` is large and self-contained | Public landing page is a single ~600-line vanilla JS HTML file with inline CSS. No React. |
| No backend or auth | All data is static. No API, no authentication, no persistent storage. |
| No real module imports | Files don't `import` or `export` — they read and write `window.*`. |

---

## 9. Recommended Next Step

Create a `data.js` migration plan (see `docs/DATA_LAYER_MIGRATION_PLAN.md`), then execute as a copy-only batch first:

1. Copy `data.js` to `src/data/data.js` without changing any HTML references.
2. In a subsequent batch, update `ecos.html` to use `src/data/data.js` and test.
3. Then update `join.html`, then `index.html`.
4. Only delete root `data.js` after all three HTML files point to `src/data/`.

Do not move `data.js` directly without first copying and testing each entry point independently.
