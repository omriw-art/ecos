# Company Opportunity Feed — Product Plan

Last updated: 2026-07-26
Status: living plan; update alongside `docs/active/CURRENT_STATUS.md` when the
feed model changes materially.

## Feed concept

The Company perspective centers on one ranked, explainable stream —
**"פיד הזדמנויות"** — driven by `window.CompanyFeed.listCompanyFeed(company)`.
A company should never need to browse the admin's entity-level views
(companies directory, capabilities, map, needs board, matches) to find
relevant opportunities; the feed pulls the relevant slice to them instead.
Everything the feed shows is either deterministically matched to the acting
company or an honestly-labeled unranked catalog — never fabricated,
personalized-by-AI, or live.

## Company nav model

Company perspective's primary nav is deliberately minimal (`src/app/shell.jsx`
`navForPerspective("company")`):

| Nav item | Destination | Note |
|---|---|---|
| פיד הזדמנויות | `company-overview` | landing; the feed itself |
| הארגון שלי | acting company's own profile (`company` view) | same profile view admin uses, opened for the acting company only — never the companies directory. Its "matches"/"connections" tabs (which browse to *other* companies — match targets, "ארגונים דומים" overlap) are hidden for Company perspective specifically (`CompanyProfile`'s `restrictToOwnOrg`, `src/modules/organizations/view-companies.jsx`) — reusing the view without this gate would have leaked exactly the org-overlap/similar-companies exposure this plan forbids. Admin and Partner keep every tab, unchanged. Its breadcrumb also no longer returns Company/Partner to the companies directory (`app.jsx`'s `companyProfileBackTarget`) |
| הזדמנויות צמיחה | `growth-tools` | shared static catalog, also reachable from Partner |

Not primary nav for Company (still reachable *from* the feed via action
buttons/`onNav`, never removed as functionality — see F2/F3 history in
`docs/active/CURRENT_STATUS.md`): companies directory, capabilities, map,
needs board, matches, copilot, people, dashboard, onboarding, settings. Admin
nav (`NAV`) and Partner's nav branch are untouched by any of this — perspective
is a UI lens, never a permission boundary (`EcosPerspective`).

"הזדמנויות שסומנו" has no separate route today — it is a side-rail section on
the feed page itself (immediately visible on landing), not a nav destination.
Revisit only if/when marked opportunities outgrow a side-rail card.

## Feed item types (current — `src/services/company-feed.js`)

1. **Relevant needs** — other orgs' needs the deterministic `MatchEngine`
   scores above threshold for the acting company. Ranked, real score/reasons.
2. **Ecosystem opportunities** — partner-published opportunities
   (`NeedsStore`, `sourceType: "opportunity"`). Browsable like a bulletin
   board: shown even below match threshold, honestly marked `ranked:false` /
   `score:null` when the engine can't score them.
3. **Growth tools** — static seed catalog (`GrowthToolsStore`), always
   unranked (`score:null`, `createdAt:null`), rendered as a visually distinct
   footer/catalog, never interleaved with ranked items.

## Growth Opportunities — future source model

Today's growth catalog is 14 hand-written seed entries with no source
tracking. The plan for a real, source-backed catalog (**not implemented
yet** — planning only):

| Field | Notes |
|---|---|
| `sourceName` | who publishes it (e.g. "רשות החדשנות") |
| `sourceType` | e.g. `government` \| `accelerator` \| `vc` \| `academic` \| `industry` |
| `originalUrl` | link to the source page — required once ingestion is real |
| `title` | |
| `provider` | display name, may differ from `sourceName` |
| `category` | one of the 8 categories below |
| `deadline` | only if the source states a real one; omit, never invent |
| `publishedAt` / `updatedAt` | only if the source states them |
| `description` | |
| `eligibilitySummary` | only if the source explicitly publishes eligibility criteria — never inferred/guessed |
| `status` | e.g. `open` \| `closed` \| `unknown` — `unknown` is honest and allowed, a guess is not |
| `lastCheckedAt` | when ingestion last confirmed the source page still says this |
| `tags` / `sectors` / `stages` | |
| `sourceConfidence` | e.g. `verified` \| `unverified` — surfaced in UI copy, not hidden |
| `manualReviewStatus` | e.g. `pending` \| `approved` \| `rejected` — an admin gate before anything sourced ever reaches a company |

### Category taxonomy (target — 8 categories)

מענקים וקולות קוראים · פיילוטים ולקוחות עוגן · האצה ותוכניות צמיחה · שיתופי
פעולה בינלאומיים · רגולציה / Sandbox · השקעות ודמו דיי · אקדמיה ומעבדות ·
יצוא וכניסה לשווקים

`src/services/growth-tools-store.js`'s 14 seed items have already been
relabeled onto these 8 categories (naming/category cleanup only — no schema
change, no new fields, `isDemo: true` unchanged).

### Truthfulness constraints on ingestion (binding on any future implementation)

- Until real source ingestion exists, growth items are labeled a **curated
  local demo catalog** — never "live", never "updated automatically".
- No eligibility claims beyond what a source explicitly publishes; no
  inferred/guessed eligibility ever.
- **No client-side/in-browser scraping, ever.** Future ingestion is a
  backend job or manual/admin-reviewed import — this app has no backend
  today, so real ingestion is explicitly future-only, gated on that backend
  existing.
- Every sourced item must be traceable to `originalUrl` and carry
  `lastCheckedAt` so staleness is visible, not hidden.

## Ranking logic (current, unchanged by this plan)

Deterministic, no AI, no randomness:
`score desc → confidence desc → real createdAt desc → real priority desc → stable id`,
reusing the same `MatchEngine.rankOrganizationsForNeed` the Needs Board
already trusts. Growth tools are never scored and always sort after ranked
items (stable: seed order, then title).

## What appears where

| Surface | Content |
|---|---|
| **Main feed** (dominant column) | Relevant needs + ecosystem opportunities, ranked; growth tools as a distinct unranked footer |
| **Side rail** (secondary) | הפרופיל שלנו (open own profile), הזדמנויות שסומנו (locally marked interest), הצעדים הבאים (quick actions: update profile, add a need) |
| **הארגון שלי (own profile view)** | The acting company's own data only — same profile view admin uses, opened for one company, never a directory |

## Permanently forbidden (product boundary, not a scope cut)

- Recommended partners / similar companies / org-overlap ranking of any
  kind — would leak competitive positioning to the viewing company.
- Fake AI, fake live/real-time updates, fake trending/popularity, fake
  personalization ("עבורך"/"מותאם אישית"), fake activity/view counts.
- Partner identity exposure beyond what a partner already chose to publish
  (an opportunity's `sourceOrgName` is intentional — the partner published
  it to be found); partner-side visibility of company interest stays
  aggregate-only, never per-company.
- Inferred or fabricated eligibility, deadlines, or timestamps on any feed
  or growth-catalog item.

## Next implementation batches

1. `fix(company): restore my organization entry` — this batch: nav model
   fix (done).
2. `docs(feed): define growth opportunity source model` — this doc (done).
3. `polish(company): align growth opportunity naming and categories` —
   category relabel in `growth-tools-store.js` (done, bundled into this
   session for a low-risk data-only change).
4. *(future, backend-gated)* Growth Opportunities source ingestion —
   backend/job-based fetch + admin manual-review queue, populating the
   fields above. Explicitly blocked on a real backend existing; no
   client-side scraping under any circumstance.
5. *(future)* Revisit "הזדמנויות שסומנו" as its own nav destination if the
   marked-opportunities list outgrows a side-rail card.
