# UX_MISSION_CONTROL_BLUEPRINT

Date: 2026-07-05

---

## 1. Purpose

Define the next dashboard direction as Admin Mission Control / Ecosystem Intelligence.

This is not a generic analytics dashboard. It is not a stats page. It should become the strategic operating room for managing the Israeli Space Ecosystem — and eventually any strategic technology ecosystem where the same platform logic applies.

The dashboard should feel like a command center: dense but readable, operational not decorative, actionable not just informational.

---

## 2. Product Problem

### What the current dashboard does well

- Presents a working, real ecosystem overview with actual data.
- Shows companies, capabilities, a geographic map, a matching engine, and an onboarding wizard.
- Provides a demo-quality sense of the ecosystem through computed stats (company count, connections, sector distribution, stage distribution, top cities, activity feed).
- Includes an AI insights section that surfaces real data patterns.
- Has a clean sidebar navigation structure that already hints at the right information architecture.
- Has a global search with live results that actually works.

### What it does not yet solve

- **Too demo-like.** The KPI row, sector donut, and funnel cards feel like a dashboard template, not a mission-critical interface. They answer "what exists?" but not "what matters?"
- **Not enough admin decision support.** The current admin cannot see: which companies need attention, what is pending review, what opportunities are active, what is stale, what is missing from the ecosystem.
- **Not action-oriented.** There is no clear "what should I do next?" signal. Everything is informational display, nothing is prioritized.
- **Poor separation of concerns.** The dashboard mixes ecosystem overview (who exists), governance (what needs approval), opportunities (what is emerging), and capability gaps — all without clear hierarchy between them.
- **No governance layer.** There is no review queue, no approval flow, no "pending verification" concept in the UI.
- **No opportunity or needs surface.** The platform contains `needs[]` and `offers[]` fields on companies, but nothing in the dashboard surfaces them or connects them to opportunities.
- **No strategic intelligence.** The `strategic: boolean` field on companies is always false in data, and nowhere in the dashboard does strategic classification appear as a primary signal.
- **No ecosystem health signal.** There is no sense of data freshness, profile completeness, or knowledge verification status. The admin cannot tell if the data is trusted or stale.
- **Not yet a true intelligence layer.** The "AI insights" section computes real statistics but does not produce actionable recommendations, surface anomalies, or help the admin prioritize work.

---

## 3. Primary Users

### Super Admin
Full platform control. Manages all companies, all knowledge, all approvals, all exports. Can configure visibility, mark companies as strategic, and publish official knowledge. Sees all data including non-public company information.

### Admin / Expert Council
Expert reviewers who assist governance. Can review and approve incoming data, company profiles, opportunities, and AI suggestions. Behaves like Super Admin in the MVP.

### Company User (future)
A company representative who sees their own profile, their opportunities, their needs, and match recommendations. Does not see other companies' private data. Receives access via admin invitation (invite-only MVP).

### Government / Ecosystem Manager (future)
An external ecosystem stakeholder — ISA, MAFAT, Growth Authority — who needs a high-level strategic view of the ecosystem without operational detail. A read-only dashboard configured for ecosystem reporting.

**First redesign focus:** Admin Mission Control. Company Command Center comes later, after the admin experience is stable. Both views share the same data but present it through different command centers.

---

## 4. Admin Mission Control — Core Questions

The redesigned admin dashboard must answer at least one of the following in every visible section:

**Status:**
- What changed in the ecosystem since my last session?
- Which companies were updated, added, or flagged recently?

**Attention:**
- Which companies need attention — stale profile, missing data, incomplete onboarding?
- Which companies are at a critical stage and need follow-up?

**Governance:**
- Which technologies or capabilities are pending approval?
- Which AI suggestions are waiting for review?
- Which new company submissions are waiting for admin action?
- Which opportunities were imported and need review before publishing?

**Opportunity:**
- Which opportunities are currently active?
- Which are closing soon or at risk?
- Where are global ecosystem opportunities the Israeli ecosystem could address?

**Needs:**
- Which companies have open needs (investment, partners, lab access, technology)?
- Where are systemic needs that suggest a gap in the ecosystem?

**Strategy:**
- Which companies are classified as strategic?
- Which focus areas have strong coverage? Which have gaps?
- Which building blocks are missing or under-resourced?

**Action:**
- What is the single most important thing for the admin to do next?
- What has been waiting longest without resolution?

---

## 5. Recommended Dashboard Zones

### Zone 1 — Top Strategic Bar
The first thing the admin sees. Numbers at a glance.

| Metric | Description |
|---|---|
| Total organizations | All companies in the ecosystem |
| Active companies | Companies at "Active" or "Strategic" readiness |
| Strategic companies | Companies flagged as `strategic: true` |
| Open opportunities | Imported or admin-created opportunities visible in the platform |
| Open needs | Surfaced company needs from the ecosystem |
| Pending reviews | Total pending action items (technologies + profiles + AI suggestions) |

The bar is not decorative. Each number should be clickable, taking the admin directly to the filtered view.

### Zone 2 — Ecosystem Health Overview
A compact health panel visible immediately below the top bar.

| Signal | Description |
|---|---|
| Profile completeness | % of companies with `tech`, `offers`, `needs`, and `readiness` filled |
| Data freshness | How many companies have not been updated in >90 days (once timestamps exist) |
| Verified vs pending | Split between verified knowledge and unverified or AI-drafted content |
| Readiness distribution | Breakdown of companies by readiness stage (Initial contact / Mapped / Verified / Active / Strategic / Needs update) |
| Companies needing attention | Companies with empty critical fields, stale readiness, or flagged by the AI |

This zone gives the admin a "health score" of the ecosystem knowledge base. It should be a summary, not a full table.

### Zone 3 — Action Queue
The most important zone after the top bar. Prioritizes what needs the admin's attention today.

| Queue Item | Description |
|---|---|
| Pending technology approvals | Technologies submitted by companies or drafted by AI, awaiting verification |
| Stale company profiles | Companies whose data has not been confirmed in >N days |
| New company submissions | Companies that applied via join flow, not yet processed |
| Imported opportunities awaiting review | Opportunities ingested from external sources, not yet published |
| AI suggestions awaiting review | AI-drafted content (insights, recommendations, connections) awaiting approval |

Each queue item should show a count badge and a quick-action button. The admin should be able to action items from the queue without navigating away.

### Zone 4 — Opportunities Radar
A surface for tracking ecosystem opportunities — open calls, collaborations, tenders, joint programs.

| Section | Description |
|---|---|
| Active opportunities | Open calls, programs, or tenders currently available |
| Closing soon | Opportunities whose deadline is within 30 days |
| Global ecosystem opportunities | Opportunities from international programs (ESA, NASA, SBIR, etc.) |
| By domain / technology | Opportunities grouped by sector or capability tag |

In the MVP this can be seeded with mock data or manually curated. Later it should pull from government APIs and partner platforms.

### Zone 5 — Needs Radar
A surface for tracking what ecosystem companies are asking for.

| Section | Description |
|---|---|
| Open investment needs | Companies seeking investment at a specific stage |
| Lab / testing access needs | Companies needing specific testing or certification facilities |
| Partner needs | Companies seeking technology or commercial partners |
| Technology gaps | Capability gaps inferred from `needs[]` patterns across companies |
| Export / market needs | Companies seeking international market entry or distribution |

This zone is what transforms the platform from a directory into an intelligence platform. Aggregated needs reveal ecosystem-level gaps that no single company sees.

### Zone 6 — Strategic Companies
A curated panel showing the companies that matter most right now.

| Item | Description |
|---|---|
| Strategic badge | Companies with `strategic: true` prominently displayed |
| Focus area contributors | Companies contributing to defined strategic focus areas |
| Missing or stale data | Strategic companies with incomplete or outdated profiles — highest priority |
| Recently updated | Strategic companies with recent updates to profile or opportunities |

The admin should be able to update strategic classification from this panel.

### Zone 7 — Capability / Building Block Progress
A macro-level view of where the ecosystem is strong and where it is weak.

| Item | Description |
|---|---|
| Focus areas | Defined strategic technology focus areas (configurable, not hardcoded) |
| Strategic capabilities | Building blocks with high ecosystem coverage |
| Gaps and weak spots | Building blocks with low company coverage or no active companies |
| Capability coverage trend | Has coverage grown, stayed flat, or declined? |

**Do not hardcode final building block definitions here.** Capability categories should be configurable per domain, not embedded as constants. The current `CAPABILITY_DEFS` array in `view-capabilities.jsx` is a starting point, not a final schema.

### Zone 8 — Recent Activity
A reverse-chronological feed of significant ecosystem events.

| Event type | Description |
|---|---|
| Company updates | Profile changes, new data, readiness changes |
| New opportunities | Opportunities published or imported |
| New needs | Companies submitting needs |
| Admin decisions | Reviews approved or rejected, knowledge verified |
| Review events | Items entering or exiting the review queue |

The current `ACTIVITY` data in `data.js` is hardcoded demo content. This should eventually pull from a real event log.

### Zone 9 — AI Insights / Copilot Suggestions
A panel for AI-drafted content that has not yet been approved for official ecosystem knowledge.

| Item | Description |
|---|---|
| Draft insights | AI-generated observations about the ecosystem (patterns, anomalies, opportunities) |
| Explainable recommendations | Each suggestion shows the data it was derived from |
| Actionable signals | "Company X may be ready for strategic classification based on recent activity" |
| No auto-publish | Nothing in this zone becomes official knowledge without admin approval |
| Human approval required | Every AI suggestion has an Approve / Edit / Dismiss action |

This zone keeps AI in an assistive role. The admin governs what becomes official.

---

## 6. Design Direction

### Feel

- **Mission Control.** Not a reporting dashboard. Not a consumer product. An operational interface for someone managing strategic national infrastructure.
- **Intelligence room.** The user should feel like they are looking at an ecosystem that is alive — active, changing, requiring decisions.
- **Serious and strategic.** Minimal decoration. Information hierarchy over visual variety. Data should be immediately legible.
- **Dense but readable.** Information compression is a feature, not a problem. Every pixel should carry meaning. But density should not become clutter — use grouping, whitespace, and hierarchy rather than adding more items.
- **Operational, not decorative.** Remove anything that looks good but does not help the admin make a decision. The sector donut and the city distribution bar chart are pretty — but do they help the admin take action? If not, they belong in a separate analytics view, not the primary dashboard.
- **Dark theme can stay.** The current dark theme is appropriate for an intelligence platform. It does not need to change. What should change is the information architecture within that theme.
- **Evolve gradually.** Do not rebuild everything at once. The current dashboard is a working baseline. Redesign one zone at a time, starting with the top bar and action queue.

### Visual principles

- Use semantic color for status (verified=green, pending=amber, critical=red) separate from the accent palette.
- Use strong typographic hierarchy: primary KPI numbers large, labels small and muted.
- Tables over charts where data is operational (action queues, stale profiles). Charts where data is strategic (capability coverage, sector distribution).
- Left-align operational content. Keep decorative flourishes minimal.
- Every interactive element should look interactive. Passive display and actionable items must be visually distinct.

---

## 7. What To Preserve

The following current elements are worth preserving in the redesign:

| Element | Why keep it |
|---|---|
| Sidebar navigation | Clean, sectioned, works. RTL layout is correct. Navigation structure needs expanding, not replacing. |
| Dark theme direction | Appropriate for the product. No reason to change the base palette. |
| Company cards | `CoCard` and `CompanyProfile` are functional and data-rich. |
| Ecosystem map concept | The SVG graph is distinctive and valuable. Keep as a dedicated strategic view. |
| Capability map concept | `view-capabilities.jsx` with gap detection is genuinely useful. |
| Global search | Works well. Should stay in the topbar. |
| Strategic badge concept | `strategic: boolean` on companies is the right concept, just not yet surfaced in the UI. |
| Onboarding flow | The internal wizard concept (`view-onboard.jsx`) is the right UX for admin company entry. |
| Company profile concept | Multi-tab profile with Tech, Match, Connections, Contacts tabs. |
| `ScoreRing` component | A clear, compact relevance signal. |
| `window.toast()` global | Works everywhere. No need to replace before backend exists. |

---

## 8. What To Change Later

| Element | Change needed |
|---|---|
| Dashboard layout | Replace the current grid of charts with the zone-based layout described above. |
| KPI hierarchy | The top bar should reflect strategic state (strategic companies, pending reviews) not just counts. |
| Visual density | Increase information density in the action queue and health zones. Reduce decoration elsewhere. |
| Admin task queue | Add a visible, prioritized action queue as Zone 3. |
| Opportunity and needs surfacing | Add Opportunities Radar and Needs Radar as primary dashboard zones. |
| Separation between overview and action | Overview should summarize. Action queue should drive. Currently everything is overview. |
| Company profile hierarchy | The company profile should clearly separate public-facing vs. admin-only information. |
| Admin vs. company experience | Admin sees ecosystem control. Company sees their own command center. Currently there is only admin. |
| Intelligence layer | AI insights should be explainable, reviewable, and actionable — not just formatted text cards. |
| Sector donut and city bars | Move to a dedicated Analytics view. They are not the most important things on the dashboard. |

---

## 9. MVP UX Principle

Every dashboard section must answer at least one of:

- **What is happening?** (status, recent events, ecosystem health)
- **Why does it matter?** (strategic context, risk, opportunity)
- **What should I do next?** (action queue, pending items, prioritized recommendations)

If a dashboard section does not clearly answer one of these questions, it should be removed, merged with another section, or redesigned to add the missing answer.

Apply this test to every card and zone in the current dashboard:

| Current section | Answers | Keep? |
|---|---|---|
| KPI row (company count, connections, seed count) | What is happening | Yes — but needs richer KPIs |
| Sector donut | What is happening | Move to Analytics view |
| Funnel | What is happening | Redesign to show admin-actionable conversion, not just a funnel shape |
| Activity feed | What is happening | Yes — essential, expand to real events |
| Stage distribution | What is happening | Move to Analytics view |
| City distribution | What is happening | Move to Analytics view |
| Top matches | What should I do next? (weakly) | Replace with Strategic Companies zone |
| AI insights | Why does it matter? | Yes — restructure as Zone 9 with approval actions |

---

## 10. Non-Goals For The Next UI Sprint

The following are explicitly out of scope for the immediate next redesign sprint:

- No full redesign of the entire platform in one pass
- No Supabase integration yet
- No authentication / role-based access control yet
- No routing library rewrite
- No ES module conversion
- No complex AI agents or real LLM integration
- No hardcoding of classified or strategic building block categories
- No social network or collaboration features
- No fund marketplace or investor-facing features
- No mobile-optimized redesign (desktop-first until product is stable)
- No multi-language switch (Hebrew/English) — current RTL/LTR mix is acceptable for MVP
