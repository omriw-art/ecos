// ecos — controlled option banks for organization classification fields:
// capabilities, technologies, needs (Controlled Company Taxonomies v1).
//
// Distinct from window.TaxonomyStore (src/services/taxonomy-store.js), which
// governs the Needs Board's Need entity fields (spaceSegment/needType/
// priority/status) — a different concept at a different granularity, and
// explicitly not to be merged with this registry. This registry governs
// what an organization's own capabilities/technologies/needs ARE, not how a
// Needs Board entry about them is categorized.
//
// Read-only in this batch — like window.SECTORS/ORGANIZATION_TYPES/
// SPACE_SEGMENTS/CapabilityRegistry, these banks are static, curated data,
// not admin-editable yet. TaxonomyStore's admin-editable pattern exists for
// a different concept; if/when these banks need the same "Admin/Super Admin
// manages approved values" governance, that's additive work for a later
// batch, not a reason to bolt onto TaxonomyStore now.
//
// Bootstrapped from real, already-authored project data rather than an
// invented ontology:
//   - capabilities: derived live from window.CapabilityRegistry's 13 canonical
//     capability definitions (same ids/labels — no parallel copy, no drift).
//   - technologies: derived live from those same capability definitions'
//     `examples` arrays (39 specific, already-curated technology terms) —
//     one level more specific than "capabilities", e.g. capability "comms"
//     ("תקשורת לוויינית") examples into technologies "Phased Array Antenna",
//     "Ka/Ku Band", "LEO Broadband".
//   - needs: snapshotted from SUGGESTIONS_NEEDS in
//     src/modules/onboarding/join-app.jsx (real, product-authored example
//     needs shown in the public join flow's need picker) — copied rather than
//     referenced live because join-app.jsx only loads on join.html, not
//     ecos.html, so there is no shared runtime to reference. If onboarding
//     migrates to this registry in a later batch (Step 8), that copy becomes
//     the single source and this snapshot note can go.

(function () {
  if (window.OrgClassificationRegistry) return;

  const BANK_KEYS = ["capabilities", "technologies", "needs"];

  const text = (value) => typeof value === "string" ? value.trim() : "";
  const asArray = (value) => Array.isArray(value) ? value : [];

  function slugify(value) {
    const base = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "value";
  }

  // Real, already-authored need examples from the public join flow's
  // SUGGESTIONS_NEEDS (src/modules/onboarding/join-app.jsx) — see file-level
  // note. Kept verbatim, no merging of distinct phrases.
  const NEEDS_SEED_LABELS = [
    "שותף הפצה ב-EU",
    "Anchor customer",
    "גישה ל-Ground Network",
    "פיילוט עם משרד הביטחון",
    "פלטפורמת AI ל-Edge",
    "Lead investor — Series A",
    "מסלולים ל-LEO",
    "שותף לפיתוח משותף",
  ];

  function buildCapabilitiesBank() {
    const registry = window.CapabilityRegistry;
    if (!registry || typeof registry.getAllCapabilities !== "function") return [];
    return registry.getAllCapabilities().map((cap) => ({
      id: cap.id,
      label: cap.name,
      status: "approved",
    }));
  }

  function buildTechnologiesBank() {
    const registry = window.CapabilityRegistry;
    if (!registry || typeof registry.getAllCapabilities !== "function") return [];
    const seenIds = new Set();
    const bank = [];
    registry.getAllCapabilities().forEach((cap) => {
      asArray(cap.examples).forEach((example) => {
        const label = text(example);
        if (!label) return;
        let id = slugify(label);
        if (seenIds.has(id)) id = `${id}-${slugify(cap.id)}`; // defensive; no collisions in practice (verified 39/39 unique)
        if (seenIds.has(id)) return;
        seenIds.add(id);
        bank.push({ id, label, status: "approved", parentCapabilityId: cap.id });
      });
    });
    return bank;
  }

  function buildNeedsBank() {
    const seenIds = new Set();
    return NEEDS_SEED_LABELS.map((label) => {
      let id = slugify(label);
      if (seenIds.has(id)) id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
      seenIds.add(id);
      return { id, label: text(label), status: "approved" };
    });
  }

  const BUILDERS = {
    capabilities: buildCapabilitiesBank,
    technologies: buildTechnologiesBank,
    needs: buildNeedsBank,
  };

  // Built lazily (not at IIFE-eval time) so load order relative to
  // capability-registry.js doesn't matter as long as it's loaded before
  // first use — matches how window.COMPANIES-dependent code elsewhere in
  // this codebase reads globals on demand rather than caching at eval time.
  function getBank(key) {
    const builder = BUILDERS[key];
    return builder ? builder() : [];
  }

  function getOption(key, id) {
    const normalizedId = text(id);
    if (!normalizedId) return null;
    return getBank(key).find((o) => o.id === normalizedId) || null;
  }

  function isKnownId(key, id) {
    return !!getOption(key, id);
  }

  // Never throws, never blanks a value: unknown ids/legacy free-text values
  // pass through unchanged so callers (Admin UI legacy-value display, match
  // engine label resolution) can treat known and unknown values uniformly.
  function labelFor(key, id) {
    const option = getOption(key, id);
    return option ? option.label : text(id);
  }

  function resolveLabels(key, values) {
    return asArray(values).map((v) => labelFor(key, v));
  }

  window.OrgClassificationRegistry = {
    BANK_KEYS,
    getBank,
    getOption,
    isKnownId,
    labelFor,
    resolveLabels,
  };
})();
