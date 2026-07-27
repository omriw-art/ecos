// ecos — local browser persistence for company records.
// Keeps the static seed data as the default and overlays localStorage edits.

(function () {
  const STORAGE_KEY = "ecosystemOS.companies.v1";
  const LEGACY_STORAGE_KEY = "ecos_companies";

  const clone = (value) => JSON.parse(JSON.stringify(value || []));
  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const hasOwn = (value, key) => !!value && Object.prototype.hasOwnProperty.call(value, key);

  function sectorFallback(input) {
    const sectors = asArray(input.sectors).filter(Boolean);
    if (sectors.length) return sectors;
    const sector = text(input.sector);
    return sector ? [sector] : ["earth-obs"];
  }

  function slugify(value) {
    const base = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "company";
  }

  function normalizeName(value) {
    return text(value).toLowerCase().replace(/\s+/g, " ");
  }

  function findCompanyByName(name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) return null;
    return getCompanies().find((company) => normalizeName(company.name) === normalizedName) || null;
  }

  function uniqueId(name, companies) {
    const ids = new Set(asArray(companies).map((c) => c.id));
    const base = slugify(name);
    let id = `${base}-${Date.now().toString(36)}`;
    let i = 2;
    while (ids.has(id)) {
      id = `${base}-${Date.now().toString(36)}-${i}`;
      i += 1;
    }
    return id;
  }

  function normalizeCompany(input, existing) {
    const source = Object.assign({}, existing || {}, input || {});
    const sectors = sectorFallback(source);
    const offers = asArray(source.offers);
    const needs = asArray(source.needs);
    const tags = asArray(source.tags);
    let capabilitySource;
    if (hasOwn(input, "capabilities")) capabilitySource = input.capabilities;
    else if (hasOwn(input, "tech")) capabilitySource = input.tech;
    else if (hasOwn(source, "capabilities")) capabilitySource = source.capabilities;
    else capabilitySource = source.tech || source.solutions || source.tags;
    const capabilities = asArray(capabilitySource).filter(Boolean);

    // Controlled Company Taxonomies v1 — tech ("technologies") used to be
    // force-mirrored from capabilities on every normalize (tech was purely a
    // legacy alias). It's now an independent controlled bank one level more
    // specific than capabilities (see org-classification-registry.js), so an
    // explicit tech value — from the Admin technologies picker or the CSV
    // importer's `tech` column — must win on its own, not get overwritten by
    // whatever capabilities happens to be. Only mirrors capabilities as a
    // last-resort fallback when tech has never been explicitly set by this
    // call or any previous one (new records, and every pre-existing caller
    // that only ever wrote `capabilities`) — identical output to the old
    // forced mirror in that one case, so no stored record's shape changes.
    let techSource;
    if (hasOwn(input, "tech")) techSource = input.tech;
    else if (hasOwn(source, "tech")) techSource = source.tech;
    else techSource = capabilities;
    const tech = asArray(techSource).filter(Boolean);

    return Object.assign({}, source, {
      id: text(source.id),
      name: text(source.name || source.companyName),
      country: text(source.country) || "Israel",
      flag: text(source.flag) || "🇮🇱",
      hq: text(source.hq || source.location) || "ישראל",
      stage: text(source.stage) || "Seed",
      size: text(source.size || source.employees) || "1-10",
      founded: Number(source.founded) || new Date().getFullYear(),
      fundingM: Number(source.fundingM) || 0,
      score: Number(source.score) || 50,
      strategic: source.strategic === true,
      readiness: text(source.readiness) || "Mapped",
      // Directory presence vs platform membership (Directory/Membership v1).
      // Independent of readiness/stage on purpose — readiness describes
      // ecosystem/profile state (a curation judgment), not whether an actual
      // company-side account has joined. Every record defaults to
      // "unclaimed" (directory-only: known/mapped, no active ownership)
      // unless explicitly created as "claimed" (today, only
      // SubmissionStore.toCompanyInput does this — an approved public
      // submission is the one real "join" event in this local demo).
      // Self-asserted client-local metadata like EcosOwnership's fields —
      // never a security/auth signal, never wired into EcosAuthz.
      membershipStatus: source.membershipStatus === "claimed" ? "claimed" : "unclaimed",
      organizationType: text(source.organizationType) || "other",
      spaceSegment: text(source.spaceSegment) || "other",
      sectors,
      tech,
      capabilities,
      tags,
      solutions: asArray(source.solutions),
      offers,
      needs,
      customers: asArray(source.customers),
      partners: asArray(source.partners),
      overlap: asArray(source.overlap),
      blurb: text(source.blurb || source.description || source.summary),
      website: text(source.website),
      logoUrl: text(source.logoUrl || source.logo),
    });
  }

  function readStoredCompanies() {
    const parsed = window.EcosLocalAdapter.readSync(STORAGE_KEY, null);
    if (Array.isArray(parsed)) return parsed;

    const legacy = window.EcosLocalAdapter.readSync(LEGACY_STORAGE_KEY, null);
    if (!Array.isArray(legacy)) return null;

    const migrated = legacy.map((company) => normalizeCompany(company));
    writeStoredCompanies(migrated);
    return migrated;
  }

  function writeStoredCompanies(companies) {
    if (!window.EcosLocalAdapter.writeSync(STORAGE_KEY, companies)) {
      throw new Error("CompanyStore: failed to persist companies");
    }
  }

  // Captured once, before window.COMPANIES is overwritten below with stored/
  // saved data — seedCompanies() must always read the original seed, never
  // whatever window.COMPANIES currently holds.
  const SEED_COMPANIES = clone(window.COMPANIES || []);

  function seedCompanies() {
    return clone(SEED_COMPANIES).map((c) => normalizeCompany(c));
  }

  function getCompanies() {
    const stored = readStoredCompanies();
    return (stored || seedCompanies()).map((c) => normalizeCompany(c));
  }

  function saveCompanies(companies) {
    const normalized = asArray(companies).map((c) => normalizeCompany(c));
    writeStoredCompanies(normalized);
    window.COMPANIES = normalized;
    return normalized;
  }

  function createCompany(input) {
    const companies = getCompanies();
    const company = normalizeCompany(Object.assign({}, input, {
      id: uniqueId(input && input.name, companies),
    }));
    saveCompanies([company, ...companies]);
    return company;
  }

  function updateCompany(id, patch) {
    const companies = getCompanies();
    const index = companies.findIndex((c) => c.id === id);
    if (index < 0) return null;
    const updated = normalizeCompany(patch, companies[index]);
    updated.id = companies[index].id;
    const next = companies.slice();
    next[index] = updated;
    saveCompanies(next);
    return updated;
  }

  // Directory/Membership v1 — status-only claim: flips an existing
  // directory-only company to "claimed" without touching any other field.
  // Used when a public join submission matches an existing directory
  // company by exact name (see SubmissionStore/OnboardView) instead of
  // creating a duplicate record. Deliberately does NOT merge/overwrite the
  // directory profile's fields with the submission's — which of the two
  // field sets should win is a real product decision, left for a later
  // batch (see commit notes); this only changes membershipStatus.
  function claimCompany(id) {
    return updateCompany(id, { membershipStatus: "claimed" });
  }

  function isClaimed(company) {
    return !!(company && company.membershipStatus === "claimed");
  }

  function resetCompaniesToSeed() {
    window.EcosLocalAdapter.removeSync(STORAGE_KEY);
    const seeded = seedCompanies();
    window.COMPANIES = seeded;
    return seeded;
  }

  window.CompanyStore = {
    key: STORAGE_KEY,
    getCompanies,
    saveCompanies,
    createCompany,
    updateCompany,
    claimCompany,
    isClaimed,
    resetCompaniesToSeed,
    normalizeCompany,
    normalizeName,
    findCompanyByName,
    // Stable-reference read (same object window.COMPANIES's getter returns) for callers
    // that memoize on array identity, unlike getCompanies() which always re-reads/re-normalizes.
    getCachedCompanies,
  };

  // window.COMPANIES is a cached accessor, not a plain property: the getter
  // always returns the same reference (no re-normalization per access, so a
  // React dep array like [window.COMPANIES] doesn't churn every render) and
  // the setter just swaps that reference — it mirrors the old plain-
  // assignment semantics (e.g. app.jsx's state-mirror effect) and never
  // persists on its own. saveCompanies (:109) and resetCompaniesToSeed (:142)
  // already assign window.COMPANIES; those assignments now pass through this
  // setter unchanged, since defineProperty runs before either can be called.
  let companiesCache;
  Object.defineProperty(window, "COMPANIES", {
    configurable: true,
    enumerable: true,
    get() { return companiesCache; },
    set(value) { companiesCache = asArray(value); },
  });

  function getCachedCompanies() { return companiesCache; }

  window.COMPANIES = getCompanies();
})();
