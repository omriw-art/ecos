// ecos — read-only Organization / OrganizationProfile projection (v1).
//
// This is NOT a storage split, NOT a schema migration, NOT backend work.
// CompanyStore's flat company record stays the single source of truth on
// disk, in getCompanies()/saveCompanies(), and in import/export — this
// service only offers two narrower *views* over that same record, for
// callers that want to reason about "who this organization is" separately
// from "what this organization's profile says" without touching storage.
//
// spaceSegment is classified as OrganizationProfile, not Organization:
// it's segmentation/profile content (like sectors or capabilities), not
// stable tenant identity.

(function () {
  if (window.OrganizationProfile) return;

  const ORGANIZATION_FIELDS = [
    "id", "name", "country", "flag", "hq", "website", "organizationType", "founded",
  ];

  const PROFILE_FIELDS = [
    "blurb", "stage", "size", "sectors", "spaceSegment", "tech", "capabilities",
    "tags", "solutions", "offers", "needs", "fundingM", "score", "readiness",
    "strategic", "customers", "partners", "overlap",
  ];

  // Copies each named field onto a new object — never the source record —
  // and shallow-clones array values so mutating the projection's arrays
  // can never leak back into the record CompanyStore still owns.
  function pick(record, fields) {
    const out = {};
    fields.forEach((field) => {
      const value = record ? record[field] : undefined;
      out[field] = Array.isArray(value) ? value.slice() : value;
    });
    return out;
  }

  function toOrganization(record) {
    return pick(record, ORGANIZATION_FIELDS);
  }

  function toOrganizationProfile(record) {
    const profile = pick(record, PROFILE_FIELDS);
    profile.orgId = record ? record.id : undefined;
    return profile;
  }

  function toOrganizationWithProfile(record) {
    return {
      organization: toOrganization(record),
      profile: toOrganizationProfile(record),
    };
  }

  window.OrganizationProfile = {
    toOrganization,
    toOrganizationProfile,
    toOrganizationWithProfile,
  };
})();
