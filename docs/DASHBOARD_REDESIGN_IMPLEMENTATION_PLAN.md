# DASHBOARD_REDESIGN_IMPLEMENTATION_PLAN

Date: 2026-07-05

---

## 1. Purpose

Plan the redesign of the admin dashboard as an implementation sequence — without executing the redesign yet.

The goal is to move from the current demo-quality Mission Control screen to a production-quality Admin Mission Control with actionable zones, governance support, and opportunity/needs surfacing — while preserving app stability at every step.

This document defines the coding batches that follow the Batch M documentation sprint.

---

## 2. Recommended Approach

The redesign should be **phased and incremental**, not a single large rewrite.

Core principles:
- Never break the working demo. Every batch must leave the app runnable.
- Redesign one screen at a time. Start with the dashboard only.
- Preserve existing navigation, shell, and atoms. Do not change shared components during redesign sprints.
- Use existing data first. Do not wait for Supabase.
- Add mock placeholders where needed — explicitly marked as `demo` or `placeholder`.
- Test after every batch by opening the app in a browser and verifying the golden path.

The existing runtime architecture (Babel/CDN, `window.*` globals) is preserved throughout. No ES module conversion, no routing library, no build system — until explicitly planned in a separate architectural migration.

---

## 3. Batch N — Dashboard Information Architecture Refactor

### Goal
Refactor `src/modules/dashboard/view-dashboard.jsx` to implement the zone-based layout defined in `docs/UX_MISSION_CONTROL_BLUEPRINT.md`, without changing other screens.

### Scope
- **Only** `src/modules/dashboard/view-dashboard.jsx` is modified.
- No changes to `shell.jsx`, `app.jsx`, `atoms.jsx`, `icons.jsx`, `styles.css`, `data.js`, or any other view.
- New helper sub-components may be added inside `view-dashboard.jsx` as local functions.

### What changes
The current layout (KPI row → charts grid → distribution bars → AI insights) is replaced with the zone-based layout:

1. **Strategic Bar** — 6 key metrics as clickable chips at the top.
2. **Ecosystem Health** — compact panel: readiness distribution, profile completeness signal, companies needing attention.
3. **Action Queue** — prioritized list of pending admin tasks (mock data to start).
4. **Opportunities Radar** — placeholder card with count badges and "coming soon" state.
5. **Needs Radar** — placeholder card reading from `needs[]` arrays where available.
6. **Strategic Companies** — list of companies with `strategic: true` (currently none — show empty state with CTA).
7. **Capability Gaps** — simplified version of current capabilities view (top gaps only).
8. **Recent Activity** — current activity feed, unchanged.
9. **AI Insights** — current AI insights section, with Approve / Dismiss actions added.

### Preserved from current dashboard
- The `Kpi` component (reused in Strategic Bar).
- The `ActivityRow` component (reused in Recent Activity).
- The `AiInsight` component (reused in AI Insights, with new action buttons).
- The `StageDist` and `CityDist` components (moved to a collapsed Analytics card or removed from primary view).

### Data needed before Batch N
- `window.READINESS` bug fixed in `data.js` (add to `Object.assign` export).
- At least 5 companies with `strategic: true` set in data.
- At least 5 companies with `needs[]` arrays populated.
- At least 5 companies with `readiness` set to a non-empty value.
- Mock `REVIEW_QUEUE` array added to `data.js` (3–5 items: pending technology, stale profile, new submission).
- Mock `OPPORTUNITIES` array added to `data.js` (3–5 items: open call, closing soon, international program).

### Stop conditions for Batch N
- Any view other than Dashboard is broken.
- The dashboard fails to render.
- `ecos-qr.png` is staged.
- A forbidden file was modified.

---

## 4. Batch O — Dashboard Visual Redesign

### Goal
Improve the visual hierarchy of the redesigned dashboard after Batch N's information architecture is stable.

### Scope
- `src/modules/dashboard/view-dashboard.jsx` (visual refinements)
- Optionally: small additions to `src/shared/styles/styles.css` if new utility classes are needed.

### What changes
- Increase visual weight of the Strategic Bar numbers.
- Add color-coded severity badges to the Action Queue (critical / warning / info).
- Improve card spacing and internal padding — more operational, less decorative.
- Reduce or eliminate decorative gradient backgrounds on insight cards.
- Strengthen typographic hierarchy within each zone — section titles vs. data vs. labels.
- Add clear visual separation between dashboard zones (dividers or section spacing).
- Remove or move decorative elements that consume space without adding decision support.

### What does not change
- No global CSS rewrite.
- No changes to other view files.
- No changes to `atoms.jsx`, `shell.jsx`, or `icons.jsx`.
- The dark theme base palette stays.

### Success
After Batch O, a new user opening the dashboard can identify: what the ecosystem status is, what needs their attention, and what the most important strategic signals are — without reading any labels.

---

## 5. Batch P — Add Admin Action Queue Placeholder

### Goal
Build a functional Admin Action Queue section that consolidates all pending admin work in one place.

### Scope
- `src/modules/dashboard/view-dashboard.jsx` (if queue stays embedded in dashboard)
- Or: new `src/modules/misc/view-review-queue.jsx` if the queue becomes its own screen.

### Queue item types (MVP)
Each queue item has: type, description, company or entity reference, urgency level, and a primary action.

| Type | Example | Action |
|---|---|---|
| Pending technology | "AI-drafted technology 'Synthetic Aperture Radar' for Spaceway — needs approval" | Approve / Edit / Dismiss |
| Stale profile | "Ramon.Space: readiness not updated in 90+ days" | Review / Snooze |
| New company submission | "Astrosense applied via join flow — not yet processed" | Process / Assign |
| Imported opportunity | "ESA open call imported — not yet published" | Review / Publish / Archive |
| AI suggestion | "AI suggests strategic classification for NSLComm based on recent funding" | Approve / Dismiss |

### Data needed
- `REVIEW_QUEUE` array in `data.js` with 5–8 mock items using the schema above.
- Each item: `{ id, type, title, entity, entityId, urgency, createdAt, action }`.

### Navigation
If the queue is large enough to warrant its own screen, add a `review-queue` view to `NAV` in `shell.jsx` and add a render branch in `app.jsx`.

---

## 6. Batch Q — Opportunities / Needs MVP Data Structures

### Goal
Prepare mock data structures for Opportunities and Needs before building full modules, so that Batch R can render them without waiting for backend work.

### Scope
- `src/data/data.js` — add `OPPORTUNITIES` and enrich `needs[]` on companies.
- Do not create new view files in this batch.

### Opportunities data structure
```js
const OPPORTUNITIES = [
  {
    id: "esa-star-2025",
    title: "ESA STAR Program — Earth Observation 2025",
    source: "ESA",
    sourceUrl: "",
    type: "open_call",       // open_call | tender | collaboration | program
    sectors: ["earth-obs", "ai-data"],
    deadline: "2025-09-30",
    status: "active",        // active | closing_soon | draft | expired | published
    description: "...",
    matchedCompanies: [],    // filled by matching logic
    adminNotes: "",
    createdAt: "2025-07-01",
    publishedAt: null,
  },
  ...
];
```

### Needs enrichment
Populate `needs[]` for 10+ key companies with entries using this schema:
```js
needs: [
  {
    id: "need-001",
    type: "investment",       // investment | lab | partner | technology | market | other
    description: "...",
    urgency: "high",          // high | medium | low
    public: true,             // visible to non-admin users?
  }
],
```

### Stop condition
Do not modify any view file in Batch Q. This is a data-only sprint.

---

## 7. Batch R — Opportunities View

### Goal
Create `src/modules/opportunities/view-opportunities.jsx` as a new view module, reading from `window.OPPORTUNITIES`.

### Scope
- Create: `src/modules/opportunities/view-opportunities.jsx`
- Update: `src/app/shell.jsx` (add `opportunities` to NAV)
- Update: `src/app/app.jsx` (add render branch for `opportunities` view)
- Update: `ecos.html` (add new script tag for the new view)

### UI sections
- Active opportunities list with status badges (active / closing soon / draft / expired).
- Filter by sector, deadline, status.
- Each opportunity card: title, source, sectors, deadline, matched companies count, admin action buttons.
- Admin actions: Publish / Archive / Edit / Link to companies.

### What does not change
- All other view files.
- `data.js` global schema (reads from `window.OPPORTUNITIES`).

---

## 8. Batch S — Needs View

### Goal
Create `src/modules/needs/view-needs.jsx` as a new view module, aggregating `needs[]` from across all companies.

### Scope
- Create: `src/modules/needs/view-needs.jsx`
- Update: `src/app/shell.jsx`, `src/app/app.jsx`, `ecos.html` (same pattern as Batch R)

### UI sections
- Aggregated needs grouped by type (investment, lab, partner, technology, market).
- Count per type with company references.
- Systemic gap detection: if >3 companies share the same need type and sector, flag as ecosystem-level gap.
- Filter by type, sector, urgency.
- Admin can link a need to an opportunity.

---

## 9. Risk Register

| Risk | Mitigation |
|---|---|
| Redesign breaks working demo | Preserve existing components as fallbacks. Test after each batch. |
| Too much visual change at once | Separate information architecture (Batch N) from visual redesign (Batch O). |
| Unclear admin/company separation | Define the separation in product docs first (this batch). Build admin-only before company view. |
| Adding features before data is ready | Complete data enrichment sprint before Batch N starts. |
| Overbuilding AI before governance | Keep AI in draft/suggestion mode only until review queue exists. |
| Hardcoding strategic capability categories | Use configurable arrays, not hardcoded constants. Never embed classified capability names. |
| New view files breaking script load order | Always add new `<script>` tags to `ecos.html` in the correct dependency order. New views should reference `window.*` globals only — no new global dependencies. |
| `window.READINESS` runtime bug | Fix in data.js before starting Batch N. See `docs/PROJECT_MAP.md` section 10. |
| Empty `needs[]` making new zones empty | Complete data enrichment before building Needs Radar and Needs view. |

---

## 10. Success Criteria

The dashboard redesign is successful when:

1. **The admin understands ecosystem state in 10 seconds.** Strategic bar, health signal, and action queue are immediately visible without scrolling.
2. **There is a clear next action.** The action queue prioritizes the admin's most important pending task.
3. **Companies, opportunities, needs, and capabilities are all visible.** Each primary entity type has a visible surface on the dashboard.
4. **The interface feels like ecosystem intelligence, not a generic stats page.** The information density is higher, the decorative elements are fewer, and every visible element answers a real admin question.
5. **No existing core views break.** Companies, Capabilities, Map, Matches, Copilot, People, and Onboarding all continue to work.
6. **The redesign prepares the product for MVP modules.** The new zones for Opportunities, Needs, and Review Queue are visible even before their full views are built — as placeholder cards with real counts.

---

## 11. Batch Sequence Summary

| Batch | Type | File(s) changed | Goal |
|---|---|---|---|
| M | Docs | docs/ only | UX blueprint + screen architecture + this plan |
| N | Code | `view-dashboard.jsx` | Zone-based information architecture |
| O | Code | `view-dashboard.jsx`, optionally `styles.css` | Visual hierarchy improvement |
| P | Code | `view-dashboard.jsx` or new `view-review-queue.jsx` | Action queue UI |
| Q | Data | `data.js` | Opportunities + needs data structures |
| R | Code | New `view-opportunities.jsx` + shell/app/html | Opportunities view |
| S | Code | New `view-needs.jsx` + shell/app/html | Needs view |
| (future) | Code | Auth, routing, Supabase | Backend integration |

**Pre-Batch N prerequisite (data enrichment sprint):** Fix `window.READINESS` bug. Set `strategic: true` for 5+ companies. Fill `needs[]` for 10+ companies. Add `OPPORTUNITIES` and `REVIEW_QUEUE` mock arrays. This can happen in a dedicated data sprint or be part of Batch N's preflight.
