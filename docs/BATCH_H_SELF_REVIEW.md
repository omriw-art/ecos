# BATCH_H_SELF_REVIEW

Date: 2026-07-05

---

## 1. Scope Check

This batch moved `join-app.jsx` to `src/modules/onboarding/join-app.jsx`, updated the corresponding script tag in `join.html`, and updated docs. No file contents changed. No other runtime files touched.

---

## 2. Changed Files

| Action | File |
|---|---|
| Moved (git rm + add) | `join-app.jsx` → `src/modules/onboarding/join-app.jsx` |
| Modified (script src only) | `join.html` — 1 `<script>` tag src value updated |
| Updated | `docs/REFACTOR_LOG.md` — Batch H entry appended |
| Created | `docs/BATCH_H_SELF_REVIEW.md` |

---

## 3. Exact Script Change

**join.html:**
```html
<!-- Before -->
<script type="text/babel" src="join-app.jsx"></script>

<!-- After -->
<script type="text/babel" src="src/modules/onboarding/join-app.jsx"></script>
```

---

## 4. Load Order Check

**join.html** — order unchanged, path only:

| # | Script | Status |
|---|---|---|
| 1 | `data.js` | Unchanged |
| 2 | `src/shared/icons/icons.jsx` | Unchanged (active since Batch C) |
| 3 | `src/modules/onboarding/join-app.jsx` | Path updated |

`data.js` loads before icons, icons loads before join-app. Order preserved.

---

## 5. Runtime Safety Check

| Check | Result |
|---|---|
| `join-app.jsx` contents changed | No (copy verified byte-identical via `diff`) |
| `data.js` changed | No |
| Icons path changed | No |
| CSS paths changed | No |
| `ecos.html` changed | No |
| `index.html` changed | No |
| `package.json` changed | No |
| Root `join-app.jsx` deleted after `join.html` pointed to `src` | Yes — staged via `git rm` after `join.html` was updated |

---

## 6. Risks

| Risk | Assessment |
|---|---|
| **Wrong relative path → `join-app.jsx` 404** | Path `src/modules/onboarding/join-app.jsx` is relative to `join.html` at root. Since `src/` is a subdirectory of root, path resolves correctly for local serving. Verify in Network tab. |
| **Cached `join.html` in browser** | A browser with a cached copy of old `join.html` pointing to root `join-app.jsx` will 404 now that the root file is deleted. `Cmd+Shift+R` clears this. |
| **`data.js` remains root/global** | `data.js` is still loaded from root by all three HTML files. It is shared across the dashboard, landing page, and join flow. Migration requires separate careful planning — not done in this batch. |

---

## 7. Manual Tests Required

1. Hard-refresh `http://localhost:8080/join.html` (`Cmd+Shift+R`)
   - Onboarding wizard renders correctly
   - Icons render (tests `window.I` from `src/shared/icons/icons.jsx`)
   - Network tab: `src/modules/onboarding/join-app.jsx` loads with status 200
   - Console: zero 404 errors

2. Confirm `http://localhost:8080/ecos.html` — unaffected, dashboard still renders
3. Confirm `http://localhost:8080/index.html` — unaffected, landing page still works

---

## 8. Recommended Next Step

**Root Runtime Audit** — create `docs/ROOT_RUNTIME_AUDIT.md` documenting what remains active at root after all migrations. Then plan `data.js` migration (copy-only first — do not move directly). `data.js` is the last major root runtime dependency and the most complex to migrate because all three HTML entry points reference it.
