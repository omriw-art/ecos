# MVP_SCREEN_ARCHITECTURE

Date: 2026-07-05

---

## 1. Purpose

Define the MVP screen set for the ecos platform after the structural refactor is complete (Batches A–K). This document specifies which screens exist, which should be built or redesigned for MVP, and how the admin and company experiences should be structured.

This is a product planning document, not an implementation spec. No code changes are made here.

---

## 2. Current Screens

The following views exist in the current codebase:

| Screen | File | Current State |
|---|---|---|
| Dashboard / Mission Control | `src/modules/dashboard/view-dashboard.jsx` | Functional with real computed data. Demo-quality. |
| Companies / Organizations | `src/modules/organizations/view-companies.jsx` | Functional directory + filterable list + company profile. |
| Capabilities Map | `src/modules/capabilities/view-capabilities.jsx` | Functional with gap analysis. |
| Ecosystem Map (graph) | `src/modules/map/view-map.jsx` | Functional SVG network graph. |
| Matches | `src/modules/matches/view-matches.jsx` | Live matching algorithm. |
| AI Copilot drawer | `src/modules/misc/view-misc.jsx` | Stub — canned replies only. |
| People / Org view | `src/modules/misc/view-misc.jsx` | Functional display. |
| Settings | `src/modules/misc/view-misc.jsx` | Stub only. |
| Admin Onboarding wizard | `src/modules/onboarding/view-onboard.jsx` | Functional UI. No backend. |
| Public Landing | `index.html` | Functional. Company directory, registration form, growth tools. |
| Join / Onboarding (public) | `join.html` + `src/modules/onboarding/join-app.jsx` | Functional friendly wizard. No backend. |

---

## 3. Proposed MVP Screens

The following is the recommended MVP screen set. Some are evolutions of current screens; some are new.

### 1. Admin Mission Control
**Replaces:** Current Dashboard view.
**Owner:** Super Admin / Admin.
**Purpose:** The strategic command center. Shows ecosystem health, action queue, opportunities, needs, strategic companies, capability gaps, and AI suggestions.
**Priority:** Must have.

### 2. Companies / Organizations
**Evolves from:** Current Companies view.
**Owner:** Admin (full view) / Company (own profile only, future).
**Purpose:** Filterable directory of all ecosystem companies. Grid/table toggle. Filter by sector, stage, readiness, strategic flag.
**Priority:** Must have.

### 3. Organization Profile
**Evolves from:** Current Company Profile (tab view inside Companies view).
**Owner:** Admin (all fields) / Company (own data, future).
**Purpose:** Deep company profile: overview, technology, offers, needs, connections, contacts, match score, strategic classification, readiness status, admin notes.
**Note:** Many profile fields (`tech`, `offers`, `needs`, etc.) are empty in current data. Filling 5–10 company profiles should be an early-sprint goal. See `docs/PROJECT_MAP.md` section 14.
**Priority:** Must have.

### 4. Opportunities
**New screen.** Does not exist yet.
**Owner:** Admin (full CRUD) / Company (view relevant opportunities, future).
**Purpose:** List of active ecosystem opportunities — open calls, tenders, programs, joint projects. Shows status (active, closing soon, draft, expired). Admin can create, import, review, publish. Company can flag interest.
**MVP approach:** Start with manually curated mock data seeded in `data.js`. Add `OPPORTUNITIES` array as the first new data entity. No backend required for MVP.
**Priority:** Must have.

### 5. Needs
**New screen.** Does not exist as a dedicated view.
**Owner:** Admin (aggregate view) / Company (own needs, future).
**Purpose:** Aggregate view of company needs across the ecosystem. Groups needs by type (investment, lab access, technology, partner, market). Surfaces systemic gaps. Admin can link needs to opportunities or flag them for review.
**MVP approach:** Read from `needs[]` arrays on company objects. Currently empty — requires data enrichment first.
**Priority:** Must have (but depends on data enrichment).

### 6. Review Queue
**New screen.** Does not exist yet.
**Owner:** Admin only.
**Purpose:** Centralized queue for all pending admin actions: pending technology approvals, stale profile alerts, new company submissions, imported opportunities awaiting review, AI suggestions awaiting approval.
**MVP approach:** Mock queue items seeded as a `REVIEW_QUEUE` constant in `data.js`. No real event system required for demo MVP.
**Priority:** Must have.

### 7. Capabilities
**Evolves from:** Current Capabilities view.
**Owner:** Admin.
**Purpose:** Coverage map of ecosystem building blocks. Shows which capabilities exist, which are gaps, which companies contribute. Admin can manage capability definitions.
**Note:** Current `CAPABILITY_DEFS` in `view-capabilities.jsx` is hardcoded. Eventually this should be configuration-driven. Do not hardcode final strategic categories yet.
**Priority:** Must have (mostly done, needs small evolution).

### 8. Ecosystem Map
**Evolves from:** Current Map view.
**Owner:** Admin.
**Purpose:** Network graph of companies, connections, and sector clusters. Strategic view of ecosystem topology.
**Note:** The current SVG force-directed layout is custom and works well. Do not replace it.
**Priority:** Should have.

### 9. Global Search
**Evolves from:** Current search box in Topbar.
**Owner:** All users.
**Purpose:** Unified search across companies, people, opportunities, needs, capabilities. Currently searches only companies.
**Priority:** Should have.

### 10. Join / Onboarding (public)
**Evolves from:** Current `join.html` + `join-app.jsx`.
**Owner:** Companies applying for ecosystem access.
**Purpose:** Friendly public onboarding flow. Invite-only in MVP — companies receive a link from the admin team.
**Priority:** Must have (mostly done).

### 11. Public Landing
**Evolves from:** Current `index.html`.
**Owner:** Public.
**Purpose:** Landing page, company directory, growth tools. Should remain stable. See preservation rules.
**Priority:** Must have (done).

### 12. Company Command Center (future)
**New experience.** Does not exist yet.
**Owner:** Company users.
**Purpose:** A company-facing dashboard showing their own profile completeness, active opportunities they've been matched to, open needs, recommendations, and ecosystem position.
**Note:** This is the company-side analog of the Admin Mission Control. Same platform, different view mode. Requires authentication before it can be built.
**Priority:** Later.

---

## 4. Screen Priority Classification

### Must Have for MVP

| Screen | Status |
|---|---|
| Admin Mission Control | Redesign in progress (Batch N) |
| Companies / Organizations | Mostly done — needs data enrichment |
| Organization Profile | Mostly done — needs data enrichment |
| Opportunities | New — needs `OPPORTUNITIES` data + new view |
| Needs | New — needs data enrichment + new view |
| Review Queue | New — can start with mock queue items |
| Join / Onboarding (public) | Done |
| Public Landing | Done |

### Should Have

| Screen | Status |
|---|---|
| Capabilities | Done — minor evolution needed |
| Ecosystem Map | Done — stable |
| Global Search | Partially done — currently companies-only |
| AI Copilot placeholder | Exists as stub — keep visible, mark as coming soon |

### Later

| Screen | Dependency |
|---|---|
| Company Command Center | Requires authentication and role-based access |
| Advanced Capability Readiness Engine | Requires configurable capability definitions |
| Supabase / Auth screens | Requires backend |
| Government API ingestion | Requires review-first pipeline and external partnership |
| Advanced AI agents | Requires governance model before autonomous AI |

---

## 5. Admin vs. Company Experience

These are not two separate applications. They are two views on the same platform, differentiated by role and access level.

**Admin sees:**
- Ecosystem-wide company data, including non-public information.
- All company needs, opportunities, and connections.
- The full review queue and governance workflow.
- Strategic classification and readiness management.
- AI suggestions and approval workflows.
- Export and reporting tools.

**Company sees:**
- Only their own profile data.
- Opportunities they have been matched to or that are publicly visible.
- Their own needs and submitted offers.
- Recommendations specific to their company.
- Profile completion status and guidance.
- Does not see other companies' private data.
- Does not see the admin governance layer.

**MVP can start admin-heavy.** The company experience (Company Command Center) should be planned from the beginning as a parallel track but can be implemented after the admin MVP is stable. Company value must remain clear in product messaging even while the company UI is not yet built — the company's information is enriched by the admin on their behalf, which itself creates value.

---

## 6. Navigation Recommendation

The current sidebar navigation (defined in `src/app/shell.jsx`) should be expanded to reflect the MVP screen set.

### Current navigation sections

```
מבט-על (Overview)
  - Dashboard
  - Companies
  - Capabilities
  - Map

Intelligence
  - Matches
  - AI Copilot
  - People

פעולות (Actions)
  - Onboarding
  - Settings
```

### Recommended future navigation

```
Overview
  - Mission Control     ← renamed from Dashboard
  - Organizations       ← renamed from Companies
  - Opportunities       ← new
  - Needs               ← new

Governance
  - Review Queue        ← new
  - Capabilities        ← moved from Overview

Intelligence
  - Ecosystem Map
  - Matches
  - AI Copilot

Admin
  - Onboarding
  - Settings
```

**Implementation note:** The current `NAV` array in `src/app/shell.jsx` is the single source of navigation truth. New screen IDs should be added to `NAV` before creating the corresponding view components. The `view` state in `src/app/app.jsx` handles rendering — add a new view ID and render branch for each new screen.

---

## 7. Implementation Notes

Current view files can evolve gradually. The migration path for each:

| Current file | Future role | Change needed |
|---|---|---|
| `view-dashboard.jsx` | Admin Mission Control | Redesign internal sections (Batch N) |
| `view-companies.jsx` | Organizations + Organization Profile | Expand profile tabs once data is enriched |
| `view-capabilities.jsx` | Capabilities | Minor evolution — make definitions configurable |
| `view-map.jsx` | Ecosystem Map | Preserve — may add pan/zoom later |
| `view-matches.jsx` | Matches | Preserve — algorithm is live |
| `view-misc.jsx` | Copilot + People + Settings | Split into separate files when large enough |
| `view-onboard.jsx` | Admin Onboarding | Fix `window.READINESS` bug; preserve wizard UX |
| (new) `view-opportunities.jsx` | Opportunities | Create as new module |
| (new) `view-needs.jsx` | Needs | Create as new module (or embed in dashboard first) |
| (new) `view-review-queue.jsx` | Review Queue | Create as new module |

---

## 8. MVP Value Loops

The platform creates value through circular flows. Define these explicitly to avoid building features that exist outside a loop.

### Admin Intelligence Loop
```
New company data enters
  → Admin reviews and enriches profile
  → Profile is verified and classified
  → Ecosystem knowledge graph grows
  → AI surfaces insights from enriched graph
  → Admin takes action based on insights
  → Action creates new data (opportunity linked, need resolved, company upgraded)
  → Loop repeats
```

### Company Value Loop (future)
```
Company submits profile
  → Admin enriches and verifies
  → Company appears in ecosystem with matches
  → Company receives opportunity recommendations
  → Company updates needs and offers
  → Better matching → better recommendations
  → Company profile improves over time
```

### Opportunity Loop
```
Opportunity identified (imported or admin-created)
  → Admin reviews and publishes
  → Matched companies are notified (future)
  → Companies express interest
  → Admin or ecosystem facilitates connection
  → Outcome tracked (success, failed, ongoing)
  → Outcome improves future matching
```

### Knowledge Governance Loop
```
Company or AI claims new knowledge (technology, connection, milestone)
  → Enters review queue
  → Admin verifies with source
  → Approved: enters official knowledge graph
  → Rejected: logged with reason
  → AI learns from approval patterns (future)
```

---

## 9. Data Enrichment Priority

Before new screens can show real value, the underlying data must be enriched. Current gaps (from `docs/PROJECT_MAP.md`):

| Field | Current state | Priority |
|---|---|---|
| `needs[]` | Empty for all companies | High — blocks Needs screen |
| `offers[]` | Empty for all companies | High — blocks Opportunities matching |
| `tech[]` | Empty for all companies | High — blocks Tech tab and Capabilities matching |
| `readiness` | Empty string for all | High — blocks ecosystem health metrics |
| `strategic` | `false` for all | High — blocks Strategic Companies zone |
| `fundingM` | `0` for all | Medium — funding data not critical for MVP |
| `customers[]` | Empty for all | Medium |
| `partners[]` | Empty for all | Medium |

**Recommended data enrichment sprint (pre-Batch N):** Fill `tech`, `offers`, `needs`, `readiness`, and `strategic` for at least 10 key companies (Ramon.Space, IAI, Elbit, SpaceIL, Spaceway, D-Fend, Lulav Space, NSLComm, ImageSat International, Astrosense) before starting the dashboard redesign. This ensures the new zones have real data to display.

Also fix the `window.READINESS` runtime bug in `view-onboard.jsx` (StepReadiness references `window.READINESS` which is undefined in `data.js`). Add `READINESS` to the `Object.assign` export in `src/data/data.js`.
