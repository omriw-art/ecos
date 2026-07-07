// ecos — local browser persistence for admin-created needs/opportunities.
// Organization-submitted needs still live in organization.needs (unchanged,
// see company-store.js) — this store only holds needs/opportunities that are
// NOT tied to a specific organization ("internal" / "opportunity" source
// types), so the two never duplicate or drift against each other.

(function () {
  const STORAGE_KEY = "ecosystemOS.adminNeeds.v1";

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  const SOURCE_TYPES = ["internal", "organization", "opportunity"];
  const NEED_TYPES = ["pilot", "customer", "funding", "technology", "data", "regulation", "partner", "research", "other"];
  const PRIORITIES = ["high", "medium", "low"];
  const STATUSES = ["new", "reviewing", "matching", "in-progress"];

  function slugify(value) {
    const base = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "need";
  }

  function uniqueId(title, needs) {
    const ids = new Set(asArray(needs).map((n) => n.id));
    let id = `need_${slugify(title)}_${Date.now().toString(36)}`;
    let i = 2;
    while (ids.has(id)) {
      id = `need_${slugify(title)}_${Date.now().toString(36)}_${i}`;
      i += 1;
    }
    return id;
  }

  function normalizeNeed(input, existing) {
    const source = Object.assign({}, existing || {}, input || {});
    return Object.assign({}, source, {
      id: text(source.id),
      title: text(source.title),
      description: text(source.description),
      sourceType: SOURCE_TYPES.includes(source.sourceType) ? source.sourceType : "internal",
      sourceOrganizationId: text(source.sourceOrganizationId) || null,
      spaceSegment: text(source.spaceSegment) || "other",
      needType: NEED_TYPES.includes(source.needType) ? source.needType : "other",
      priority: PRIORITIES.includes(source.priority) ? source.priority : "medium",
      status: STATUSES.includes(source.status) ? source.status : "new",
      createdAt: text(source.createdAt) || new Date().toISOString(),
    });
  }

  function readNeeds() {
    try {
      const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("NeedsStore: failed to read admin needs", err);
      return [];
    }
  }

  function saveNeeds(needs) {
    const normalized = asArray(needs).map((n) => normalizeNeed(n));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {
      console.warn("NeedsStore: failed to save admin needs", err);
    }
    return normalized;
  }

  function getNeeds() {
    return readNeeds().map((n) => normalizeNeed(n));
  }

  function createNeed(input) {
    const needs = getNeeds();
    const need = normalizeNeed(Object.assign({}, input, {
      id: uniqueId(input && input.title, needs),
      createdAt: new Date().toISOString(),
    }));
    saveNeeds([need, ...needs]);
    return need;
  }

  function updateNeed(id, patch) {
    const needs = getNeeds();
    const index = needs.findIndex((n) => n.id === id);
    if (index < 0) return null;
    const updated = normalizeNeed(patch, needs[index]);
    updated.id = needs[index].id;
    const next = needs.slice();
    next[index] = updated;
    saveNeeds(next);
    return updated;
  }

  function deleteNeed(id) {
    const needs = getNeeds();
    const next = needs.filter((n) => n.id !== id);
    saveNeeds(next);
    return next;
  }

  function getLocalCompanies() {
    if (window.CompanyStore && typeof window.CompanyStore.getCompanies === "function") {
      return window.CompanyStore.getCompanies();
    }
    return window.COMPANIES || [];
  }

  // Unified view of both need sources — organization.needs (unchanged, still
  // read-only here) and this store's admin-created needs/opportunities.
  // Used by the dashboard so it never has to duplicate the flattening logic.
  function listNeeds() {
    const items = [];
    asArray(getLocalCompanies()).forEach((c) => {
      asArray(c.needs).forEach((rawNeed, idx) => {
        const title = (typeof rawNeed === "string" ? rawNeed : text(rawNeed && rawNeed.text)).trim();
        if (!title) return;
        items.push({
          id: `${c.id}::${idx}`,
          kind: "organization",
          title,
          sourceLabel: "צורך של ארגון",
          sourceOrgId: c.id,
          sourceOrgName: c.name,
          spaceSegment: c.spaceSegment || "other",
          needType: null,
          priority: null,
          status: "new",
          createdAt: null,
        });
      });
    });
    getNeeds().forEach((n) => {
      items.push({
        id: n.id,
        kind: "admin",
        title: n.title,
        sourceLabel: n.sourceType === "opportunity" ? "הזדמנות שזוהתה" : "צורך פנימי",
        sourceOrgId: n.sourceOrganizationId,
        sourceOrgName: null,
        spaceSegment: n.spaceSegment,
        needType: n.needType,
        priority: n.priority,
        status: n.status,
        createdAt: n.createdAt,
      });
    });
    return items;
  }

  // Simple real-data counts for the dashboard — no invented metrics.
  function getNeedStats() {
    const all = listNeeds();
    return {
      openTotal: all.length,
      highPriority: all.filter((n) => n.priority === "high").length,
      opportunities: all.filter((n) => n.sourceLabel === "הזדמנות שזוהתה").length,
      inProgress: all.filter((n) => n.kind === "admin" && n.status && n.status !== "new").length,
    };
  }

  window.NeedsStore = {
    key: STORAGE_KEY,
    SOURCE_TYPES,
    NEED_TYPES,
    PRIORITIES,
    STATUSES,
    getNeeds,
    saveNeeds,
    createNeed,
    updateNeed,
    deleteNeed,
    normalizeNeed,
    listNeeds,
    getNeedStats,
  };
})();
