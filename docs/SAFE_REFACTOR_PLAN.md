# SAFE_REFACTOR_PLAN

Last updated: 2026-07-05  
Status: Planning only. No implementation has started.

---

## 1. Refactor Objective

Evolve the existing flat prototype into a maintainable MVP while:
- preserving the current demo and visual direction completely
- keeping all three entry points (`ecos.html`, `index.html`, `join.html`) functional after every phase
- making each phase individually reversible
- never introducing a big-bang change that could break the demo

This is not a rewrite. It is a careful, incremental reorganization.

---

## 2. Non-Goals

The following are explicitly out of scope for this refactor plan:

- No full rewrite
- No visual redesign or layout changes
- No Supabase or database integration yet
- No replacement of the current `React.useState` view router
- No unification of the three onboarding flows (yet)
- No build system migration (Vite, webpack, etc.) yet
- No npm package changes yet
- No TypeScript migration yet
- No test framework introduction yet

---

## 3. Target Structure (future — do not create yet)

This is the proposed end-state structure. Do not create any of these folders until the relevant phase is approved.

```
/
├── src/
│   ├── app/
│   │   └── app.jsx               (root component, moved from root)
│   ├── shared/
│   │   ├── components/
│   │   │   ├── atoms.jsx
│   │   │   ├── shell.jsx
│   │   │   └── tweaks-panel.jsx
│   │   ├── icons/
│   │   │   └── icons.jsx
│   │   └── styles/
│   │       ├── styles.css
│   │       └── join-styles.css
│   ├── modules/
│   │   ├── organizations/
│   │   │   ├── view-companies.jsx
│   │   │   └── view-onboard.jsx
│   │   ├── opportunities/
│   │   │   ├── view-matches.jsx
│   │   │   └── view-capabilities.jsx
│   │   ├── governance/
│   │   │   └── view-misc.jsx     (settings, people)
│   │   ├── search/
│   │   │   └── (future search module)
│   │   ├── export/
│   │   │   └── (future export module)
│   │   └── onboarding/
│   │       └── join-app.jsx
│   ├── data/
│   │   └── data.js
│   ├── config/
│   │   └── (future env config)
│   └── utils/
│       └── (future utility functions)
├── docs/
│   ├── PROJECT_MAP.md
│   ├── BASELINE_STATUS.md
│   ├── CLAUDE_WORKING_RULES.md
│   ├── DEPENDENCY_MAP.md
│   └── SAFE_REFACTOR_PLAN.md
├── assets/
│   └── ecos-qr.png
├── scripts/
│   ├── fetch_logos.py
│   └── fetch_site_logos.py
├── logos/                        (stays at root — paths are in data.js)
├── ecos.html                     (stays at root)
├── index.html                    (stays at root)
└── join.html                     (stays at root)
```

**Note on HTML files:** `ecos.html`, `index.html`, and `join.html` stay at the project root. Moving them would break relative paths for `data.js`, `logos/`, and CSS files in ways that are hard to trace.

---

## 4. Refactor Phases

---

### Phase 0 — Baseline and Docs ✅ COMPLETED

**Goal:** Document the current state before touching anything.

**Completed:**
- `docs/PROJECT_MAP.md`
- `docs/BASELINE_STATUS.md`
- `docs/CLAUDE_WORKING_RULES.md`
- `docs/DEPENDENCY_MAP.md`
- `docs/SAFE_REFACTOR_PLAN.md`

**Test steps:** N/A (no runtime changes)  
**Rollback:** N/A

---

### Phase 1 — Data Stabilization ✅ COMPLETED

**Goal:** Fix runtime errors and enrich demo data.

**Completed:**
- Added `READINESS` constant to `data.js`
- Exported `READINESS` via `Object.assign(window, {...})`
- Enriched 5 company records with `tech`, `offers`, `needs`, `customers`, `partners`, `overlap`, `readiness`, `strategic`

**Test steps:** Open `ecos.html` → Onboarding → step 4 should render chips without crashing.  
**Rollback:** Revert the two `data.js` edits (remove `READINESS` declaration and remove from `Object.assign`).

---

### Phase 2 — Asset & Script Inventory (planning only)

**Goal:** Confirm which files in the root are safe to move without runtime impact.

**Allowed changes:** None — read-only audit.

**Questions to answer:**
- Is `spec.html` actively used?
- Is `attachments.zip` used anywhere?
- Is `ecos-qr.png` referenced in any runtime file?
- Are `fetch_logos.py` and `fetch_site_logos.py` called from any script or HTML?

**Forbidden changes:** None in this phase.

**Test steps:** N/A  
**Rollback:** N/A

---

### Phase 3 — Create Folders Only (no file moves)

**Goal:** Create the empty folder structure. Do not move any file.

**Allowed changes:**
- Create `scripts/` (empty)
- Create `assets/` (empty)
- Create `src/` (empty, with empty subdirectories)

**Forbidden changes:** Do not move any runtime file. Do not touch HTML files.

**Test steps:**  
After creating folders, verify that `ecos.html`, `index.html`, and `join.html` still load identically — folder creation alone should have zero impact.

**Rollback:** Delete the empty folders.

---

### Phase 4 — Move Non-Runtime Support Files

**Goal:** Move files that have no runtime dependency.

**Allowed changes (after Phase 2 confirms these are safe):**
- Move `fetch_logos.py` → `scripts/fetch_logos.py`
- Move `fetch_site_logos.py` → `scripts/fetch_site_logos.py`
- Move `attachments.zip` → `assets/attachments.zip` (if confirmed unused at runtime)
- Move `ecos-qr.png` → `assets/ecos-qr.png` (only if confirmed not referenced in any HTML or JSX)

**Forbidden changes:** Do not touch any `.jsx`, `.html`, `.css`, or `data.js`.

**Test steps:** Same as Phase 3 — open all three HTML files, confirm no change.  
**Rollback:** Move files back to root.

---

### Phase 5 — Move Shared CSS (high caution)

**Goal:** Move CSS files to `src/shared/styles/`.

**Prerequisite:** Update all `<link rel="stylesheet">` tags in `ecos.html` and `join.html` to point to the new paths.

**Allowed changes:**
- Move `styles.css` → `src/shared/styles/styles.css`
- Move `join-styles.css` → `src/shared/styles/join-styles.css`
- Update `<link>` tags in `ecos.html` and `join.html`

**Forbidden changes:** Do not change any CSS rules. Do not touch `index.html` (its CSS is inline).

**Test steps:**
- Open `ecos.html` — verify visual appearance is identical
- Open `join.html` — verify visual appearance is identical
- Check browser console for 404s

**Rollback:** Move CSS files back to root, revert `<link>` tags.

---

### Phase 6 — Move Shared JSX Files One by One

**Goal:** Move shared component files (`icons.jsx`, `atoms.jsx`, `tweaks-panel.jsx`) to `src/shared/`.

**Prerequisite for each file:**
1. Update the `<script src="...">` tag in every HTML file that loads it
2. Confirm load order is preserved
3. Test before moving the next file

**Recommended move order (lowest → highest risk):**
1. `tweaks-panel.jsx` → `src/shared/components/tweaks-panel.jsx`
2. `icons.jsx` → `src/shared/icons/icons.jsx`
3. `atoms.jsx` → `src/shared/components/atoms.jsx`

**Do NOT move `shell.jsx` in this phase** — it contains the `SearchBox` vanilla DOM portal which needs separate validation.

**Test steps after each individual move:**
- Open `ecos.html` — check all icons render
- Open `join.html` — check icons render
- Check browser console for undefined errors

**Rollback:** Move file back, revert `<script>` tag.

---

### Phase 7 — Move View Files One by One

**Goal:** Move `view-*.jsx` files to `src/modules/`.

**Prerequisite:** Phase 6 complete and validated.

**Recommended move order (lowest coupling → highest):**
1. `view-matches.jsx` → `src/modules/opportunities/view-matches.jsx`
2. `view-capabilities.jsx` → `src/modules/opportunities/view-capabilities.jsx`
3. `view-misc.jsx` → `src/modules/governance/view-misc.jsx`
4. `view-dashboard.jsx` → `src/modules/`
5. `view-onboard.jsx` → `src/modules/organizations/view-onboard.jsx`
6. `view-companies.jsx` → `src/modules/organizations/view-companies.jsx`
7. `view-map.jsx` → `src/modules/` ← move last; most fragile

**Do NOT move `join-app.jsx` in this phase** — it is a separate React root.

**Test steps after each individual move:**
- Open `ecos.html`
- Navigate to the view that was just moved
- Check for rendering errors and console errors

**Rollback:** Move file back, revert `<script>` tag in `ecos.html`.

---

### Phase 8 — Move Core Files (app.jsx, shell.jsx, data.js)

**Goal:** Move the highest-risk runtime files.

**Prerequisites:** All previous phases validated.

**Move order:**
1. `shell.jsx` → `src/shared/components/shell.jsx`
2. `app.jsx` → `src/app/app.jsx`
3. `data.js` → `src/data/data.js` ← **highest risk** — update all 3 HTML `<script>` tags and cache-bust query strings

**Test steps after each move:**
- All 3 HTML entry points must load without errors
- Full navigation through all views
- Full onboarding wizard step 1–6

**Rollback:** Move file back, revert `<script>` tag.

---

### Phase 9 — Introduce Data Access Layer

**Goal:** Wrap `data.js` globals in a typed access layer so future API/Supabase migration has a single seam to replace.

**Allowed changes:**
- Create `src/data/index.js` with getter functions wrapping `window.*`
- Gradually replace direct `window.COMPANIES` calls with the access layer

**This is the Supabase migration preparation step.**

**Forbidden changes:** Do not connect to Supabase yet. Do not change data shape.

---

### Phase 10 — Supabase Migration (future, not planned yet)

**Goal:** Replace `data.js` with real database calls through the access layer created in Phase 9.

**Status:** Out of scope for now. Requires Phase 9 complete.

---

## 5. First Real Refactor Recommendation

**The safest first implementation step is Phase 3: create empty folders only.**

Specifically:
1. Create `scripts/` (empty)
2. Create `assets/` (empty)

Do NOT create `src/` yet — it adds no value until files are ready to move.  
Do NOT move any runtime files in this step.  
This step has zero impact on app behavior and is fully reversible with `rmdir`.

After confirming Phase 2 (the asset/script audit), Phase 4 (move Python scripts and non-runtime assets) is the next lowest-risk implementation step.

---

## 6. Testing Checklist

Run after every phase that touches runtime files:

- [ ] Open `http://localhost:8080/ecos.html` — app loads without blank screen
- [ ] Click **חברות** — company list renders
- [ ] Open **Ramon.Space** profile — check Tech / Match / Connections tabs show data
- [ ] Click **Onboarding לחברה** → step through to step 4 — Readiness chips render
- [ ] Click **מפת אקוסיסטם** — graph renders without error
- [ ] Click **התאמות** — matches list renders
- [ ] Open `http://localhost:8080/join.html` — 7-step wizard loads
- [ ] Open `http://localhost:8080/index.html` — landing page loads, company directory shows entries
- [ ] Open browser console — zero red errors

---

## 7. Rollback Strategy

Before starting any phase that touches runtime files:

1. **Commit the current working state to git** — this is the rollback point
2. Make the change
3. Test (see checklist above)
4. If anything breaks: `git checkout -- <file>` to revert individual files, or `git reset --hard HEAD` to revert the entire working tree

**Never make two phases of changes in a single git commit.** Each phase should be its own commit so rollback is surgical.

If a broken state is discovered after a commit: `git revert <commit>` creates a clean undo without destroying history.

---

## 8. Claude Rules For Next Step

When implementing any phase of this plan:

1. **Make the smallest possible change** — one file moved, one `<script>` tag updated, nothing more
2. **Do not automatically continue** to the next phase after completing one
3. **Report all changed files** — list every file modified, with before/after if relevant
4. **Report test steps** — tell the user exactly what to open and what to look for
5. **Stop after completion** — wait for explicit confirmation before proceeding
6. **If anything is ambiguous** — ask before acting, not after
