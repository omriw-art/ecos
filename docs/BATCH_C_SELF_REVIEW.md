# BATCH_C_SELF_REVIEW

Date: 2026-07-05

---

## 1. Scope Check

This batch changed only shared JSX `<script>` `src` values in `ecos.html` and `join.html`, plus created/updated docs.

- 2 HTML files modified (script src paths only — nothing else)
- 1 existing doc updated: `docs/REFACTOR_LOG.md`
- 1 new doc created: `docs/BATCH_C_SELF_REVIEW.md` (this file)

No JSX file contents changed. No files moved or deleted.

---

## 2. Changed Files

| Action | File |
|---|---|
| Modified (script src paths only) | `ecos.html` — 3 `<script>` tag src values updated |
| Modified (script src path only) | `join.html` — 1 `<script>` tag src value updated |
| Updated | `docs/REFACTOR_LOG.md` — Batch C entry appended |
| Created | `docs/BATCH_C_SELF_REVIEW.md` |

---

## 3. Exact Script Changes

**ecos.html:**
```html
<!-- Before -->
<script type="text/babel" src="tweaks-panel.jsx"></script>
<script type="text/babel" src="icons.jsx"></script>
<script type="text/babel" src="atoms.jsx"></script>

<!-- After -->
<script type="text/babel" src="src/shared/components/tweaks-panel.jsx"></script>
<script type="text/babel" src="src/shared/icons/icons.jsx"></script>
<script type="text/babel" src="src/shared/components/atoms.jsx"></script>
```

**join.html:**
```html
<!-- Before -->
<script type="text/babel" src="icons.jsx"></script>

<!-- After -->
<script type="text/babel" src="src/shared/icons/icons.jsx"></script>
```

---

## 4. Load Order Check

**ecos.html** — order unchanged, paths only:
1. `data.js` (unchanged)
2. `src/shared/components/tweaks-panel.jsx` ← was `tweaks-panel.jsx`
3. `src/shared/icons/icons.jsx` ← was `icons.jsx`
4. `src/shared/components/atoms.jsx` ← was `atoms.jsx`
5. `shell.jsx` (unchanged — root)
6. `view-dashboard.jsx` (unchanged — root)
7. `view-capabilities.jsx` (unchanged — root)
8. `view-companies.jsx` (unchanged — root)
9. `view-map.jsx` (unchanged — root)
10. `view-matches.jsx` (unchanged — root)
11. `view-onboard.jsx` (unchanged — root)
12. `view-misc.jsx` (unchanged — root)
13. `app.jsx` (unchanged — root)

**join.html** — order unchanged, paths only:
1. `data.js` (unchanged)
2. `src/shared/icons/icons.jsx` ← was `icons.jsx`
3. `join-app.jsx` (unchanged — root)

---

## 5. Runtime Safety Check

| Check | Result |
|---|---|
| JSX file contents changed | No |
| Root `icons.jsx` still exists | Yes |
| Root `atoms.jsx` still exists | Yes |
| Root `tweaks-panel.jsx` still exists | Yes |
| Any view-*.jsx files changed | No |
| `app.jsx` changed | No |
| `shell.jsx` changed | No |
| `data.js` changed | No |
| CSS files changed | No |
| `package.json` changed | No |
| `index.html` changed | No |
| src/shared JSX contents changed | No |

---

## 6. Risks

| Risk | Assessment |
|---|---|
| **Wrong relative path → JSX 404** | Paths `src/shared/icons/icons.jsx` and `src/shared/components/*.jsx` are relative to the HTML file location. Since HTML files are at project root and `src/` is a subdirectory, paths are correct for local serving. Verify with Network tab. |
| **Babel failure** | Babel loads each `type="text/babel"` script by path. Incorrect path causes a silent 404 and Babel skips the file, leaving `window.I`, `ScoreRing`, etc. undefined. Confirm in console: no `GET .../icons.jsx net::ERR_NOT_FOUND`. |
| **`window.I` undefined** | `icons.jsx` assigns to `window.I`. If the file 404s, all icon references in later files will throw. This would be caught immediately on load. |
| **atoms globals undefined** | `atoms.jsx` assigns `window.ScoreRing`, `window.CoLogo`, `window.SectorPill`, etc. A 404 would crash all views using these components. |
| **TweaksPanel undefined** | `tweaks-panel.jsx` assigns `window.TweaksPanel` / `window.useTweaks`. A 404 would crash `app.jsx` if it references these. |
| **Duplicate copies can diverge** | Root `icons.jsx`, `atoms.jsx`, and `tweaks-panel.jsx` are no longer loaded at runtime but still exist. If someone edits them, the change has no visual effect. A future cleanup step should retire or archive the root copies. |
| **GitHub Pages / deployment** | Relative paths should resolve correctly in any deployment where HTML files and `src/` share the same root. Test after any deployment. |

---

## 7. Manual Tests Required

1. Hard-refresh `http://localhost:8080/ecos.html` (`Cmd+Shift+R`)
   - Dashboard renders correctly
   - Sidebar icons render (tests `window.I` from icons.jsx)
   - Topbar search renders (tests atoms components)
   - Companies view opens
   - Ramon.Space profile opens — Tech, Match, Connections tabs all work (tests ScoreRing, CoLogo, SectorPill)
   - Onboarding Readiness step renders chips (tests window.READINESS and atoms)
   - Map view opens
   - DevTools → Network → JS: confirm `src/shared/icons/icons.jsx`, `src/shared/components/atoms.jsx`, `src/shared/components/tweaks-panel.jsx` all load with status 200
   - Console: zero 404 errors, zero `undefined` errors for window.I / ScoreRing / TweaksPanel

2. Hard-refresh `http://localhost:8080/join.html`
   - Join wizard opens correctly
   - Icons render in wizard (tests `window.I`)
   - Network: `src/shared/icons/icons.jsx` loads with status 200
   - Console: zero 404 errors

3. Open `http://localhost:8080/index.html`
   - Confirm it loads and looks identical (unaffected — does not reference these JSX files)

---

## 8. Recommended Next Step

**Cleanup: Retire root shared JSX duplicates.**

`icons.jsx`, `atoms.jsx`, and `tweaks-panel.jsx` at the project root are no longer loaded at runtime (after Batch C). They are stale duplicates that create an editing trap.

Options:
1. Delete them (requires confirming Batch C is working and no other file references them directly)
2. Move them to `assets/archived/` or similar
3. Add a comment at the top of each: `// INACTIVE — loaded from src/shared/... — do not edit`

This should only be done after Batch C is confirmed working in the browser.

Requires explicit approval before starting.
