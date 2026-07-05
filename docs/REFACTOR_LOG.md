# REFACTOR_LOG

---

## Step 8 — Move Python Utility Scripts

### Date
2026-07-05

### Files Moved
- `fetch_logos.py` → `scripts/fetch_logos.py`
- `fetch_site_logos.py` → `scripts/fetch_site_logos.py`

### Reason
These are standalone non-runtime Python utility scripts used manually to populate the `logos/` folder by fetching images from Wikipedia and partner websites. They are not referenced by any HTML, JSX, JS, or CSS runtime file. Confirmed by full-project grep in Step 7 audit.

### Runtime Impact
None. No script tags, imports, or HTML references updated. App behavior is unchanged.

### Files Not Moved
- `logos/` — actively referenced in `index.html` (hardcoded and dynamic paths); do not move without updating `index.html`
- `spec.html` — standalone spec page; not linked from runtime; leave at root
- `attachments.zip` — not referenced at runtime; safe to move later if desired
- `ecos-qr.png` — not referenced at runtime; safe to move to `assets/` later

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] `index.html` opens without errors
- [ ] `join.html` opens without errors
- [ ] No console errors related to missing files

---

## Step 9 — Create Future Source Structure

### Date
2026-07-05

### Folders Created
```
src/
src/app/
src/shared/
src/shared/components/
src/shared/icons/
src/shared/styles/
src/modules/
src/modules/organizations/
src/modules/opportunities/
src/modules/governance/
src/modules/search/
src/modules/export/
src/modules/onboarding/
src/data/
src/config/
src/utils/
```
Each folder contains a `.gitkeep` file so Git tracks it. Total: 16 folders, 16 `.gitkeep` files.

### Reason
Prepare a future modular structure without changing current runtime behavior. Gives future refactor tasks a clear, approved destination for each file type before any files are moved.

### Runtime Impact
None. No runtime file was moved or referenced from `src/`. All HTML script tags still point to root-level files.

### Files Not Moved
- `app.jsx`
- `shell.jsx`
- `atoms.jsx`
- `icons.jsx`
- `styles.css`
- `data.js`
- `view-*.jsx`
- `ecos.html`
- `index.html`
- `join.html`
- `join-app.jsx`
- `logos/`
- `spec.html`
- `attachments.zip`
- `ecos-qr.png`

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] `index.html` opens without errors
- [ ] `join.html` opens without errors
- [ ] No console errors related to `src/`

---

## Batch A — Copy Shared Runtime Files Into src/

### Date
2026-07-05

### Files Copied
- `icons.jsx` → `src/shared/icons/icons.jsx`
- `atoms.jsx` → `src/shared/components/atoms.jsx`
- `tweaks-panel.jsx` → `src/shared/components/tweaks-panel.jsx`
- `styles.css` → `src/shared/styles/styles.css`
- `join-styles.css` → `src/shared/styles/join-styles.css`

### Runtime Impact
None. No HTML, `<script>` tags, `<link>` tags, imports, or runtime references were changed. The app still loads all files from the root.

### Originals Preserved
All 5 original root files remain in place and unchanged:
- `icons.jsx` ✓
- `atoms.jsx` ✓
- `tweaks-panel.jsx` ✓
- `styles.css` ✓
- `join-styles.css` ✓

### Reason
Prepare the future modular structure without changing current app behavior. The copies in `src/` serve as reference copies only — they are not loaded by the browser until a later batch explicitly updates the HTML link/script tags.

### Files Also Created
- `src/README.md` — explains current status, copied files, and migration direction
- `docs/BATCH_A_SELF_REVIEW.md` — self-review confirming no runtime changes

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] `index.html` opens without errors
- [ ] `join.html` opens without errors
- [ ] Companies view opens
- [ ] Ramon.Space profile opens
- [ ] Onboarding Readiness step (step 4) renders chips
- [ ] Browser console has no new errors

---

## Batch B — CSS Runtime Migration

### Date
2026-07-05

### Files Modified
- `ecos.html` — CSS link path updated
- `join.html` — CSS link paths updated (2 links)
- `docs/REFACTOR_LOG.md` — Batch B entry appended
- `docs/BATCH_B_SELF_REVIEW.md` — created

### CSS Paths Updated
| File | Old href | New href |
|---|---|---|
| `ecos.html` | `styles.css` | `src/shared/styles/styles.css` |
| `join.html` | `styles.css` | `src/shared/styles/styles.css` |
| `join.html` | `join-styles.css` | `src/shared/styles/join-styles.css` |

### Runtime Impact
`ecos.html` and `join.html` now load CSS from `src/shared/styles/`. CSS file contents are unchanged. `index.html` was not affected (uses inline CSS only).

### Root CSS Files
`styles.css` and `join-styles.css` remain at root — not deleted, not moved. They are no longer loaded at runtime by the two HTML files, but are preserved as backup.

### Rollback
Revert the 3 `href` values in `ecos.html` and `join.html` back to:
- `styles.css`
- `join-styles.css`

### Manual Test Checklist
- [ ] `ecos.html` opens with visual design identical to before
- [ ] `join.html` opens with visual design identical to before
- [ ] Browser console has no CSS 404 errors
- [ ] Network tab shows `src/shared/styles/styles.css` loaded (not root `styles.css`)
- [ ] Network tab shows `src/shared/styles/join-styles.css` loaded for `join.html`
- [ ] `index.html` unaffected — loads and looks identical

---

## Batch C — Shared JSX Script Migration

### Date
2026-07-05

### Files Modified
- `ecos.html` — 3 script src paths updated
- `join.html` — 1 script src path updated
- `docs/REFACTOR_LOG.md` — Batch C entry appended
- `docs/BATCH_C_SELF_REVIEW.md` — created

### Script Paths Updated
| File | Old src | New src |
|---|---|---|
| `ecos.html` | `tweaks-panel.jsx` | `src/shared/components/tweaks-panel.jsx` |
| `ecos.html` | `icons.jsx` | `src/shared/icons/icons.jsx` |
| `ecos.html` | `atoms.jsx` | `src/shared/components/atoms.jsx` |
| `join.html` | `icons.jsx` | `src/shared/icons/icons.jsx` |

### Runtime Impact
`ecos.html` and `join.html` now load shared JSX files from `src/shared/`. The copied JSX contents are identical to the original root files. Script load order is unchanged. `index.html` was not affected (does not reference these JSX files).

### Originals Preserved
All root copies remain in place — not deleted, not moved:
- `icons.jsx` ✓
- `atoms.jsx` ✓
- `tweaks-panel.jsx` ✓

### Rollback
Revert script src values in `ecos.html` and `join.html` back to:
- `icons.jsx`
- `atoms.jsx`
- `tweaks-panel.jsx`

Root JSX files were not deleted — reverting the src values is sufficient.

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] Dashboard renders correctly
- [ ] Sidebar icons render (window.I globals)
- [ ] Topbar search renders
- [ ] Companies view opens
- [ ] Ramon.Space profile opens — Tech / Match / Connections tabs work
- [ ] Onboarding Readiness step renders chips
- [ ] Map view opens
- [ ] `join.html` opens without errors
- [ ] Join wizard icons render
- [ ] Browser console: no JSX 404 errors
- [ ] Browser console: no `window.I undefined` errors
- [ ] Browser console: no `ScoreRing / CoLogo / TweaksPanel undefined` errors
- [ ] `index.html` unaffected — loads and looks identical
