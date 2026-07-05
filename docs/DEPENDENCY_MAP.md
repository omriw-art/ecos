# DEPENDENCY_MAP

Last updated: 2026-07-05  
Source: derived by reading all root-level source files.

---

## 1. HTML Entry Points

### `ecos.html` — Internal admin dashboard
- **Audience:** Internal / admin
- **CSS:** `styles.css`
- **CDN deps:** React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0
- **Global variables expected at startup:** none (data.js runs first and creates them all)
- **Script files loaded (in order):**
  1. `data.js?v=3`
  2. `tweaks-panel.jsx`
  3. `icons.jsx`
  4. `atoms.jsx`
  5. `shell.jsx`
  6. `view-dashboard.jsx`
  7. `view-capabilities.jsx`
  8. `view-companies.jsx`
  9. `view-map.jsx`
  10. `view-matches.jsx`
  11. `view-onboard.jsx`
  12. `view-misc.jsx`
  13. `app.jsx` ← mounts React app, must be last

### `join.html` — Public company onboarding wizard
- **Audience:** Public (companies registering)
- **CSS:** `styles.css`, `join-styles.css`
- **CDN deps:** React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0, Google Fonts
- **Script files loaded (in order):**
  1. `data.js`
  2. `icons.jsx`
  3. `join-app.jsx` ← mounts React app, must be last

### `index.html` — Public landing page
- **Audience:** Public
- **CSS:** Inline `<style>` block (self-contained, ~400 lines)
- **CDN deps:** None
- **Script files loaded (in order):**
  1. `data.js?v=4` (loaded at line 450, mid-document)
  2. Inline `<script>` block immediately after — reads `window.COMPANIES` and `window.SECTORS`
- **Note:** `index.html` is fully self-contained (inline CSS + JS). It does not load any JSX files. Its only external dependency is `data.js`.

### `spec.html` — Demo/spec page
- **Audience:** Internal / legacy
- **Status:** Present in root. Does not appear to be production-critical. Do not delete without confirming it is unused.

---

## 2. Script Load Order

### `ecos.html` — why order matters

```
data.js          → defines COMPANIES, SECTORS, STAGES, READINESS, PEOPLE, etc. on window
tweaks-panel.jsx → exports useTweaks, TweaksPanel, Tweak* controls → window.*
icons.jsx        → exports window.I (icon name → SVG component map)
atoms.jsx        → exports ScoreRing, Sparkline, CoLogo, SectorPill, Donut, MiniBar, Funnel, FitBar → window.*
                   also injects window.toast() at script load time
shell.jsx        → exports Sidebar, Topbar, NAV → window.*
                   Sidebar uses window.I (must load after icons.jsx)
                   Topbar uses window.I (must load after icons.jsx)
view-dashboard.jsx  → uses window.COMPANIES, window.SECTORS, window.ScoreRing, window.Donut, window.Funnel, window.MiniBar, window.I
view-capabilities.jsx → uses window.COMPANIES, window.SECTORS, window.I, window.SectorPill
view-companies.jsx  → uses window.COMPANIES, window.SECTORS, window.ScoreRing, window.CoLogo, window.SectorPill, window.I
view-map.jsx        → uses window.COMPANIES, window.CONNECTIONS, window.SECTORS, window.I
view-matches.jsx    → uses window.COMPANIES, window.SECTORS, window.ScoreRing, window.I
view-onboard.jsx    → uses window.READINESS, window.SECTORS, window.I
view-misc.jsx       → uses window.PEOPLE, window.I, window.ScoreRing, window.toast (exports Copilot, PeopleView, SettingsView)
app.jsx             → uses ALL of the above; mounts to #app; must be last
```

**Critical constraint:** If any script loads before its dependency, the app crashes silently or throws "X is not a function" / "Cannot read properties of undefined".

### `join.html` — why order matters

```
data.js      → defines window.SECTORS (used by join-app.jsx for sector picker)
icons.jsx    → defines window.I (used throughout join-app.jsx for icon components)
join-app.jsx → mounts to #app; uses window.SECTORS and window.I; must be last
```

### `index.html`

`data.js?v=4` is loaded at line 450, mid-document (not in `<head>`). The inline `<script>` block immediately after reads `window.COMPANIES` synchronously. This is safe only because the script tag is blocking and runs before the inline block. **Do not move `data.js` above or below this position without tracing the inline script.**

---

## 3. `window.*` Global APIs

| Global | Defined in | Used in | Risk if renamed/moved |
|---|---|---|---|
| `window.COMPANIES` | `data.js` | `shell.jsx`, `view-dashboard.jsx`, `view-companies.jsx`, `view-map.jsx`, `view-matches.jsx`, `view-capabilities.jsx`, `index.html` (inline) | **Critical** — crashes 6 files |
| `window.SECTORS` | `data.js` | `atoms.jsx`, `view-dashboard.jsx`, `view-companies.jsx`, `view-map.jsx`, `view-matches.jsx`, `view-capabilities.jsx`, `view-onboard.jsx`, `join-app.jsx`, `index.html` | **Critical** — crashes 9 files |
| `window.STAGES` | `data.js` | `view-companies.jsx`, `view-onboard.jsx`, `join-app.jsx` | High |
| `window.READINESS` | `data.js` | `view-onboard.jsx` | Medium — crashes step 4 |
| `window.PEOPLE` | `data.js` | `shell.jsx` (nav count), `view-misc.jsx` | Medium |
| `window.CONNECTIONS` | `data.js` | `view-map.jsx` | Medium |
| `window.SECTOR_DIST` | `data.js` | `view-dashboard.jsx` | Medium |
| `window.FUNNEL` | `data.js` | `view-dashboard.jsx`, `atoms.jsx` | Medium |
| `window.ACTIVITY` | `data.js` | `view-dashboard.jsx` | Low |
| `window.I` | `icons.jsx` | `shell.jsx`, `atoms.jsx`, `view-dashboard.jsx`, `view-companies.jsx`, `view-map.jsx`, `view-matches.jsx`, `view-onboard.jsx`, `view-misc.jsx`, `view-capabilities.jsx`, `join-app.jsx` | **Critical** — used everywhere |
| `window.toast` | `atoms.jsx` (IIFE) | `view-misc.jsx`, `view-matches.jsx`, others | High — silent fail (no crash, just no toasts) |
| `window.ScoreRing` | `atoms.jsx` | `view-dashboard.jsx`, `view-companies.jsx`, `view-matches.jsx`, `view-misc.jsx` | High |
| `window.Sparkline` | `atoms.jsx` | `view-dashboard.jsx` | Medium |
| `window.CoLogo` | `atoms.jsx` | `view-companies.jsx`, `view-dashboard.jsx` | Medium |
| `window.SectorPill` | `atoms.jsx` | `view-companies.jsx`, `view-capabilities.jsx` | Medium |
| `window.Donut` | `atoms.jsx` | `view-dashboard.jsx` | Medium |
| `window.MiniBar` | `atoms.jsx` | `view-dashboard.jsx` | Medium |
| `window.Funnel` | `atoms.jsx` | `view-dashboard.jsx` | Medium |
| `window.FitBar` | `atoms.jsx` | `view-misc.jsx` | Low |
| `window.Sidebar` | `shell.jsx` | `app.jsx` | High |
| `window.Topbar` | `shell.jsx` | `app.jsx` | High |
| `window.NAV` | `shell.jsx` | `app.jsx` | High |
| `window.useTweaks` | `tweaks-panel.jsx` | `app.jsx` | High |
| `window.TweaksPanel` | `tweaks-panel.jsx` | `app.jsx` | High |
| `window.TweakSection` | `tweaks-panel.jsx` | `app.jsx` | Low |
| `window.TweakRadio` | `tweaks-panel.jsx` | `app.jsx` | Low |
| `window.TweakColor` | `tweaks-panel.jsx` | `app.jsx` | Low |
| `window.Dashboard` | `view-dashboard.jsx` | `app.jsx` | High |
| `window.CompaniesView` | `view-companies.jsx` | `app.jsx` | High |
| `window.CompanyProfile` | `view-companies.jsx` | `app.jsx` | High |
| `window.CapabilitiesView` | `view-capabilities.jsx` | `app.jsx` | High |
| `window.MapView` | `view-map.jsx` | `app.jsx` | High |
| `window.MatchesView` | `view-matches.jsx` | `app.jsx` | High |
| `window.OnboardView` | `view-onboard.jsx` | `app.jsx` | High |
| `window.Copilot` | `view-misc.jsx` | `app.jsx` | High |
| `window.PeopleView` | `view-misc.jsx` | `app.jsx` | High |
| `window.SettingsView` | `view-misc.jsx` | `app.jsx` | High |

---

## 4. Cross-file Dependencies

```
app.jsx
  depends on: shell.jsx, tweaks-panel.jsx,
              view-dashboard.jsx, view-companies.jsx, view-capabilities.jsx,
              view-map.jsx, view-matches.jsx, view-onboard.jsx, view-misc.jsx

shell.jsx
  depends on: data.js (window.COMPANIES, window.PEOPLE), icons.jsx (window.I)

atoms.jsx
  depends on: data.js (window.SECTORS), icons.jsx (window.I)

view-dashboard.jsx
  depends on: data.js, icons.jsx, atoms.jsx (ScoreRing, Sparkline, CoLogo, Donut, MiniBar, Funnel)

view-companies.jsx
  depends on: data.js, icons.jsx, atoms.jsx (ScoreRing, CoLogo, SectorPill)

view-capabilities.jsx
  depends on: data.js, icons.jsx, atoms.jsx (SectorPill)

view-map.jsx
  depends on: data.js (COMPANIES, CONNECTIONS, SECTORS), icons.jsx

view-matches.jsx
  depends on: data.js, icons.jsx, atoms.jsx (ScoreRing)

view-onboard.jsx
  depends on: data.js (READINESS, SECTORS), icons.jsx

view-misc.jsx
  depends on: data.js (PEOPLE), icons.jsx, atoms.jsx (FitBar, ScoreRing), window.toast

join-app.jsx
  depends on: data.js (SECTORS), icons.jsx

tweaks-panel.jsx
  depends on: nothing (self-contained)

icons.jsx
  depends on: nothing (self-contained, defines all SVG components)

data.js
  depends on: nothing (runs first, no imports)

index.html (inline JS)
  depends on: data.js (COMPANIES, SECTORS)
```

---

## 5. High-Risk Files

| File | Why risky |
|---|---|
| `ecos.html` | Root entry point — defines script load order; changing it breaks the entire app |
| `data.js` | Sole source of truth for all data; used by all 3 entry points; all globals originate here |
| `app.jsx` | Root React component; mounts the app; references every view component by `window.*` name |
| `shell.jsx` | Defines `Sidebar`, `Topbar`, `NAV` — structural shell used by `app.jsx`; also contains the global search `SearchBox` with a vanilla DOM portal |
| `atoms.jsx` | Exports 8 shared UI components AND injects `window.toast()` at load time — side effect on import |
| `icons.jsx` | Exports `window.I` — the icon registry used by every JSX file; if this loads late, every icon render throws |
| `styles.css` | Shared design system for `ecos.html` + `join.html`; any class rename breaks both |
| `view-map.jsx` | Hand-rolled SVG force-layout algorithm — fragile; any touch risks breaking the graph |
| `join-app.jsx` | Separate React root for `join.html`; independent from `app.jsx` but shares data and icons |
| `index.html` | Self-contained 947-line file; inline CSS + JS; `data.js` loaded mid-document; any restructure risks breaking the inline script |

---

## 6. Low-Risk Files

Files that could be moved later with lower risk (do not move now):

| File | Notes |
|---|---|
| `fetch_logos.py` | Python utility script — not loaded by any HTML; used manually to populate `logos/` |
| `fetch_site_logos.py` | Same — standalone utility script |
| `attachments.zip` | Unknown contents — confirm unused before any action |
| `spec.html` | Appears to be a legacy/demo/spec page; confirm it is unused before moving or deleting |
| `docs/` | Documentation only — no runtime dependency |
| `ecos-qr.png` | Image asset — confirm where it is referenced before moving |

---

## 7. Refactor Preconditions

All of the following must be true before any file is moved:

- [ ] `ecos.html` loads and renders without console errors
- [ ] All 9 sidebar views navigate without crashing
- [ ] Onboarding wizard reaches step 4 (Readiness) without crashing
- [ ] Company profile for Ramon.Space shows populated Tech / Match / Connections tabs
- [ ] `join.html` loads and the 7-step wizard works
- [ ] `index.html` loads and the directory section shows companies
- [ ] Script load order in all 3 HTML files is fully documented (this file)
- [ ] All `window.*` exports are mapped (this file)
- [ ] A rollback path exists (git commit of working state before any move)
