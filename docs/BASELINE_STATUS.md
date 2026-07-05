# BASELINE_STATUS

Last updated: 2026-07-05

---

## 1. Current Project State

`ecos` is a flat React/Babel prototype for the Israeli space-sector ecosystem. There is no build system. All source files live in the project root. Babel transpiles JSX at runtime via CDN script tags.

**Three separate entry points:**

| File | Type | Audience |
|---|---|---|
| `index.html` | Vanilla JS (no framework) | Public landing page — directory, register, growth tools |
| `ecos.html` | React SPA | Internal admin dashboard |
| `join.html` | React SPA | Public company onboarding wizard |

**Shared data source:** `data.js` — loaded as a plain `<script>` tag by all three entry points. Assigns all globals via `Object.assign(window, {...})`.

**Component model:** All JSX files (`app.jsx`, `shell.jsx`, `atoms.jsx`, `icons.jsx`, `view-*.jsx`, `join-app.jsx`) expose their exports as `window.*` globals. No module system, no bundler.

---

## 2. Stabilization Completed

### Step 1 — READINESS bug fix
- `const READINESS = ["Initial contact", "Mapped", "Verified", "Active", "Strategic", "Needs update"]` was added to `data.js` next to `STAGES`.
- `READINESS` was included in the `Object.assign(window, {...})` call at the bottom of `data.js`.
- This fixed a runtime crash in `view-onboard.jsx` StepReadiness (step 4 of the admin onboarding wizard) where `window.READINESS.map(...)` was called on an undefined value.

### Step 2 — Demo data enrichment
Five company records in `data.js` were enriched with `tech`, `offers`, `needs`, `customers`, `partners`, `overlap`, and `readiness` fields:

- **Ramon.Space** — `readiness: "Strategic"`, `strategic: true`
- **Elbit Systems** — `readiness: "Strategic"`, `strategic: true`
- **SpaceIL** — `readiness: "Active"`, `strategic: true`
- **D-Fend Solutions** — `readiness: "Verified"`
- **Lulav Space** — `readiness: "Active"`

All enrichment used demo-quality, public, non-sensitive, generic phrasing.

---

## 3. Current Working Features

| Feature | Entry point | Status |
|---|---|---|
| Mission Control dashboard (KPIs, donut, funnel, activity) | `ecos.html` | Working |
| Companies list (grid/table, filter) | `ecos.html` | Working |
| Company profile (5 tabs) | `ecos.html` | Working — tabs now populated for 5 key companies |
| Capabilities map | `ecos.html` | Working |
| Ecosystem graph (SVG force-layout) | `ecos.html` | Working |
| ME-Score matches | `ecos.html` | Working |
| Admin onboarding wizard (6 steps) | `ecos.html` | Working — step 4 crash fixed |
| AI Copilot drawer (stubbed) | `ecos.html` | Working (900ms stub responses) |
| Public landing page (directory, register, growth tools) | `index.html` | Working |
| Company join/onboarding wizard (7 steps) | `join.html` | Working |
| Design tweaks panel | `ecos.html` | Working (requires `__activate_edit_mode` postMessage) |
| Global search (⌘K) | `ecos.html` | Working |

---

## 4. Known Technical Debt

- **Flat root structure** — all source files are in the project root; no `src/`, no module boundaries
- **Runtime Babel via CDN** — JSX is transpiled in-browser; no build step, no tree-shaking, slow first load
- **`window.*` globals** — all components and data live on `window`; no isolation, no scoping
- **`data.js` as sole source of truth** — all three entry points share one hand-edited JS file; no database
- **Three separate onboarding flows** — admin wizard (`view-onboard.jsx`), public wizard (`join-app.jsx`), 72-field register form (`index.html`) — not unified
- **HTML script load order is fragile** — components must be declared in `<script>` tag order; mis-ordering causes silent failures
- **No backend** — no API, no persistence beyond `localStorage`
- **No real auth** — no login, no session management
- **No Supabase yet** — database integration is future-facing

---

## 5. Files That Must Be Preserved

The following files are load-bearing for the current demo. Do not delete, rename, or move them without a documented refactor plan:

```
data.js
app.jsx
shell.jsx
atoms.jsx
icons.jsx
tweaks-panel.jsx
styles.css
ecos.html
index.html
join.html
join-app.jsx
view-dashboard.jsx
view-companies.jsx
view-capabilities.jsx
view-map.jsx
view-matches.jsx
view-misc.jsx
view-onboard.jsx
logos/
ecos-qr.png
```

---

## 6. Current Safe Baseline

After the READINESS patch (Step 1), there are no known blocking runtime errors. All three entry points load and render without crashing. The admin onboarding wizard reaches step 4 without throwing. Company profile tabs for the 5 enriched companies display populated content.

This is the safe baseline from which any future refactor should start.

---

## 7. Next Recommended Step

**Safe Refactor Plan (planning only — not implementation):**

Before touching any file locations or script load order, produce a written plan that:
1. Lists every `<script src="...">` tag in `ecos.html`, `index.html`, and `join.html`
2. Maps every `window.*` dependency between files
3. Proposes a migration path (e.g., ES modules or a minimal bundler)
4. Identifies the highest-risk changes and sequencing
5. Gets explicit approval before any file is moved

Do not begin implementation until the plan is reviewed.
