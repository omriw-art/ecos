# PROJECT_MAP

---

## 1. Project Summary

**ecos** is a prototype for an Israeli space-sector ecosystem platform, operated under the Israel Space Authority (מנהלת החלל). It maps Israeli defense, aerospace, and space companies, allows new companies to self-register, and provides an internal dashboard for intelligence, matching, and analysis.

The project is structured as **two separate web applications** sharing a single data file (`data.js`), running in a flat root directory with no build system. All JSX is transpiled at runtime by Babel via CDN script tags.

- **Public-facing app** (`index.html`): Landing page, company directory, registration form, growth tools. Pure HTML + inline JS, no framework.
- **Internal dashboard** (`ecos.html`): Full React SPA — Mission Control, Companies, Capabilities, Map, Matches, AI Copilot, Onboarding, Settings.
- **Friendly join flow** (`join.html` + `join-app.jsx`): A separate React app with a simple mobile-friendly onboarding wizard for new companies.

---

## 2. Current File Structure

```
/ (root)
├── index.html          ← Public landing page (main entry for external users)
├── ecos.html           ← Internal dashboard SPA (main entry for internal users)
├── join.html           ← Friendly company onboarding entry
├── spec.html           ← Static spec/demo page
│
├── app.jsx             ← Root component of the dashboard app
├── shell.jsx           ← Sidebar + Topbar + global search
├── atoms.jsx           ← Shared UI atoms (ScoreRing, CoLogo, Donut, Toast, etc.)
├── icons.jsx           ← Icon library (Lucide-style SVG icon wrappers)
├── tweaks-panel.jsx    ← Floating design-tweaks panel (typography, density, palette)
├── data.js             ← Shared data seed (COMPANIES, SECTORS, PEOPLE, etc.)
│
├── view-dashboard.jsx  ← Dashboard / Mission Control view
├── view-companies.jsx  ← Companies list + company profile view
├── view-capabilities.jsx ← Capability map view
├── view-map.jsx        ← Ecosystem network graph (SVG)
├── view-matches.jsx    ← Employee × company matching engine
├── view-misc.jsx       ← AI Copilot drawer + PeopleView + SettingsView
├── view-onboard.jsx    ← Admin-side company onboarding wizard (6 steps)
│
├── join-app.jsx        ← Public-facing company onboarding wizard (React, 7 steps)
├── join-styles.css     ← Styles for join.html only
├── styles.css          ← Shared design-system styles for ecos.html + join.html
│
├── logos/              ← Partner and org logos (PNG, SVG, WebP)
│   ├── rakia.png, rakia_dark.png, rakia_card.png
│   ├── iia.png, iia_color.png
│   ├── iei.png, iei.svg, iei_try.png
│   ├── isa.png, mafat.svg, mafat-logo-full.svg
│   ├── most.png, npeg.png, p_snc.png, ht.png
│   ├── growth.png, growth.webp, invest.png
│   └── manhelet-halal.png
│
├── ecos-qr.png         ← QR code for the ecos app
├── attachments.zip     ← Unknown archive (likely legacy demo material)
├── fetch_logos.py      ← Script to fetch company logos (unused in runtime)
└── fetch_site_logos.py ← Script to fetch site logos (unused in runtime)
```

---

## 3. Main Entry Points

| File | Audience | Tech | Role |
|---|---|---|---|
| `index.html` | Public / companies | Vanilla HTML+JS | Landing, registration, directory, growth tools |
| `ecos.html` | Internal team | React 18 + Babel (CDN) | Full internal dashboard SPA |
| `join.html` | Companies joining | React 18 + Babel (CDN) | Friendly company wizard |
| `spec.html` | Demo | Static HTML | Spec or demo page (not inspected) |

**`index.html`** is the primary public-facing entry. It renders 3 views: `view-home` (landing + directory), `view-register` (72-field form), and `view-growth` (growth tools). View switching is manual DOM show/hide (no router).

**`ecos.html`** loads scripts in order: `data.js → icons.jsx → tweaks-panel.jsx → atoms.jsx → shell.jsx → view-*.jsx → app.jsx`. Everything is attached to `window` — no ES modules.

**`join.html`** loads: `data.js → icons.jsx → join-app.jsx`. It uses `styles.css` + `join-styles.css`.

---

## 4. Current Views

### `view-dashboard.jsx` — Mission Control
- **Represents**: Top-level KPI overview and analytics hub.
- **Data used**: `COMPANIES`, `SECTOR_DIST`, `CONNECTIONS`, `PEOPLE`, `FUNNEL`, `ACTIVITY` from `window`.
- **Components**: `Kpi`, `Donut`, `Funnel`, `StageDist`, `CityDist`, `ActivityRow`, `AiInsight`, `ScoreRing`, `CoLogo`, `SectorPill`.
- **Preserve**: Yes — central demo screen. Fully functional with real computed stats.

### `view-companies.jsx` — Companies List + Profile
- **Represents**: Filterable company directory (grid/table toggle) and deep company profile with tabs.
- **Data used**: `COMPANIES`, `SECTORS`, `PEOPLE`, `CONNECTIONS`.
- **Components**: `CompaniesView`, `CoCard`, `CompanyProfile` + 5 tab components (Overview, Tech, Match, Connections, Contacts), `ScoreRing`, `FitBar`, `SectorPill`, `CoLogo`.
- **Preserve**: Yes — core feature. Most company profile fields (`offers`, `needs`, `tech`, `overlap`) are empty arrays in current data.

### `view-capabilities.jsx` — Capability Map
- **Represents**: Space building-block coverage map with gap analysis.
- **Data used**: `COMPANIES`, `SECTORS`. Local `CAPABILITY_DEFS` (12 capability definitions, 3 marked as `virtual` gaps).
- **Components**: `CapabilitiesView`, `CapBlock`, `CapDetail`, `CapKpi`, `GapRow`.
- **Preserve**: Yes — distinctive analytical view. Gap detection logic is real.

### `view-map.jsx` — Ecosystem Graph
- **Represents**: SVG network graph of companies clustered by sector, with connection edges.
- **Data used**: `COMPANIES`, `SECTORS`, `CONNECTIONS`.
- **Components**: `MapView` (self-contained SVG renderer with force-directed layout and 60-iteration relaxation).
- **Preserve**: Yes — visually distinctive. The layout algorithm is custom and fragile.

### `view-matches.jsx` — Matching Engine
- **Represents**: Employee × company relevance matching with explainable scoring.
- **Data used**: `PEOPLE`, `COMPANIES`, `SECTORS`.
- **Components**: `MatchesView`, `MatchRow`.
- **Preserve**: Yes — the ME-Score algorithm (`sectorOverlap * 14 + focusBoost * 4 + base * 0.35`) is live logic.

### `view-misc.jsx` — Copilot + People + Settings
- **Represents**: Three views in one file.
  - `Copilot`: Slide-in AI chat drawer with stubbed responses (canned reply map, 900ms delay).
  - `PeopleView`: Employee org view listing PEOPLE with matched companies.
  - `SettingsView`: Integrations list + scoring weights (all hardcoded, non-functional).
- **Data used**: `PEOPLE`, `COMPANIES`.
- **Preserve**: Yes (Copilot + People). SettingsView is stub only.

### `view-onboard.jsx` — Admin Onboarding Wizard
- **Represents**: 6-step wizard for adding a company to the ecosystem from the internal dashboard.
- **Data used**: `SECTORS`, `STAGES`. Local `READINESS` constant (referenced but defined elsewhere — `window.READINESS`).
- **Components**: `OnboardView`, 6 step components, `PreviewCard`.
- **Note**: `window.READINESS` is referenced but not defined in any inspected file — potential runtime bug.
- **Preserve**: Yes — demo flow with LinkedIn mock-import animation.

---

## 5. Shared Components

### `shell.jsx`
Exports `Sidebar`, `Topbar`, `NAV` (navigation config array) to `window`.
- `Sidebar`: RTL sidebar with sections (מבט-על, Intelligence, פעולות), live company count badge, user avatar footer ("RA / Ron Avni").
- `Topbar`: Header with `SearchBox` (global company search, DOM portal dropdown), notification bell, copilot button.
- `SearchBox`: Custom vanilla DOM portal (not React portal) — creates a `<div id="global-search-drop">` appended to `document.body` at mount, updated via `innerHTML`.

### `atoms.jsx`
Exports to `window`: `ScoreRing`, `Sparkline`, `CoLogo`, `SectorPill`, `Donut`, `MiniBar`, `Funnel`, `FitBar`.
Also injects the global `window.toast()` system (fixed-position toast container appended to body at script load time).

### `icons.jsx`
Exports `window.I` — an object mapping icon names to SVG React components (Lucide-style). Used everywhere as `<window.I.Search size={14} />`.

### `tweaks-panel.jsx`
Exports: `useTweaks`, `TweaksPanel`, `TweakSection`, `TweakRow`, `TweakSlider`, `TweakToggle`, `TweakRadio`, `TweakSelect`, `TweakText`, `TweakNumber`, `TweakColor`, `TweakButton`.
- Floating design panel (bottom-right, draggable) triggered by a host `__activate_edit_mode` postMessage.
- `useTweaks()` persists values via `window.parent.postMessage({ type: '__edit_mode_set_keys' })` — designed for an embedding host (deck-stage / Omelette).
- In standalone mode the panel is only visible if the host sends the activate message. In the app, it's rendered in `App` and controlled via the same protocol.

### `styles.css`
Design system for the React apps (`ecos.html`, `join.html`). Defines: CSS custom properties (--blue, --violet, --green, --amber, etc.), dark theme layout tokens, typography classes (`typo-sans/serif/mono`, `density-compact/regular/spacious`), and all shared component classes (`.card`, `.btn`, `.pill`, `.chip`, `.nav-item`, `.co-card`, `.drawer`, etc.).

---

## 6. Current Data Layer

**`data.js`** — loaded as a plain `<script>` tag, assigns globals via `Object.assign(window, ...)`.

### Entities

| Entity | Count | Key Fields |
|---|---|---|
| `SECTORS` | 9 | id, label, color (oklch) |
| `STAGES` | 6 | string array |
| `COMPANIES` | ~90 | id, name, country, hq, stage, size, founded, fundingM, score (int), strategic (bool), readiness (string), sectors[], tech[], offers[], needs[], customers[], partners[], overlap[], blurb |
| `PEOPLE` | 5 | id, name, role, dept, avatar, color, interests[], focus[], matches[] |
| `CONNECTIONS` | 14 | from (company id), to (company id), type (string) |

### Derived

| Variable | Source |
|---|---|
| `SECTOR_DIST` | Computed from COMPANIES × SECTORS, sorted by count |
| `FUNNEL` | Hardcoded funnel stages with counts |
| `ACTIVITY` | Hardcoded recent activity feed (6 items) |

### Data quality issues
- `fundingM` is `0` for all companies — no real funding data.
- `tech`, `offers`, `needs`, `customers`, `partners`, `overlap` are **empty arrays** for all companies — profile tabs (Tech, Connections) render empty states.
- `readiness` is `""` (empty string) for all companies — readiness pills display blank.
- `strategic` is `false` for all — no starred companies.
- `score` is the only populated per-company metric.
- `FUNNEL` and `ACTIVITY` are fully hardcoded demo values.

### What should later move
- `COMPANIES`, `PEOPLE`, `CONNECTIONS` → Supabase tables.
- `SECTORS`, `STAGES`, `CAPABILITY_DEFS` → reference tables or config.
- `FUNNEL`, `ACTIVITY` → computed/real-time queries.
- `SECTOR_DIST` → derived view or materialized query.

---

## 7. Join / Onboarding Flow

There are **three** distinct onboarding flows, not one:

### Flow 1 — `index.html` inline form (72 fields, 7 steps)
- Vanilla JS multi-step form with `SCHEMA` array defining all fields.
- Steps: פרטי חברה → סיווג → מוצר → עסקי → צורך/הצעה → אנשי קשר → רגולציה.
- Has LinkedIn mock-fill (`linkedInFill()`) that auto-populates with Ramon.Space data.
- Has chip-input, file upload, checkbox-grid, and collapsible "internal" section.
- Submits locally (no backend). Shows `#view-success` on completion.
- **Purpose**: Public company registration (72 detailed fields for thorough mapping).

### Flow 2 — `join.html` + `join-app.jsx` (7 friendly steps, React)
- React SPA with minimal, mobile-friendly UX. One question per screen.
- Steps: Welcome → LinkedIn Import OR manual → who → what → describe → offer → want → stage → contact → review → done.
- Collects: name, sectors, blurb, offers[], needs[], stage, country, hq, contactName, contactRole, email.
- LinkedIn import is mocked (populates "Skylight Dynamics" demo data).
- Done screen shows fake "next steps" (AI review, team approval, first matches).
- **Purpose**: Friendlier public registration with less friction.

### Flow 3 — `view-onboard.jsx` inside `ecos.html` (6 steps, admin-facing)
- Internal dashboard onboarding wizard: Import → Basics → Tech → Offer → Readiness → Review.
- LinkedIn import mocks "Skylight Dynamics" with SAR/AI sectors.
- Has live preview card (`PreviewCard`) updating as user types.
- References `window.READINESS` which is not defined anywhere — **runtime bug**.
- **Purpose**: Allows internal staff to manually add a company to the ecosystem.

**Summary**: Flows 1 and 2 are external-facing (different UX philosophies for the same goal). Flow 3 is internal. There is no backend connection across any of them.

---

## 8. Static / Demo Pages

### `ecos.html`
The internal dashboard SPA. Should be preserved and is the primary deliverable.

### `index.html`
The public landing page. 947 lines, entirely self-contained (CSS inline, JS inline, no external deps except Google Fonts). Should be preserved.

### `spec.html`
Not fully inspected. Likely a static spec or design reference page. Probably legacy/demo material — verify before keeping.

### `ecos-qr.png`
QR code pointing to the ecos app. Modified locally but not pushed. Preserve as-is (used in demos/presentations).

### `attachments.zip`
Unknown archive in root. Likely legacy demo material or original briefing documents. Safe to ignore, not referenced by any code.

### `logos/`
Partner and organization logos used in `index.html` (growth tools cards, partner strip, footer) and `ecos.html` (sidebar brand). Contains duplicate variants (e.g., `rakia.png`, `rakia_dark.png`, `rakia_card.png`; `iei.png`, `iei.svg`, `iei_try.png`; `iia.png`, `iia_color.png`).

**Preserve all logos** — referenced by exact filename in JS and HTML. Renaming without updating references will break images.

### `fetch_logos.py`, `fetch_site_logos.py`
Python scripts for fetching logos programmatically. Not referenced by any HTML/JSX. Legacy tooling — safe to gitignore or move to a `scripts/` folder.

---

## 9. Current Product Features

| Feature | File(s) | Status |
|---|---|---|
| Mission Control dashboard | `view-dashboard.jsx` | Fully functional with real computed data |
| Company directory (grid + table) | `view-companies.jsx` | Functional; filter by sector/stage/text |
| Company profile (5-tab deep dive) | `view-companies.jsx` | Functional; most sub-fields empty in data |
| Capability map with gap analysis | `view-capabilities.jsx` | Fully functional |
| Ecosystem network graph | `view-map.jsx` | Functional SVG; no pan/zoom |
| Employee × company matching | `view-matches.jsx` | Live scoring algorithm; 5 people, ~90 companies |
| AI Copilot chat drawer | `view-misc.jsx` | Stubbed — canned replies only, no real AI |
| People / org view | `view-misc.jsx` | Functional display; no edit |
| Settings (integrations + weights) | `view-misc.jsx` | Stub only |
| Admin onboarding wizard (6 steps) | `view-onboard.jsx` | Functional UI; no backend |
| Public landing + company directory | `index.html` | Functional; reads from `data.js` |
| Public registration form (72 fields) | `index.html` | Functional UI; no backend |
| Growth tools directory | `index.html` | Real URLs to IIA, Growth Authority, Rakia, MAFAT |
| Friendly join wizard (React) | `join.html` + `join-app.jsx` | Functional UI; no backend |
| Global search (all views) | `shell.jsx` | Functional; searches name/country/hq/blurb/sectors |
| Tweaks panel (typography/density/accent) | `tweaks-panel.jsx` + `app.jsx` | Functional; host-protocol dependent |
| Toast notifications | `atoms.jsx` | Global `window.toast()` — works everywhere |

---

## 10. Technical Debt

| Issue | Location | Severity |
|---|---|---|
| **Flat root structure** — all files in `/` with no module organization | All files | High |
| **No build system** — Babel runtime + CDN React, no bundler | `index.html`, `ecos.html`, `join.html` | High |
| **Global namespace** — all components attached to `window`, no encapsulation | All `.jsx` files | High |
| **`data.js` as only truth** — `window.COMPANIES` is read by 6+ files directly | `data.js` | High |
| **`window.READINESS` undefined** — referenced in `view-onboard.jsx` StepReadiness, not defined anywhere | `view-onboard.jsx:341` | High (runtime bug) |
| **Three separate onboarding flows** — `index.html` form, `join-app.jsx`, `view-onboard.jsx` — divergent and unmaintained | All three | Medium |
| **`index.html` is 947 lines** — CSS + JS all inline, unreviewable as-is | `index.html` | Medium |
| **Empty data arrays** — `tech`, `offers`, `needs`, `customers`, `partners`, `overlap` empty for all companies | `data.js` | Medium |
| **Missing data** — `readiness` and `strategic` fields all empty/false | `data.js` | Medium |
| **Hardcoded `fundingM: 0`** for all companies | `data.js` | Medium |
| **Duplicate CSS** — `styles.css` shared between ecos + join, `index.html` has its own separate inline CSS (~280 lines), `tweaks-panel.jsx` injects its own `<style>` | Multiple | Medium |
| **No routing** — `app.jsx` uses `React.useState("dashboard")` as router; `index.html` uses DOM show/hide | `app.jsx`, `index.html` | Medium |
| **Random in render** — `Math.random()` in `MatchPersonRow` and `ConnectionsTab` causes re-render inconsistency | `view-companies.jsx:407, 465` | Low |
| **No error boundaries** — any component crash brings down the whole app | All | Low |
| **Search dropdown via `innerHTML`** — XSS-safe only because data is internal | `shell.jsx:91-98` | Low |
| **`ecos.html` not inspected yet** — likely loads scripts in a specific order that is fragile | `ecos.html` | Low |

---

## 11. Preservation Rules

These files/features must not be changed in the first refactor:

| What | Why |
|---|---|
| `data.js` variable names (`COMPANIES`, `SECTORS`, etc.) | Referenced as `window.X` in 8+ files; rename breaks everything |
| `logos/` filenames | Hardcoded in `index.html` JS and `view-*.jsx`; renaming requires updating multiple references |
| `ecos-qr.png` | Used in demos/presentations |
| `index.html` public-facing UX | External companies use this; breaking it is user-visible |
| `ecos.html` script load order | Scripts depend on each other via `window.*`; reordering = undefined reference crashes |
| `window.I.*` icon API | Used in every view file as `<window.I.Search />` |
| `window.toast()` | Called in nearly every view for user feedback |
| The `view-map.jsx` SVG layout algorithm | Force-directed layout with 60 relaxation iterations — subtle and hard to replicate |
| `tweaks-panel.jsx` host protocol | `useTweaks`, `TweaksPanel` etc. are tested and working; the postMessage protocol is fragile |

---

## 12. Safe Refactor Strategy

### Phase 1 — Documentation and mapping (current)
- Create `docs/PROJECT_MAP.md` ✓
- Identify all inter-file dependencies
- Define folder target structure

### Phase 2 — Create folder structure (no file moves yet)
- Create empty folders: `src/views/`, `src/components/`, `src/data/`, `src/utils/`
- Create a `CLAUDE.md` at root documenting the `window.*` global dependency graph

### Phase 3 — Move shared UI carefully
- Copy (not move) `atoms.jsx` → `src/components/atoms.jsx`; test both work
- Copy `icons.jsx` → `src/components/icons.jsx`
- Copy `tweaks-panel.jsx` → `src/components/tweaks-panel.jsx`
- Only delete originals after verifying no references break

### Phase 4 — Move views into modules
- Move view files to `src/views/view-*.jsx` one at a time
- Update `ecos.html` script tags
- Move `shell.jsx`, `app.jsx` to `src/`

### Phase 5 — Introduce data layer
- Extract `data.js` into `src/data/seed.js`
- Replace `window.COMPANIES` globals with ES module imports
- Fix `window.READINESS` bug in `view-onboard.jsx`
- Fill in empty company fields for at least 5 demo companies

### Phase 6 — Add MVP features
- Add a real router (React Router or hash-based)
- Connect one real API endpoint (Supabase) for COMPANIES
- Replace `window.toast()` with a proper notification context
- Unify the three onboarding flows into one

---

## 13. Risks Before Refactor

| Risk | Details |
|---|---|
| **Script load order** | `ecos.html` loads scripts sequentially; if any file moves, the `<script src>` tag must be updated or the app crashes with "X is not defined" |
| **`window.READINESS` bug** | `view-onboard.jsx` references `window.READINESS` — undefined. Moving files won't fix this; it needs a patch first |
| **`join.html` uses `window.SECTORS`** | `join-app.jsx` reads `window.SECTORS` from `data.js`; `data.js` must remain loaded before `join-app.jsx` |
| **`index.html` uses `data.js` directly** | `index.html` calls `COMPANIES` (from `data.js`) for the directory. The `<script src="data.js?v=4">` cache-buster must be preserved |
| **CDN React version pinned** | React 18.3.1 and Babel 7.29.0 pinned with SRI hashes in `join.html`. Any version bump requires new hashes |
| **`tweaks-panel.jsx` postMessage protocol** | Requires a host that sends `__activate_edit_mode` — in standalone mode the panel is invisible. Don't remove it thinking it's unused |
| **Logos folder referenced by exact path** | `logos/rakia.png`, `logos/iia.png` etc. referenced in 3 separate files. Moving `logos/` breaks all logo rendering |
| **Empty data arrays** | Before filling `tech`, `offers`, `needs` for companies, test that the profile tabs don't crash with non-empty arrays (e.g., the "AI tags" generator in TechTab does string splitting that may have edge cases) |

---

## 14. Recommended Next Prompt

**Next prompt suggestion:**

> "Fix the `window.READINESS` bug in `view-onboard.jsx` (StepReadiness reads `window.READINESS` which is undefined — add it to `data.js` alongside STAGES), then enrich the data for 5 key companies (Ramon.Space, Elbit Systems, SpaceIL, D-Fend, Lulav Space) by filling their `tech`, `offers`, `needs`, `customers`, `partners` arrays with realistic content so the company profile tabs are no longer empty. Do not touch any other file."

This is safe (data-only change), immediately visible in the UI, and unblocks the demo quality of the company profile view.
