// ecos — capability check derived from org membership (Authorization Choke
// Point v1).
//
// IMPORTANT: this is client-side UX only, not real security. There is no
// backend, no server-verified session, and nothing here stops a user from
// editing localStorage/sessionStorage or calling a store function directly
// in DevTools. Treat every EcosAuthz.can() result as "should the UI offer
// this", never as "is this operation actually allowed" — that guarantee can
// only come from a server that owns the data. Real enforcement arrives only
// when store reads/writes are backed by a server that re-checks every
// capability itself.
//
// Not yet wired into any store read/write (that is later, scoped work) and
// does not hide UI yet — this batch only adds the choke point itself.

(function () {
  if (window.EcosAuthz) return;

  // The full capability vocabulary this app reasons about. Role -> capability
  // membership lives in EcosRoles (src/data/roles.js); this list exists so
  // typos are easy to catch and so every capability the product model in
  // CLAUDE.md names has exactly one canonical key.
  const CAPABILITIES = [
    "org.view.all",
    "org.view.own",
    "org.edit.own",
    "org.edit.any",
    "need.create.own",
    "need.create.ecosystem",
    "opportunity.publish.own",
    "opportunity.edit.own",
    "opportunity.edit.any",
    "interest.mark",
    "interest.view.own",
    "interest.view.aggregate",
    "submission.review",
    "taxonomy.edit",
    "capability.edit",
    "export.own",
    "export.all",
    "import.bulk",
    "demo.reset",
    "demo.restore",
    "view.as.any",
    "audit.read.all",
    "audit.read.own",
  ];

  function capabilitiesForRole(roleKey) {
    const roles = window.EcosRoles;
    if (!roles) return [];
    const role = roles.ROLES[roleKey];
    return role ? role.capabilities : [];
  }

  function operatorCapabilities() {
    const roles = window.EcosRoles;
    return (roles && Array.isArray(roles.OPERATOR_CAPABILITIES)) ? roles.OPERATOR_CAPABILITIES : [];
  }

  // ctx is currently unused by the capability lookup itself (no record-level
  // rules yet — e.g. "only the owning org may edit this opportunity" — that
  // arrives with B7 visibility filtering) but is accepted now so call sites
  // don't need to change shape when that lands.
  function can(capability, ctx) {
    const session = window.EcosSession;
    if (!session) return false;

    const user = session.getUser();
    if (user && user.isOperator && operatorCapabilities().indexOf(capability) !== -1) {
      return true;
    }

    const membership = session.getActiveMembership();
    if (!membership || membership.status !== "active") return false;

    return capabilitiesForRole(membership.roleKey).indexOf(capability) !== -1;
  }

  function capabilitiesForActiveMembership() {
    const session = window.EcosSession;
    if (!session) return [];
    const membership = session.getActiveMembership();
    if (!membership || membership.status !== "active") return [];
    return capabilitiesForRole(membership.roleKey).slice();
  }

  window.EcosAuthz = {
    CAPABILITIES,
    can,
    capabilitiesForActiveMembership,
  };
})();
