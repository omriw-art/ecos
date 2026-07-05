# BATCH_F_SELF_REVIEW

Date: 2026-07-05

---

## 1. Scope Check

This batch changed only dashboard `<script>` `src` values in `ecos.html` plus created/updated docs.

- 1 HTML file modified (script src paths only — nothing else)
- 1 existing doc updated: `docs/REFACTOR_LOG.md`
- 1 new doc created: `docs/BATCH_F_SELF_REVIEW.md` (this file)

No JSX file contents changed. No files moved or deleted.

---

## 2. Changed Files

| Action | File |
|---|---|
| Modified (script src paths only) | `ecos.html` — 9 `<script>` tag src values updated |
| Updated | `docs/REFACTOR_LOG.md` — Batch F entry appended |
| Created | `docs/BATCH_F_SELF_REVIEW.md` |

---

## 3. Exact Script Changes

**ecos.html:**
```html
<!-- Before -->
<script type="text/babel" src="shell.jsx"></script>
<script type="text/babel" src="view-dashboard.jsx"></script>
<script type="text/babel" src="view-capabilities.jsx"></script>
<script type="text/babel" src="view-companies.jsx"></script>
<script type="text/babel" src="view-map.jsx"></script>
<script type="text/babel" src="view-matches.jsx"></script>
<script type="text/babel" src="view-onboard.jsx"></script>
<script type="text/babel" src="view-misc.jsx"></script>
<script type="text/babel" src="app.jsx"></script>

<!-- After -->
<script type="text/babel" src="src/app/shell.jsx"></script>
<script type="text/babel" src="src/modules/dashboard/view-dashboard.jsx"></script>
<script type="text/babel" src="src/modules/capabilities/view-capabilities.jsx"></script>
<script type="text/babel" src="src/modules/organizations/view-companies.jsx"></script>
<script type="text/babel" src="src/modules/map/view-map.jsx"></script>
<script type="text/babel" src="src/modules/matches/view-matches.jsx"></script>
<script type="text/babel" src="src/modules/onboarding/view-onboard.jsx"></script>
<script type="text/babel" src="src/modules/misc/view-misc.jsx"></script>
<script type="text/babel" src="src/app/app.jsx"></script>
```

---

## 4. Load Order Check

Full `ecos.html` script load order — unchanged except for path values:

| # | Script | Status |
|---|---|---|
| 1 | `data.js?v=3` | Unchanged |
| 2 | `src/shared/components/tweaks-panel.jsx` | Unchanged (active since Batch C) |
| 3 | `src/shared/icons/icons.jsx` | Unchanged (active since Batch C) |
| 4 | `src/shared/components/atoms.jsx` | Unchanged (active since Batch C) |
| 5 | `src/app/shell.jsx` | Path updated |
| 6 | `src/modules/dashboard/view-dashboard.jsx` | Path updated |
| 7 | `src/modules/capabilities/view-capabilities.jsx` | Path updated |
| 8 | `src/modules/organizations/view-companies.jsx` | Path updated |
| 9 | `src/modules/map/view-map.jsx` | Path updated |
| 10 | `src/modules/matches/view-matches.jsx` | Path updated |
| 11 | `src/modules/onboarding/view-onboard.jsx` | Path updated |
| 12 | `src/modules/misc/view-misc.jsx` | Path updated |
| 13 | `src/app/app.jsx` | Path updated — loads last, as required |

`app.jsx` correctly loads last. `shell.jsx` loads before all view files.
`data.js` loads before all JSX. `tweaks-panel`, `icons`, `atoms` load before shell. Order preserved.

---

## 5. Runtime Safety Check

| Check | Result |
|---|---|
| JSX file contents changed | No |
| Root `app.jsx` still exists | Yes |
| Root `shell.jsx` still exists | Yes |
| Root `view-*.jsx` files still exist | Yes (all 7) |
| `src/` dashboard files changed | No |
| `join.html` changed | No |
| `index.html` changed | No |
| `data.js` changed | No |
| CSS files changed | No |
| `package.json` changed | No |
| `src/shared/` files changed | No |

---

## 6. Risks

| Risk | Assessment |
|---|---|
| **Wrong relative path → JSX 404** | Paths like `src/modules/dashboard/view-dashboard.jsx` are relative to `ecos.html` at root. Since `src/` is a subdirectory of root, paths resolve correctly for local serving. Verify with Network tab. |
| **Script order mistake** | The order was changed in one atomic edit replacing all 9 lines together, preserving sequence. Verified via `git diff`. |
| **`app.jsx` must load last** | Confirmed — `src/app/app.jsx` is the 13th and final script tag, unchanged from its position before this batch. |
| **window.* globals undefined** | If any file 404s, later scripts reading its globals (e.g. `window.Shell`, view components) will throw. This would be caught immediately on page load. |
| **Duplicate root/src copies can diverge** | Root dashboard files are now inactive at runtime but still exist. Editing root files has no effect. A future Batch G cleanup step should retire them after Batch F is confirmed working. |

---

## 7. Manual Tests Required

1. Hard-refresh `http://localhost:8080/ecos.html` (`Cmd+Shift+R`)
   - Dashboard renders correctly
   - Sidebar layout and icons render (tests `window.Shell`, `window.I`)
   - Topbar search renders (tests atoms globals)
   - Companies view opens → Ramon.Space profile → Tech, Match, Connections tabs work
   - Capabilities view opens
   - Map view opens
   - Matches view opens
   - Onboarding Readiness step renders chips
   - DevTools → Network → JS: all 9 `src/` files load with status 200
   - Console: zero 404 errors, zero `window.*` undefined errors

2. Open `http://localhost:8080/join.html`
   - Confirm unaffected — wizard opens, icons render

3. Open `http://localhost:8080/index.html`
   - Confirm unaffected — loads identically

---

## 8. Recommended Next Step

**Batch G: Cleanup — retire root dashboard duplicates.**

After confirming Batch F is working in the browser, the root files `app.jsx`, `shell.jsx`, and all `view-*.jsx` are no longer loaded at runtime. They are stale duplicates that create an editing trap.

Options:
1. Delete them (cleanest — files are recoverable via git history)
2. Move to `assets/archived/`
3. Add inactive-notice comments at the top of each

This should only be done after Batch F is confirmed working in the browser.
Requires explicit approval before starting.
