# BATCH_G_SELF_REVIEW

Date: 2026-07-05

---

## 1. Scope Check

This batch removed 9 old root dashboard duplicate files (migrated in Batches E and F) and updated docs.

- 9 root files deleted
- 1 existing doc updated: `docs/REFACTOR_LOG.md`
- 1 new doc created: `docs/BATCH_G_SELF_REVIEW.md` (this file)

No file contents changed. No `src/` files touched. No active root runtime files modified or deleted.

---

## 2. Pre-Deletion Audit

### Search Method
```
grep -rn "app\.jsx|shell\.jsx|view-dashboard|view-companies|view-capabilities|view-map|view-matches|view-misc|view-onboard" \
  ecos.html join.html index.html data.js join-app.jsx

grep -rn "..." src/ --include="*.jsx" --include="*.js" --include="*.html"
```

### Result

| File searched | Match found | Path in match | Safe? |
|---|---|---|---|
| `ecos.html` | `shell.jsx` | `src/app/shell.jsx` | ✓ src path |
| `ecos.html` | `view-dashboard.jsx` | `src/modules/dashboard/view-dashboard.jsx` | ✓ src path |
| `ecos.html` | `view-capabilities.jsx` | `src/modules/capabilities/view-capabilities.jsx` | ✓ src path |
| `ecos.html` | `view-companies.jsx` | `src/modules/organizations/view-companies.jsx` | ✓ src path |
| `ecos.html` | `view-map.jsx` | `src/modules/map/view-map.jsx` | ✓ src path |
| `ecos.html` | `view-matches.jsx` | `src/modules/matches/view-matches.jsx` | ✓ src path |
| `ecos.html` | `view-onboard.jsx` | `src/modules/onboarding/view-onboard.jsx` | ✓ src path |
| `ecos.html` | `view-misc.jsx` | `src/modules/misc/view-misc.jsx` | ✓ src path |
| `ecos.html` | `app.jsx` | `src/app/app.jsx` | ✓ src path |
| `join.html` | `join-app.jsx` | `join-app.jsx` | ✓ different file — not deleted |
| `index.html`, `data.js`, `join-app.jsx`, `src/` | — | No matches | ✓ Clean |

No bare root references to the 9 deleted files were found. Deletion confirmed safe.

---

## 3. Deleted Files

| Deleted root file | Active src replacement |
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

---

## 4. Active Replacement Files

| File | Exists? |
|---|---|
| `src/app/app.jsx` | ✓ |
| `src/app/shell.jsx` | ✓ |
| `src/modules/dashboard/view-dashboard.jsx` | ✓ |
| `src/modules/organizations/view-companies.jsx` | ✓ |
| `src/modules/capabilities/view-capabilities.jsx` | ✓ |
| `src/modules/map/view-map.jsx` | ✓ |
| `src/modules/matches/view-matches.jsx` | ✓ |
| `src/modules/misc/view-misc.jsx` | ✓ |
| `src/modules/onboarding/view-onboard.jsx` | ✓ |

---

## 5. Active Root Runtime Files Preserved

| File | Status |
|---|---|
| `data.js` | ✓ Still exists — active runtime |
| `join-app.jsx` | ✓ Still exists — active runtime for join.html |
| `ecos.html` | ✓ Still exists — entry point |
| `index.html` | ✓ Still exists — entry point |
| `join.html` | ✓ Still exists — entry point |

---

## 6. Runtime Safety Check

| Check | Result |
|---|---|
| `ecos.html` points to `src/app/` and `src/modules/` | Yes (since Batch F) |
| `join.html` changed | No |
| `index.html` changed | No |
| Any `src/` JSX contents changed | No |
| `data.js` changed | No |
| CSS files changed | No |
| `package.json` changed | No |

---

## 7. Risks

| Risk | Assessment |
|---|---|
| **Overlooked hardcoded reference** | Audit searched `ecos.html`, `join.html`, `index.html`, `data.js`, `join-app.jsx`, and all of `src/`. No bare root references found. Risk is low. |
| **Cached ecos.html in browser** | If a browser has cached an older version of `ecos.html` that still points to root files, it will 404 on those root references now that the files are deleted. `Cmd+Shift+R` hard-refresh clears this. |
| **Deployment cache** | Same as above — a stale cached `ecos.html` pointing to root paths will fail. Ensure cache-busting on deployment. |
| **Docs mention old root locations historically** | `REFACTOR_LOG.md` and earlier self-reviews mention the original root locations as historical context. This is intentional and correct — those references are not runtime. |
| **Git history** | All deleted files remain fully recoverable via `git checkout HEAD~1 -- <file>` — no history is lost. |

---

## 8. Manual Tests Required

1. Hard-refresh `http://localhost:8080/ecos.html` (`Cmd+Shift+R`)
   - Dashboard renders correctly
   - Sidebar renders (tests `src/app/shell.jsx`)
   - Icons render (tests `src/shared/icons/icons.jsx`)
   - Companies view opens → Ramon.Space profile → Tech, Match, Connections tabs work
   - Capabilities view opens
   - Map view opens
   - Matches view opens
   - Onboarding Readiness step renders chips
   - DevTools → Network: zero 404 errors for any resource
   - Console: zero `window.*` undefined errors

2. Open `http://localhost:8080/join.html`
   - Wizard opens correctly — `join-app.jsx` still loads from root (correct, not migrated)
   - Icons render (tests `src/shared/icons/icons.jsx`)
   - Console: zero 404 errors

3. Open `http://localhost:8080/index.html`
   - Loads and looks identical (unaffected throughout)

---

## 9. Recommended Next Step

**All runtime files are now loaded from `src/`.** The root directory only retains:
- Active entry points: `ecos.html`, `join.html`, `index.html`
- Active data: `data.js`
- Active onboarding component: `join-app.jsx`
- Non-runtime assets: `logos/`, `spec.html`, `attachments.zip`, `ecos-qr.png`
- Config: `package.json`, `scripts/`

**Possible next steps (all require explicit approval):**
1. **Migrate `join-app.jsx`** — copy to `src/modules/onboarding/join-app.jsx`, update `join.html` script tag, delete root copy
2. **Migrate `data.js`** — copy to `src/data/data.js`, update all three HTML files, delete root copy (most complex — 3 HTML files reference it, with different `?v=` cache-bust params)
3. **Move `logos/` to `assets/`** — safe, but requires updating hardcoded paths in `index.html`
4. **Stop here** — the project now has a clean, organized `src/` structure; further migration is optional

The safest stopping point is here, after confirming Batch G works in the browser.
