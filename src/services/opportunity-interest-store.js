// ecos — local browser persistence for company interest in partner-published
// opportunities (Company Interest v1). A "opportunity" here is any NeedsStore
// record with sourceType: "opportunity" — this store never reads or writes
// NeedsStore/CompanyStore itself, it only holds flat, additive interest
// records keyed by (opportunityId, companyId). Purely local demo state, no
// backend, no auth, no real contact/notification.
//
// localStorage-backed (via EcosStorage), unlike EcosPerspective's
// sessionStorage — an interest mark is meant to persist like the rest of the
// app's demo data (NeedsStore/CompanyStore/SubmissionStore), not reset on
// reload the way an ephemeral UI-lens toggle does.

(function () {
  if (window.OpportunityInterestStore) return;

  const STORAGE_KEY = "ecosystemOS.opportunityInterest.v1";

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  function compositeId(opportunityId, companyId) {
    return `${opportunityId}::${companyId}`;
  }

  function normalizeInterest(input, existing) {
    const source = Object.assign({}, existing || {}, input || {});
    return Object.assign({}, source, {
      id: text(source.id),
      opportunityId: text(source.opportunityId),
      companyId: text(source.companyId),
      status: "interested",
      createdAt: text(source.createdAt) || new Date().toISOString(),
    });
  }

  function readInterests() {
    const parsed = window.EcosStorage.read(STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveInterests(interests) {
    const normalized = asArray(interests).map((i) => normalizeInterest(i));
    window.EcosStorage.write(STORAGE_KEY, normalized);
    return normalized;
  }

  function getInterests() {
    return readInterests().map((i) => normalizeInterest(i));
  }

  function markInterest(opportunityId, companyId) {
    const oppId = text(opportunityId);
    const compId = text(companyId);
    if (!oppId || !compId) return null;

    const interests = getInterests();
    const id = compositeId(oppId, compId);
    const found = interests.find((i) => i.id === id);
    if (found) return found;

    const interest = normalizeInterest({
      id,
      opportunityId: oppId,
      companyId: compId,
      createdAt: new Date().toISOString(),
    });
    saveInterests([interest, ...interests]);
    return interest;
  }

  function hasInterest(opportunityId, companyId) {
    const id = compositeId(text(opportunityId), text(companyId));
    return getInterests().some((i) => i.id === id);
  }

  function listForOpportunity(opportunityId) {
    const oppId = text(opportunityId);
    return getInterests().filter((i) => i.opportunityId === oppId);
  }

  function listForCompany(companyId) {
    const compId = text(companyId);
    return getInterests().filter((i) => i.companyId === compId);
  }

  // Aggregate-only count for Partner-side display (Partner Interest Signals
  // v1) — deliberately returns a number, never the underlying records, so a
  // Partner view can only ever show "how many", never who.
  function countForOpportunity(opportunityId) {
    return listForOpportunity(opportunityId).length;
  }

  function clearInterests() {
    return saveInterests([]);
  }

  window.OpportunityInterestStore = {
    key: STORAGE_KEY,
    getInterests,
    markInterest,
    hasInterest,
    listForOpportunity,
    listForCompany,
    countForOpportunity,
    clearInterests,
  };
})();
