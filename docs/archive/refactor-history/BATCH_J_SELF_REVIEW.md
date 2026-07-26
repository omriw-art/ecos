# BATCH_J_SELF_REVIEW

Date: 2026-07-05

---

## Phase 1 — Copy data.js to src/data

### Scope Check
Copied `data.js` → `src/data/data.js`. No HTML files changed. No runtime behavior changed.

### Verification
- `diff data.js src/data/data.js` returned clean — contents byte-identical
- Root `data.js` still exists and is unmodified
- No HTML file was touched in Phase 1

---

## Phase 2 — Migrate ecos.html

### Exact Change
```html
<!-- Before -->
<script src="data.js?v=3"></script>

<!-- After -->
<script src="src/data/data.js?v=3"></script>
```

### Load Order (ecos.html) — unchanged
1. `src/data/data.js?v=3`
2. `src/shared/components/tweaks-panel.jsx`
3. `src/shared/icons/icons.jsx`
4. `src/shared/components/atoms.jsx`
5. `src/app/shell.jsx`
6–12. view files
13. `src/app/app.jsx`

### Safety
- Cache-buster `?v=3` preserved
- No script type changed
- No script order changed
- No JSX content changed

---

## Phase 3 — Migrate join.html

### Exact Change
```html
<!-- Before -->
<script src="data.js"></script>

<!-- After -->
<script src="src/data/data.js"></script>
```

### Load Order (join.html) — unchanged
1. `src/data/data.js`
2. `src/shared/icons/icons.jsx`
3. `src/modules/onboarding/join-app.jsx`

### Safety
- No cache-buster on this file — preserved as-is (no `?v=` added)
- No script type changed
- No script order changed

---

## Phase 4 — Migrate index.html

### Exact Change
```html
<!-- Before (line 450) -->
<script src="data.js?v=4"></script>

<!-- After (line 450) -->
<script src="src/data/data.js?v=4"></script>
```

### Safety
- Script tag stayed at same line position (450)
- Cache-buster `?v=4` preserved
- No inline JS changed
- No CSS changed

---

## Runtime Safety Check (all phases)

| Check | Result |
|---|---|
| `ecos.html` data path updated | ✓ `src/data/data.js?v=3` |
| `join.html` data path updated | ✓ `src/data/data.js` |
| `index.html` data path updated | ✓ `src/data/data.js?v=4` |
| Root `data.js` preserved | ✓ Not deleted |
| `src/data/data.js` identical to root | ✓ diff clean |
| Any JSX contents changed | No |
| Any CSS changed | No |
| `package.json` changed | No |
| `ecos-qr.png` staged | No |

---

## Risks

| Risk | Assessment |
|---|---|
| **Root and src copies can diverge** | Root `data.js` is no longer loaded at runtime. Future edits must target `src/data/data.js`. Root copy should be deleted after manual test confirms all entry points work. |
| **Cached HTML in browser** | A browser with cached old HTML pointing to root `data.js` will still load the root file — but that's fine since root `data.js` still exists and is identical. Hard-refresh (`Cmd+Shift+R`) forces use of the new path. |
| **Different cache-busters per HTML file** | `ecos.html` uses `?v=3`, `index.html` uses `?v=4`, `join.html` uses none. These were preserved exactly — no version numbers changed. |
| **index.html script position** | The data script tag in `index.html` is at line 450 (mid-document). Its position was not changed — only the `src` value was updated. |

---

## Recommended Next Step

Manually test all three entry points in the browser, then run a cleanup batch to delete root `data.js`. Root `data.js` is the rollback target until testing is complete.
