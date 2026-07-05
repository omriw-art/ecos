// ecos — local browser persistence for company records.
// Keeps the static seed data as the default and overlays localStorage edits.

(function () {
  const STORAGE_KEY = "ecosystemOS.companies.v1";

  const clone = (value) => JSON.parse(JSON.stringify(value || []));
  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

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
    const tech = asArray(source.tech);
    const offers = asArray(source.offers);
    const needs = asArray(source.needs);
    const tags = asArray(source.tags);
    const fallbackTech = tags.length ? tags : tech;

    return Object.assign({}, source, {
      id: text(source.id),
      name: text(source.name),
      country: text(source.country) || "Israel",
      flag: text(source.flag) || "🇮🇱",
      hq: text(source.hq || source.location) || "ישראל",
      stage: text(source.stage) || "Seed",
      size: text(source.size) || "1-10",
      founded: Number(source.founded) || new Date().getFullYear(),
      fundingM: Number(source.fundingM) || 0,
      score: Number(source.score) || 50,
      strategic: source.strategic === true,
      readiness: text(source.readiness) || "Mapped",
      sectors,
      tech: fallbackTech,
      offers,
      needs,
      customers: asArray(source.customers),
      partners: asArray(source.partners),
      overlap: asArray(source.overlap),
      blurb: text(source.blurb || source.description),
      website: text(source.website),
    });
  }

  function readStoredCompanies() {
    try {
      const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      console.warn("CompanyStore: failed to read local companies", err);
      return null;
    }
  }

  function writeStoredCompanies(companies) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch (err) {
      console.warn("CompanyStore: failed to save local companies", err);
    }
  }

  function seedCompanies() {
    return clone(window.COMPANIES || []).map((c) => normalizeCompany(c));
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

  function resetCompaniesToSeed() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("CompanyStore: failed to reset local companies", err);
    }
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
    resetCompaniesToSeed,
    normalizeCompany,
    normalizeName,
    findCompanyByName,
  };

  window.COMPANIES = getCompanies();
})();
