# DATA_LAYER_MIGRATION_PLAN

Date: 2026-07-05

---

## 1. Purpose

`data.js` is the last major shared root runtime dependency. It is also the most complex to migrate because it is loaded by all three HTML entry points, each with different cache-buster versions. This document describes why the migration requires special care and proposes a phased strategy that minimizes risk.

Do not move `data.js` until this plan has been reviewed and each phase approved individually.

---

## 2. Current State

`data.js` assigns all project data to the `window` object via:

```js
Object.assign(window, { SECTORS, STAGES, READINESS, COMPANIES, PEOPLE, CONNECTIONS, SECTOR_DIST, FUNNEL, ACTIVITY });
```

It is loaded as a plain `<script>` tag (not `type="text/babel"`) in all three HTML entry points:

| HTML file | Exact script tag |
|---|---|
| `ecos.html` | `<script src="data.js?v=3"></script>` |
| `join.html` | `<script src="data.js"></script>` |
| `index.html` | `<script src="data.js?v=4"></script>` |

The `?v=3` and `?v=4` cache-buster params are different across files and must be handled carefully.

All dashboard views, the join wizard, and the public landing page read from `window.*` globals populated by `data.js`. If `data.js` fails to load for any reason, the entire app goes blank or throws errors.

---

## 3. Why data.js Is Riskier Than JSX Moves

| Risk factor | JSX files | data.js |
|---|---|---|
| Number of HTML files referencing it | 1 (`ecos.html` for dashboard JSX) | 3 (`ecos.html`, `join.html`, `index.html`) |
| Loaded before | Other JSX | Everything — it's always first |
| Effect of 404 | Single view fails | Entire app fails silently |
| Cache-buster complexity | None | Different `?v=` params per file |
| `index.html` dependency | No | Yes — loads at line 450 mid-document |
| Fallback behavior | None (Babel skips file) | None (all globals undefined) |

In addition:
- `index.html` is a vanilla JS file that reads `window.COMPANIES`, `window.SECTOR_DIST`, etc. directly — it does not use React and has no error boundaries.
- `join.html` reads `window.SECTORS` and `window.STAGES` before the wizard renders.
- `ecos.html` reads nearly every global.

---

## 4. Recommended Migration Strategy

### Phase A — Copy only (no HTML changes)
Copy `data.js` to `src/data/data.js` without changing any HTML references. Verify the copy is byte-identical. This is a safe, zero-risk step.

**Stop condition:** any diff between source and copy.

### Phase B — Migrate ecos.html
Update `ecos.html` script tag from `data.js?v=3` to `src/data/data.js?v=3`.
Test dashboard thoroughly. Root `data.js` still exists as rollback.

**Manual tests:** dashboard renders, all views open, all `window.*` globals load, Companies / Ramon.Space / Capabilities / Map / Matches / Onboarding all work.

**Stop condition:** any 404, any undefined global, any blank view.

### Phase C — Migrate join.html
Update `join.html` script tag from `data.js` to `src/data/data.js`.
Test onboarding wizard. Root `data.js` still exists as rollback.

**Manual tests:** wizard renders, icons render, all steps work.

### Phase D — Migrate index.html
Update `index.html` script tag (line 450) from `data.js?v=4` to `src/data/data.js?v=4`.
Test public landing page thoroughly.

**Manual tests:** landing page renders, company directory loads, all dynamic paths resolve, `logos/` images display.

**Note:** `index.html` is a large self-contained vanilla JS file. Careful with this one.

### Phase E — Delete root data.js
Only after Phases B, C, and D are all confirmed working. Delete root `data.js`.

**Stop condition:** any open question about whether a reference still points to root.

### Phase F — Introduce data access layer (future)
Refactor `src/data/data.js` into separate entity files:
- `src/data/companies.js`
- `src/data/people.js`
- `src/data/connections.js`
etc.

This is a product-layer refactor, not a structural one. Requires approval.

### Phase G — Migrate to Supabase (future)
Replace static `data.js` globals with Supabase queries. This is a major architectural shift requiring auth, API keys, backend setup, and significant JSX changes. Do not start until the product is further defined.

---

## 5. Required Tests For Each Phase

After every phase involving a script path change, run:

- [ ] `ecos.html` — dashboard renders, sidebar, icons
- [ ] Companies view → Ramon.Space profile → Tech, Match, Connections tabs
- [ ] Onboarding Readiness step renders chips (`window.READINESS`)
- [ ] Map view opens
- [ ] Matches view opens
- [ ] `join.html` — wizard renders, icons render, steps work
- [ ] `index.html` — landing page renders, company directory shows, logos display
- [ ] DevTools → Network: `data.js` (or `src/data/data.js`) loads with status 200
- [ ] Console: zero 404 errors
- [ ] Console: zero `window.*` undefined errors

---

## 6. Rollback Strategy

At any phase, if something breaks:

1. If root `data.js` still exists: revert the changed script tag in the affected HTML file back to `data.js` (or `data.js?v=3` / `data.js?v=4`).
2. If root `data.js` was already deleted (Phase E only): restore from git history:
   ```
   git checkout HEAD~1 -- data.js
   ```
   Then revert all three script tags.

Because the copy-first strategy keeps root `data.js` in place through Phases A–D, rollback is always a simple href revert with no data loss.

---

## 7. Future Data Architecture

**Short term (Phase F):** `src/data/data.js` as the single source of truth — still globals-based but organized under `src/`.

**Medium term:** Split into entity repositories under `src/data/repositories/`:
- `src/data/repositories/companies.js`
- `src/data/repositories/people.js`
- `src/data/repositories/connections.js`

**Long term:** Supabase / PostgreSQL backend. The Excel/JSON data becomes seed/import data, not the live source of truth. Each entity repository gets replaced with an async query. Authentication added. Admin interface for data management.

The current `window.*` globals approach is a prototype pattern that should not survive the MVP-to-production transition.

---

## 8. Recommendation

**The next safe coding batch is Phase A: copy-only.**

```bash
cp data.js src/data/data.js
diff data.js src/data/data.js  # verify identical
```

No HTML changes. No runtime impact. Zero risk. Establishes `src/data/` as the landing zone before any HTML is touched.

Phase B (`ecos.html` update) should be a separate batch with its own manual test checkpoint before moving to Phase C.

Do not combine Phase A and Phase B in the same commit. The copy-only step should be committed independently so it is independently reversible.
