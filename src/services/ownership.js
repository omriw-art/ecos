// ecos — ownership resolver (Ownership Backfill v1, B6a).
//
// IMPORTANT: these fields are self-asserted, client-written, unverified
// local metadata. They are not a confidentiality control and must not be
// treated as server authority. Anyone can edit localStorage/sessionStorage
// and change what these resolvers return. Real ownership enforcement can
// only come from a server that re-derives it itself — never from trusting
// what this file (or any client) wrote. Do not use these fields to filter
// or scope what a user can see — that requires server-side enforcement,
// not this client-local metadata.
//
// currentOrgId() reads EcosPerspective's actingCompanyId — a real,
// CompanyStore-validated id — and must NEVER read EcosSession.getActiveOrgId().
// EcosSession's org ids are placeholder strings ("demo-org-company") that do
// not dereference to any real row; stamping one onto a record would be a
// wrong, unrecoverable answer, worse than leaving the field null.

(function () {
  if (window.EcosOwnership) return;

  function currentOrgId() {
    const perspective = window.EcosPerspective;
    if (!perspective || typeof perspective.get !== "function") return null;
    const state = perspective.get();
    return (state && state.actingCompanyId) || null;
  }

  function currentUserId() {
    const session = window.EcosSession;
    if (!session || typeof session.getUser !== "function") return null;
    const user = session.getUser();
    return (user && user.id) || null;
  }

  window.EcosOwnership = {
    currentOrgId,
    currentUserId,
  };
})();
