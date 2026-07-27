// ecos — centralized "acting company" resolution for Company Perspective.
//
// Before this file existed, four call sites (app.jsx's
// resolveActingCompanyForNav, view-company-overview.jsx's
// resolveActingCompany, view-opportunity-detail.jsx's
// resolveActingCompanyForInterest, view-growth-tools.jsx's
// resolveActingCompanyForGrowthTools) each duplicated their own copy of
// the same partner-org-type exclusion set and the same
// PREFERRED_DEFAULT_COMPANY_IDS array. This file centralizes that shared
// logic so it is maintained in exactly one place; each of those four call
// sites now delegates to window.ActingCompanyResolver.resolve() instead of
// carrying its own copy.
//
// Eligibility rule (unchanged from before this file existed): a company is
// eligible to be an "acting company" if it has no organizationType, or an
// organizationType that isn't partner-like (investor/accelerator/academic/
// research/government/service-provider/nonprofit). This is a presentational
// filter only — never an authorization/permission boundary (same caveat
// perspective.js documents for EcosPerspective itself).
//
// Demo-default exception: Rakia (id "rakia") is the entity Company
// Perspective shows when there is NO explicit acting-company selection —
// a deliberate product decision, not an eligibility change. Rakia's
// organizationType stays "nonprofit" and isEligibleActingCompany() below
// still excludes it exactly as before; DEMO_DEFAULT_COMPANY_ENTITY_ID is a
// narrow, explicit UI-default bypass that only ever applies when
// actingCompanyId is falsy (nothing selected yet). Any explicit selection —
// of an eligible real company, or of anything else that doesn't resolve —
// is handled by the normal eligible/preferred-default chain below and
// never falls back to the demo entity. This can never be used to grant
// access to anything: it only changes which record a read-only "which
// company am I looking at" resolver returns when nothing has been chosen.

(function () {
  if (window.ActingCompanyResolver) return;

  const PARTNER_ORG_TYPES = new Set([
    "investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit",
  ]);

  // Preferred demo default when no acting company is chosen yet AND the
  // demo-default entity below isn't available — a deliberate pick of
  // clearly-Israeli space companies, not whichever happens to be first in
  // the seed array.
  const PREFERRED_DEFAULT_COMPANY_IDS = ["ramon-space", "spacepharma", "spaceil"];

  const DEMO_DEFAULT_COMPANY_ENTITY_ID = "rakia";

  function isEligibleActingCompany(company) {
    return !!company && (!company.organizationType || !PARTNER_ORG_TYPES.has(company.organizationType));
  }

  function preferredDefaultCompany(eligible) {
    for (const id of PREFERRED_DEFAULT_COMPANY_IDS) {
      const found = eligible.find((c) => c.id === id);
      if (found) return found;
    }
    return null;
  }

  // Resolution order:
  //   1. explicit actingCompanyId, if it resolves to an eligible company —
  //      always wins, exactly as before this file existed.
  //   2. no explicit selection at all -> the demo-default entity (Rakia),
  //      if present in the given company list.
  //   3. the curated preferred defaults (ramon-space/spacepharma/spaceil).
  //   4. whichever eligible company happens to be first.
  //   5. any company at all, or null.
  function resolveActingCompany(companies, actingCompanyId) {
    const list = companies || [];
    const eligible = list.filter(isEligibleActingCompany);
    const acting = actingCompanyId ? eligible.find((c) => c.id === actingCompanyId) : null;
    if (acting) return acting;
    if (!actingCompanyId) {
      const demo = list.find((c) => c.id === DEMO_DEFAULT_COMPANY_ENTITY_ID);
      if (demo) return demo;
    }
    return preferredDefaultCompany(eligible) || eligible[0] || list[0] || null;
  }

  window.ActingCompanyResolver = {
    PARTNER_ORG_TYPES,
    PREFERRED_DEFAULT_COMPANY_IDS,
    DEMO_DEFAULT_COMPANY_ENTITY_ID,
    isEligibleActingCompany,
    resolve: resolveActingCompany,
  };
})();
