# Current Status — Ecosystem OS

Last updated: 2026-07-26
Current HEAD: `57b5df1` — feat(company): reorient overview into a ranked opportunity feed

This file is the single current-status entry point. Prefer this over anything
under `docs/archive/` when the two disagree — the archive reflects an earlier
(pre-`src/services`) phase of the project and is not maintained.

## Product direction

The Company perspective ("Company Environment") is moving from a fixed
dashboard of separate cards toward a single ranked stream — **"פיד
הזדמנויות"** (Company Feed) — driven by `window.CompanyFeed.listCompanyFeed`.
Relevant needs and ecosystem opportunities are merged into one deterministic,
explainable ranking; growth tools remain a visually separate, unranked
catalog footer, never interleaved with ranked matches.

## What currently works

- Company / Partner / Admin perspectives, with acting-org selection scoping
  what each perspective sees (perspective is a UI lens only, never a
  permission boundary).
- Needs board, submission approve/reject flow, company directory/profile,
  capability coverage, deterministic local matching (`MatchEngine`).
- Ownership metadata stamped on needs/interests and submission decisions
  (org + creator + reviewer).
- Partner-side interest visibility is aggregate-only (count/signal), never
  individual company identity.
- Company Feed read-model (`CompanyFeed.listCompanyFeed`) and its new
  feed-layout UI in `view-company-overview.jsx`, reusing the existing
  Opportunity Detail and mark-interest flows.

## Current architecture seams

Introduced as forward-looking interfaces, not yet a real backend:

- `EcosRepo` — promise-based repository seam; not yet consumed by any store,
  exists so future backend work has a stable target interface.
- `EcosLocalAdapter` — sits between `EcosRepo` and `EcosStorage`; today's only
  real backing implementation (a future `EcosRemoteAdapter` would match its shape).
- `EcosSession` — local identity/session scaffolding (seeded user + memberships).
- `EcosAuthz` — capability checks derived from org membership.
- `EcosOwnership` — resolves org/creator ownership fields on records.
- `CompanyFeed` — deterministic, explainable Company Feed read-model (pure
  selector over `NeedsStore` / `GrowthToolsStore` / `MatchEngine`, no writes).

## Local/demo only

- All persistence is `localStorage` via `EcosStorage` — no backend, no sync
  across devices/browsers.
- `EcosSession`'s "logged in user" is a single seeded local identity, not real auth.
- Growth tools are a static seed catalog — not an eligibility check, not
  connected to any external system.
- Partner "publish" and company "mark interest" are local-only records; no
  contact/notification is actually sent anywhere.

## Not real security yet

- `EcosAuthz.can()` is client-side UX guidance only ("should the UI offer
  this"), never enforcement — nothing stops direct localStorage/DevTools edits.
- `EcosOwnership` fields are self-asserted, client-written, unverified — not a
  confidentiality control, must never be used to scope what a user can see.
- Real enforcement of either can only come from a future server that
  re-derives and re-checks everything itself.

## Current next task

F2/F3 — Company Feed UI (`view-company-overview.jsx`): reorient the Company
overview into the ranked feed layout (context strip, feed column, side rail,
distinct growth-tools footer) with honest copy/empty-states/reasons.
**F2 shipped in `57b5df1`; ecos-ui-guard audited the same diff against the F3
requirements and it passed clean, so no separate F3 commit was needed.**

## Hard product boundaries

- No fake AI / live / scraping / eligibility / activity claims anywhere in the UI.
- No "recommended partners" / "similar companies" / org-overlap feed items —
  competitive-intelligence boundary, permanent product exclusion, not a scope cut.
- No partner identity exposure to companies — partner-side signal is
  aggregate-only.
- Perspective (Company/Partner/Admin) is a UI lens only — never a permission
  or data-access boundary.
