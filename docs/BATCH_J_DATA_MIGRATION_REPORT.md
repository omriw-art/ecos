# BATCH_J_DATA_MIGRATION_REPORT

Date: 2026-07-05
Batch: J — Data Runtime Migration

---

## 1. Scope

`data.js` was copied to `src/data/data.js` and all three HTML entry point references were updated to load from the `src/` path. Root `data.js` was intentionally preserved as a rollback target and must not be deleted until all three entry points are verified working in the browser.

---

## 2. Files Changed

| Phase | File | Action |
|---|---|---|
| 1 | `src/data/data.js` | Created — byte-identical copy of root `data.js` |
| 1 | `docs/REFACTOR_LOG.md` | Batch J phases appended |
| 1 | `docs/BATCH_J_SELF_REVIEW.md` | Created |
| 2 | `ecos.html` | Script src updated |
| 3 | `join.html` | Script src updated |
| 4 | `index.html` | Script src updated |
| 5 | `docs/BATCH_J_DATA_MIGRATION_REPORT.md` | Created (this file) |
| 5 | `docs/ROOT_RUNTIME_AUDIT.md` | Updated |
| 5 | `docs/STRUCTURE_STATUS.md` | Updated |
| 5 | `docs/DATA_LAYER_MIGRATION_PLAN.md` | Updated |
| 5 | `src/README.md` | Updated |

---

## 3. HTML Data Script Updates

| HTML file | Old src | New src |
|---|---|---|
| `ecos.html` | `data.js?v=3` | `src/data/data.js?v=3` |
| `join.html` | `data.js` | `src/data/data.js` |
| `index.html` | `data.js?v=4` | `src/data/data.js?v=4` |

Cache-buster query strings were preserved exactly per original. No version numbers were changed.

---

## 4. Script Order Safety

**ecos.html** — `src/data/data.js?v=3` loads at position 1, before all JSX scripts. Unchanged.

**join.html** — `src/data/data.js` loads at position 1, before `icons.jsx` and `join-app.jsx`. Unchanged.

**index.html** — `src/data/data.js?v=4` remains at line 450, before the inline `<script>` block that reads `window.COMPANIES`, `window.SECTOR_DIST`, etc. Position unchanged.

---

## 5. Root data.js Status

Root `data.js` **still exists** at the project root. It is no longer referenced by any HTML file but is preserved as a rollback target. Do not delete it until all three entry points are manually verified working with `src/data/data.js`.

---

## 6. src/data/data.js Status

`src/data/data.js` was created by `cp data.js src/data/data.js` and verified byte-identical via `diff`. It is now the active data source loaded by all three HTML entry points.

---

## 7. Risks

| Risk | Assessment |
|---|---|
| **Root and src copies can diverge** | Root `data.js` is no longer loaded at runtime but still exists. Future data edits must target `src/data/data.js`. Root copy becomes stale the moment any edit is made to `src/data/data.js`. |
| **Root data.js should be deleted after testing** | Once all three entry points are confirmed working, run a cleanup batch to delete root `data.js`. Until then, it is a confusing duplicate. |
| **Cached HTML in browser** | Browsers with cached old HTML may still load root `data.js` via `data.js?v=3` or `data.js?v=4`. `Cmd+Shift+R` hard-refresh clears this. Since root `data.js` still exists and is identical, this is not a runtime error — it's just a stale cache. |
| **index.html is mid-document** | The `<script>` tag in `index.html` is at line 450 (mid-document). Its position was not changed — only the `src` value. The tag still precedes the inline `<script>` block that reads `window.*` globals. |

---

## 8. Manual Tests Required

1. **Hard-refresh `http://localhost:8080/ecos.html`** (`Cmd+Shift+R`)
   - Dashboard renders correctly
   - Companies view → Ramon.Space profile → Tech, Match, Connections tabs work
   - Capabilities, Map, Matches, Onboarding Readiness step all work
   - Network tab: `src/data/data.js` loads with status 200
   - Console: zero 404 errors, zero `window.*` undefined errors

2. **Hard-refresh `http://localhost:8080/join.html`**
   - Onboarding wizard renders
   - Icons render
   - All steps work
   - Network tab: `src/data/data.js` loads with status 200
   - Console: zero 404 errors

3. **Hard-refresh `http://localhost:8080/index.html`**
   - Public landing page renders
   - Company directory loads with logos
   - Sector distribution / funnel data visible
   - Network tab: `src/data/data.js` loads with status 200
   - Console: zero 404 errors, zero undefined globals

---

## 9. Recommended Next Step

1. **Test all three entry points manually** (see section 8).
2. **Only after testing passes:** run a cleanup batch to delete root `data.js`.
   ```
   git rm data.js
   git commit -m "cleanup: remove root data.js duplicate after src migration"
   ```
3. `data.js` will remain recoverable via git history — no data is lost.
