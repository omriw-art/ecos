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

---

## Batch D — Cleanup Migrated Root Shared Files

### Date
2026-07-05

### Files Deleted
- `styles.css`
- `join-styles.css`
- `icons.jsx`
- `atoms.jsx`
- `tweaks-panel.jsx`

### Reason
These files were migrated to `src/shared/` in Batches A–C and are no longer referenced by any runtime HTML file. Removing them eliminates the stale-duplicate editing trap.

### Runtime Impact
None. Runtime uses `src/shared/` paths exclusively since Batches B and C. `index.html` uses inline CSS only and did not reference any of these files.

### Audit Result
Searched all runtime files for bare references to the 5 root filenames:
`ecos.html`, `join.html`, `index.html`, `app.jsx`, `shell.jsx`, `join-app.jsx`, `view-*.jsx`

Result: all matches found in `ecos.html` and `join.html` already point to `src/shared/...` paths. No bare root references (`href="styles.css"`, `src="icons.jsx"`, etc.) were found in any runtime file. Deletion confirmed safe.

### Rollback
Restore deleted files from the previous commit:
```
git checkout HEAD~1 -- styles.css join-styles.css icons.jsx atoms.jsx tweaks-panel.jsx
```

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] Dashboard renders correctly
- [ ] Sidebar icons render (window.I globals)
- [ ] Companies view opens
- [ ] Ramon.Space profile opens — Tech / Match / Connections tabs work
- [ ] Onboarding Readiness step renders chips
- [ ] `join.html` opens without errors
- [ ] Join wizard icons render
- [ ] Browser console: no 404 errors
- [ ] Browser console: no `window.I undefined` errors
- [ ] Browser console: no `ScoreRing / CoLogo / TweaksPanel undefined` errors
- [ ] `index.html` opens and looks identical

---

## Batch E — Copy Core Dashboard Files Into src

### Date
2026-07-05

### Files Copied

| Source (root) | Destination (src) |
|---|---|
| `app.jsx` | `src/app/app.jsx` |
| `shell.jsx` | `src/app/shell.jsx` |
| `view-dashboard.jsx` | `src/modules/dashboard/view-dashboard.jsx` |
| `view-companies.jsx` | `src/modules/organizations/view-companies.jsx` |
| `view-capabilities.jsx` | `src/modules/capabilities/view-capabilities.jsx` |
| `view-map.jsx` | `src/modules/map/view-map.jsx` |
| `view-matches.jsx` | `src/modules/matches/view-matches.jsx` |
| `view-misc.jsx` | `src/modules/misc/view-misc.jsx` |
| `view-onboard.jsx` | `src/modules/onboarding/view-onboard.jsx` |

### New Folders Created
- `src/modules/dashboard/`
- `src/modules/capabilities/`
- `src/modules/map/`
- `src/modules/matches/`
- `src/modules/misc/`

### Runtime Impact
None. `ecos.html` still loads all root dashboard files. No script tags changed. App behavior is unchanged.

### Originals Preserved
All root files remain in place, unchanged, and active:
- `app.jsx` ✓
- `shell.jsx` ✓
- `view-dashboard.jsx` ✓
- `view-companies.jsx` ✓
- `view-capabilities.jsx` ✓
- `view-map.jsx` ✓
- `view-matches.jsx` ✓
- `view-misc.jsx` ✓
- `view-onboard.jsx` ✓

### Reason
Prepare the future dashboard runtime migration without changing current app behavior. Copies serve as reference candidates for Batch F, which will switch `ecos.html` script tags to load from `src/`.

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] Dashboard renders correctly
- [ ] Companies view opens
- [ ] Ramon.Space profile opens — Tech / Match / Connections tabs work
- [ ] Onboarding Readiness step renders chips
- [ ] Map view opens
- [ ] Matches view opens
- [ ] Browser console: no new errors

---

## Batch F — Dashboard Script Migration to src

### Date
2026-07-05

### Files Modified
- `ecos.html` — 9 script src paths updated
- `docs/REFACTOR_LOG.md` — Batch F entry appended
- `docs/BATCH_F_SELF_REVIEW.md` — created

### Script Paths Updated
| File | Old src | New src |
|---|---|---|
| `ecos.html` | `shell.jsx` | `src/app/shell.jsx` |
| `ecos.html` | `view-dashboard.jsx` | `src/modules/dashboard/view-dashboard.jsx` |
| `ecos.html` | `view-capabilities.jsx` | `src/modules/capabilities/view-capabilities.jsx` |
| `ecos.html` | `view-companies.jsx` | `src/modules/organizations/view-companies.jsx` |
| `ecos.html` | `view-map.jsx` | `src/modules/map/view-map.jsx` |
| `ecos.html` | `view-matches.jsx` | `src/modules/matches/view-matches.jsx` |
| `ecos.html` | `view-onboard.jsx` | `src/modules/onboarding/view-onboard.jsx` |
| `ecos.html` | `view-misc.jsx` | `src/modules/misc/view-misc.jsx` |
| `ecos.html` | `app.jsx` | `src/app/app.jsx` |

### Runtime Impact
`ecos.html` now loads all dashboard files from `src/`. File contents are unchanged from the copied root originals (verified byte-identical in Batch E). Script load order is unchanged.

### Originals Preserved
All root dashboard files remain in place as rollback backup:
- `app.jsx` ✓
- `shell.jsx` ✓
- `view-dashboard.jsx` ✓
- `view-companies.jsx` ✓
- `view-capabilities.jsx` ✓
- `view-map.jsx` ✓
- `view-matches.jsx` ✓
- `view-misc.jsx` ✓
- `view-onboard.jsx` ✓

### Rollback
Revert `ecos.html` script src values back to the root filenames:
- `shell.jsx`, `view-dashboard.jsx`, `view-capabilities.jsx`, `view-companies.jsx`
- `view-map.jsx`, `view-matches.jsx`, `view-onboard.jsx`, `view-misc.jsx`, `app.jsx`

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] Dashboard renders correctly
- [ ] Sidebar renders correctly
- [ ] Sidebar icons render (window.I)
- [ ] Topbar search renders (atoms globals)
- [ ] Companies view opens
- [ ] Ramon.Space profile opens — Tech / Match / Connections tabs work
- [ ] Capabilities view opens
- [ ] Map view opens
- [ ] Matches view opens
- [ ] Onboarding Readiness step renders chips
- [ ] Browser console: no 404 errors
- [ ] Browser console: no `window.*` undefined errors

---

## Batch G — Cleanup Root Dashboard Duplicate Files

### Date
2026-07-05

### Files Deleted
- `app.jsx`
- `shell.jsx`
- `view-dashboard.jsx`
- `view-companies.jsx`
- `view-capabilities.jsx`
- `view-map.jsx`
- `view-matches.jsx`
- `view-misc.jsx`
- `view-onboard.jsx`

### Reason
These files were migrated to `src/app/` and `src/modules/` in Batch E, and `ecos.html` was updated in Batch F to load from those `src/` paths. The root copies are no longer referenced by any runtime file.

### Runtime Impact
None. `ecos.html` loads all dashboard runtime from `src/`. `join.html` and `index.html` were unaffected throughout.

### Audit Result
Searched `ecos.html`, `join.html`, `index.html`, `data.js`, `join-app.jsx`, and all of `src/` for references to the 9 root filenames.

- `ecos.html`: all matches point to `src/app/` or `src/modules/` paths — no bare root references
- `join.html`: only match is `join-app.jsx` (active file, not being deleted)
- `index.html`, `data.js`, `join-app.jsx`, `src/`: zero matches

Deletion confirmed safe.

### Active Root Runtime Files Preserved
- `data.js` ✓
- `join-app.jsx` ✓
- `ecos.html` ✓
- `index.html` ✓
- `join.html` ✓

### Rollback
Restore deleted files from git history:
```
git checkout HEAD~1 -- app.jsx shell.jsx view-dashboard.jsx view-companies.jsx view-capabilities.jsx view-map.jsx view-matches.jsx view-misc.jsx view-onboard.jsx
```

### Manual Test Checklist
- [ ] `ecos.html` opens without errors
- [ ] Dashboard renders correctly
- [ ] Sidebar renders correctly
- [ ] Companies view opens
- [ ] Ramon.Space profile opens — Tech / Match / Connections tabs work
- [ ] Capabilities view opens
- [ ] Map view opens
- [ ] Matches view opens
- [ ] Onboarding Readiness step renders chips
- [ ] `join.html` opens without errors
- [ ] `index.html` opens without errors
- [ ] Browser console: no 404 errors
