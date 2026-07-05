# STRUCTURE_STATUS

Date: 2026-07-05 (updated after Batch J)
Migration status: Batches A–J complete. All HTML entry points load data from src/data/data.js. Root data.js preserved for rollback.

---

## 1. Current Structure Summary

The dashboard and join app runtime have fully migrated from the root directory into `src/`. The three HTML entry points (`ecos.html`, `join.html`, `index.html`) remain at root along with `data.js`, which is the last active root runtime dependency. The root directory is now clean of JSX and CSS runtime files.

---

## 2. Active Entry Points

| File | Role |
|---|---|
| `ecos.html` | Internal dashboard SPA (React, Babel, `window.*` globals) |
| `join.html` | Public onboarding wizard (React, Babel) |
| `index.html` | Public landing page (vanilla JS, inline CSS) |

---

## 3. Active src Runtime Areas

| Path | Contents |
|---|---|
| `src/shared/styles/` | `styles.css`, `join-styles.css` |
| `src/shared/icons/` | `icons.jsx` — `window.I` icon registry |
| `src/shared/components/` | `atoms.jsx`, `tweaks-panel.jsx` |
| `src/app/` | `shell.jsx`, `app.jsx` |
| `src/modules/dashboard/` | `view-dashboard.jsx` |
| `src/modules/organizations/` | `view-companies.jsx` |
| `src/modules/capabilities/` | `view-capabilities.jsx` |
| `src/modules/map/` | `view-map.jsx` |
| `src/modules/matches/` | `view-matches.jsx` |
| `src/modules/misc/` | `view-misc.jsx` |
| `src/modules/onboarding/` | `view-onboard.jsx`, `join-app.jsx` |

---

## 4. Active Root Runtime Files

| File | Loaded by | Notes |
|---|---|---|
| `data.js` | ~~loaded by HTML~~ | **No longer referenced by HTML** (Batch J). Root copy preserved for rollback. Delete after manual testing. |
| `src/data/data.js` | `ecos.html?v=3`, `join.html`, `index.html?v=4` | **Now active.** Loaded by all three HTML entry points. |
| `ecos.html` | Browser directly | Entry point — stays at root |
| `join.html` | Browser directly | Entry point — stays at root |
| `index.html` | Browser directly | Entry point — stays at root |

---

## 5. Root Files Intentionally Preserved

| File/Dir | Reason |
|---|---|
| `logos/` | `index.html` uses hardcoded and dynamic paths into `logos/`. Cannot move without updating `index.html`. |
| `spec.html` | Standalone Hebrew product spec. Not linked from runtime. Safe to move later. |
| `attachments.zip` | Source asset archive. Not referenced at runtime. Safe to move to `assets/`. |
| `ecos-qr.png` | QR code image. Not referenced at runtime. Has an unrelated local modification. |
| `assets/` | Empty folder placeholder. |
| `scripts/` | Contains Python utility scripts (`fetch_logos.py`, `fetch_site_logos.py`). Non-runtime. |
| `docs/` | All planning and review documentation. |

---

## 6. What Was Removed From Root

| Batch | Removed |
|---|---|
| Batch D | `styles.css`, `join-styles.css`, `icons.jsx`, `atoms.jsx`, `tweaks-panel.jsx` |
| Batch G | `app.jsx`, `shell.jsx`, `view-dashboard.jsx`, `view-companies.jsx`, `view-capabilities.jsx`, `view-map.jsx`, `view-matches.jsx`, `view-misc.jsx`, `view-onboard.jsx` |
| Batch H | `join-app.jsx` |

**14 root JSX/CSS files removed.** All remain recoverable via git history.

---

## 7. What Is Still Prototype-Style

| Item | Description |
|---|---|
| Runtime Babel | JSX transpiled in-browser using `@babel/standalone` via CDN. Not production-ready. |
| CDN React 18 | React and ReactDOM loaded from `unpkg.com`. Not bundled. |
| `window.*` globals | All component communication via global namespace. No ES module imports. |
| `data.js` as source of truth | All data is static JSON-like assignments in a single file. No API, no database. |
| `index.html` self-contained | Public landing is a large vanilla JS/HTML file — no React, no build step. |
| No backend / auth | No server, no authentication, no persistent storage. |

---

## 8. Recommended Next Workstreams

Ordered by risk and dependency:

1. ~~**Copy `data.js` to `src/data/data.js`**~~ — **Done (Batch J Phase 1).**
2. ~~**Migrate `data.js` references per-HTML-file**~~ — **Done (Batch J Phases 2–4).** All three HTML entry points now load `src/data/data.js`.
3. **Delete root `data.js`** — cleanup batch after manual testing confirms all entry points work. `git rm data.js`.
4. **Manual testing baseline** — test all three entry points before and after root `data.js` deletion.
5. **UX redesign sprint** — once the structure is stable, address UI improvements with full confidence in the codebase.
6. **MVP product modules** — governance, export, and search modules when product direction is clearer.
7. **Supabase / backend** — real data persistence, auth, and API when MVP scope is decided. This is a major architectural shift.
