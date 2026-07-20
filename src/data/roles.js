// ecos — local role/capability seed data. Scaffolding for the identity model
// (B2) — capability enforcement logic itself lives in authz.js (B3), this
// file only holds the static role -> capability-key list mapping.
// No backend, no real auth. Role keys intentionally match the existing
// EcosPerspective.PERSPECTIVES set (admin / company / partner).

(function () {
  if (window.EcosRoles) return;

  const ROLE_KEYS = ["admin", "company", "partner"];

  const ROLES = {
    admin: {
      key: "admin",
      label: "Ecosystem Admin",
      capabilities: [
        "org.view.all",
        "org.edit.any",
        "need.create.ecosystem",
        "opportunity.edit.any",
        "submission.review",
        "taxonomy.edit",
        "capability.edit",
        "export.all",
        "import.bulk",
        "audit.read.all",
      ],
    },
    company: {
      key: "company",
      label: "Company",
      capabilities: [
        "org.view.own",
        "org.edit.own",
        "need.create.own",
        "interest.mark",
        "interest.view.own",
        "export.own",
      ],
    },
    partner: {
      key: "partner",
      label: "Partner",
      capabilities: [
        "org.view.own",
        "org.edit.own",
        "need.create.own",
        "opportunity.publish.own",
        "opportunity.edit.own",
        "interest.view.aggregate",
        "export.own",
      ],
    },
  };

  // Operator is a flag on User, not a role row — but its capability set is
  // still expressed here so authz.js has one place to look up any role key.
  const OPERATOR_CAPABILITIES = [
    "demo.reset",
    "demo.restore",
    "view.as.any",
  ];

  window.EcosRoles = {
    ROLE_KEYS,
    ROLES,
    OPERATOR_CAPABILITIES,
  };
})();
