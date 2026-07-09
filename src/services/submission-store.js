// ecos — local browser persistence for public join submissions.

(function () {
  const STORAGE_KEY = "ecosystemOS.pendingSubmissions.v1";

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  function slugify(value) {
    const base = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "submission";
  }

  function uniqueId(name, submissions) {
    const ids = new Set(asArray(submissions).map((s) => s.id));
    let id = `${slugify(name)}-${Date.now().toString(36)}`;
    let i = 2;
    while (ids.has(id)) {
      id = `${slugify(name)}-${Date.now().toString(36)}-${i}`;
      i += 1;
    }
    return id;
  }

  function normalizeSubmission(input, existing) {
    const source = Object.assign({}, existing || {}, input || {});
    const sectors = asArray(source.sectors).filter(Boolean);
    const sector = text(source.sector) || sectors[0] || "earth-obs";
    const contact = source.contact || {};

    return Object.assign({}, source, {
      id: text(source.id),
      createdAt: text(source.createdAt) || new Date().toISOString(),
      reviewedAt: text(source.reviewedAt),
      status: ["pending", "approved", "rejected"].includes(source.status) ? source.status : "pending",
      companyName: text(source.companyName || source.name),
      name: text(source.companyName || source.name),
      sector,
      sectors: sectors.length ? sectors : [sector],
      blurb: text(source.blurb || source.description),
      description: text(source.description || source.blurb),
      location: text(source.location || source.hq),
      hq: text(source.hq || source.location),
      country: text(source.country) || "ישראל",
      website: text(source.website),
      stage: text(source.stage) || "Seed",
      offers: asArray(source.offers).filter(Boolean),
      needs: asArray(source.needs).filter(Boolean),
      capabilities: asArray(source.capabilities || source.tech || source.tags).filter(Boolean),
      tags: asArray(source.tags || source.capabilities || source.tech).filter(Boolean),
      contactName: text(source.contactName || contact.name),
      contactRole: text(source.contactRole || contact.role),
      email: text(source.email || contact.email),
      contact: {
        name: text(source.contactName || contact.name),
        role: text(source.contactRole || contact.role),
        email: text(source.email || contact.email),
      },
      approvedCompanyId: text(source.approvedCompanyId),
    });
  }

  function readSubmissions() {
    const parsed = window.EcosStorage.read(STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveSubmissions(submissions) {
    const normalized = asArray(submissions).map((s) => normalizeSubmission(s));
    window.EcosStorage.write(STORAGE_KEY, normalized);
    return normalized;
  }

  function getSubmissions() {
    return readSubmissions().map((s) => normalizeSubmission(s));
  }

  function getPendingSubmissions() {
    return getSubmissions().filter((s) => s.status === "pending");
  }

  function getSubmissionsByStatus(status) {
    return getSubmissions().filter((s) => s.status === status);
  }

  function getSubmissionCounts() {
    const submissions = getSubmissions();
    return {
      pending: submissions.filter((s) => s.status === "pending").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };
  }

  function createSubmission(input) {
    const submissions = getSubmissions();
    const submission = normalizeSubmission(Object.assign({}, input, {
      id: uniqueId(input && (input.companyName || input.name), submissions),
      createdAt: new Date().toISOString(),
      status: "pending",
    }));
    saveSubmissions([submission, ...submissions]);
    return submission;
  }

  function updateSubmission(id, patch) {
    const submissions = getSubmissions();
    const index = submissions.findIndex((s) => s.id === id);
    if (index < 0) return null;
    const updated = normalizeSubmission(patch, submissions[index]);
    updated.id = submissions[index].id;
    const next = submissions.slice();
    next[index] = updated;
    saveSubmissions(next);
    return updated;
  }

  function approveSubmission(id, companyId) {
    return updateSubmission(id, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      approvedCompanyId: companyId || "",
    });
  }

  function rejectSubmission(id) {
    return updateSubmission(id, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
    });
  }

  function clearSubmissions() {
    return saveSubmissions([]);
  }

  function toCompanyInput(submission) {
    const s = normalizeSubmission(submission);
    return {
      name: s.companyName,
      country: s.country,
      hq: s.location || s.hq,
      stage: s.stage,
      sectors: s.sectors,
      tech: s.capabilities,
      capabilities: s.capabilities,
      tags: s.tags,
      offers: s.offers,
      needs: s.needs,
      blurb: s.blurb,
      website: s.website,
      readiness: "Mapped",
      customers: [],
      partners: [],
      overlap: [],
    };
  }

  window.SubmissionStore = {
    key: STORAGE_KEY,
    getSubmissions,
    getPendingSubmissions,
    getSubmissionsByStatus,
    getSubmissionCounts,
    saveSubmissions,
    createSubmission,
    updateSubmission,
    approveSubmission,
    rejectSubmission,
    clearSubmissions,
    normalizeSubmission,
    toCompanyInput,
  };
})();
