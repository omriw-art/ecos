// ecos — local identity/session primitives (Identity Primitives v1).
//
// IMPORTANT: this is local scaffolding, not real authentication. There is no
// login, no server, no verified identity. A single seeded local user with
// seeded memberships stands in for "who is using the app" so later batches
// (authz, perspective) have a real user -> membership -> role chain to derive
// from instead of a bare perspective string. Nothing here is a security
// boundary; do not read presence of a session as proof of who someone is.
//
// Membership is a join table (user <-> org <-> role), not a field on User,
// so a user can hold more than one membership (e.g. company at one org,
// partner at another) — required for real multi-org users later without a
// data migration.
//
// orgId values here are placeholder local ids, NOT CompanyStore/Organization
// ids — the Organization entity split (B5) hasn't happened yet, so there is
// no real org to reference. Not consumed by any UI yet.

(function () {
  if (window.EcosSession) return;

  const KEY = "ecosystemOS.session.v1";

  const USER = {
    id: "local-dev-user",
    email: "dev@local.ecos",
    displayName: "Local Dev",
    isOperator: true,
    status: "active",
  };

  // Seeded so an admin membership (ecosystem-wide, orgId null) and two
  // org-scoped memberships (company + partner, at different placeholder
  // orgs) coexist on the same user — proves the multi-membership shape.
  const MEMBERSHIPS = [
    { id: "mem_admin", userId: USER.id, orgId: null, roleKey: "admin", status: "active" },
    { id: "mem_company", userId: USER.id, orgId: "demo-org-company", roleKey: "company", status: "active" },
    { id: "mem_partner", userId: USER.id, orgId: "demo-org-partner", roleKey: "partner", status: "active" },
  ];

  const listeners = new Set();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getUser() {
    return clone(USER);
  }

  function getMemberships() {
    return clone(MEMBERSHIPS);
  }

  function getMembership(id) {
    const found = MEMBERSHIPS.find((m) => m.id === id);
    return found ? clone(found) : null;
  }

  function getMembershipsForUser(userId) {
    return MEMBERSHIPS.filter((m) => m.userId === userId).map(clone);
  }

  function readActiveMembershipId() {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const id = parsed && typeof parsed.activeMembershipId === "string" ? parsed.activeMembershipId : null;
      return id && MEMBERSHIPS.some((m) => m.id === id) ? id : MEMBERSHIPS[0].id;
    } catch (err) {
      return MEMBERSHIPS[0].id;
    }
  }

  let activeMembershipId = readActiveMembershipId();

  function persist() {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify({ activeMembershipId }));
    } catch (err) {
      // sessionStorage unavailable (private mode / disabled) — in-memory only.
    }
  }

  function emit() {
    const snapshot = getActiveMembership();
    listeners.forEach((fn) => {
      try { fn(snapshot); } catch (err) { /* listener errors never break the switch */ }
    });
  }

  function getActiveMembershipId() {
    return activeMembershipId;
  }

  // Validated against the seeded membership table on purpose — unlike
  // EcosPerspective.setActingCompanyId (deliberately unvalidated, presentation
  // only), a session's active membership must always resolve to a real row.
  function setActiveMembershipId(id) {
    if (!MEMBERSHIPS.some((m) => m.id === id)) return getActiveMembership();
    activeMembershipId = id;
    persist();
    emit();
    return getActiveMembership();
  }

  function getActiveMembership() {
    return getMembership(activeMembershipId);
  }

  function getActiveOrgId() {
    const membership = getActiveMembership();
    return membership ? membership.orgId : null;
  }

  function getActiveRoleKey() {
    const membership = getActiveMembership();
    return membership ? membership.roleKey : null;
  }

  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }

  window.EcosSession = {
    key: KEY,
    getUser,
    getMemberships,
    getMembership,
    getMembershipsForUser,
    getActiveMembershipId,
    setActiveMembershipId,
    getActiveMembership,
    getActiveOrgId,
    getActiveRoleKey,
    subscribe,
  };
})();
