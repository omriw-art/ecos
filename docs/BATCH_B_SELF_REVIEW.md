# BATCH_B_SELF_REVIEW

Date: 2026-07-05

---

## 1. Scope Check

This batch changed only CSS `<link>` `href` values in `ecos.html` and `join.html`, plus created/updated docs.

- 2 HTML files modified (link hrefs only — nothing else)
- 1 existing doc updated: `docs/REFACTOR_LOG.md`
- 1 new doc created: `docs/BATCH_B_SELF_REVIEW.md` (this file)

No CSS contents changed. No files moved or deleted.

---

## 2. Changed Files

| Action | File |
|---|---|
| Modified (href only) | `ecos.html` — 1 `<link>` tag href updated |
| Modified (hrefs only) | `join.html` — 2 `<link>` tag hrefs updated |
| Updated | `docs/REFACTOR_LOG.md` — Batch B entry appended |
| Created | `docs/BATCH_B_SELF_REVIEW.md` |

---

## 3. Exact Link Changes

**ecos.html:**
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css" />

<!-- After -->
<link rel="stylesheet" href="src/shared/styles/styles.css" />
```

**join.html:**
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="join-styles.css" />

<!-- After -->
<link rel="stylesheet" href="src/shared/styles/styles.css" />
<link rel="stylesheet" href="src/shared/styles/join-styles.css" />
```

---

## 4. Runtime Safety Check

| Check | Result |
|---|---|
| CSS file contents changed | No |
| Root `styles.css` still exists | Yes |
| Root `join-styles.css` still exists | Yes |
| Any JSX files changed | No |
| `data.js` changed | No |
| `<script>` tags changed | No |
| `package.json` changed | No |
| `index.html` changed | No |

---

## 5. Risks

| Risk | Assessment |
|---|---|
| **Wrong relative path → CSS 404** | The path `src/shared/styles/styles.css` is relative to the HTML file location. Since `ecos.html` and `join.html` are at the project root, and `src/shared/styles/` is a subdirectory of root, the path is correct for local serving. Verify in browser Network tab. |
| **GitHub Pages / deployment path** | If the project is deployed to a subdirectory (e.g. `gh-pages/ecos/`), relative paths should still resolve correctly since both the HTML and `src/` are in the same directory tree. Test after any deployment. |
| **Duplicate copies can diverge** | Root `styles.css` and `join-styles.css` are no longer loaded at runtime but still exist. If someone edits the root copies, the change will have no visual effect (since the `src/` copies are now active). This is a trap — the next step (Batch C or a cleanup step) should delete or clearly mark the root CSS files as inactive. |
| **No change to content** | The CSS loaded is byte-for-byte identical to what was loaded before — only the path changed. Visual risk is zero if the path resolves correctly. |

---

## 6. Manual Tests Required

1. Hard-refresh `http://localhost:8080/ecos.html` (`Cmd+Shift+R`)
   - Visual appearance must be identical to before
   - Open DevTools → Network → filter by CSS → confirm `src/shared/styles/styles.css` is loaded with status 200
   - Confirm root `styles.css` does NOT appear in Network tab
   - Console: zero 404 errors

2. Hard-refresh `http://localhost:8080/join.html`
   - Visual appearance must be identical to before
   - Network tab: `src/shared/styles/styles.css` and `src/shared/styles/join-styles.css` loaded, status 200
   - Console: zero 404 errors

3. Open `http://localhost:8080/index.html`
   - Confirm it loads and looks identical (should be completely unaffected)

---

## 7. Recommended Next Step

**Batch C: Migrate shared JSX script tags to `src/shared/`.**

This switches `<script src="...">` tags in `ecos.html` and `join.html` to load:
- `icons.jsx` from `src/shared/icons/icons.jsx`
- `atoms.jsx` from `src/shared/components/atoms.jsx`
- `tweaks-panel.jsx` from `src/shared/components/tweaks-panel.jsx`

Each script tag update must be done carefully — the load order is critical (see `docs/DEPENDENCY_MAP.md`). One tag at a time, or all three together if the order is preserved.

After Batch C, a cleanup step should remove or archive root copies of the migrated files so the duplicate trap is eliminated.

Requires explicit approval before starting.
