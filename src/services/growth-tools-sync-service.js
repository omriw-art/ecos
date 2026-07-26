// ecos — Growth Tools sync foundation (G3A infrastructure only).
//
// Conceptual pipeline this file exists to support:
//
//   official provider → provider adapter (growth-tools-adapters.js)
//     → GrowthToolsSyncService.validateCandidate
//     → GrowthToolsSyncService.normalizeCandidate
//     → GrowthToolsSyncService.diffCandidate
//     → (future) Admin review queue — not built in G3A
//     → GrowthToolsSyncService.applyMerge (only for an APPROVED diff)
//     → generated Growth Tools source data → GrowthToolsStore → UI/matching
//
// Nothing in this file is wired into GrowthToolsStore, the UI, or any
// automatic production mutation. Every function here is pure (no I/O, no
// localStorage, no network, no mutation of its inputs) and Node-testable —
// see scripts/test-growth-tools-sync.js. It follows the same "window.X"
// IIFE convention as every other src/services/*.js file so it can later be
// added to ecos.html's script list with no rewrite, exactly like
// GrowthToolsAdapters.
//
// ---------------------------------------------------------------------
// MANAGED vs SOURCE-OWNED — the field-ownership boundary this whole file
// exists to protect. A sync candidate may only ever propose a change to a
// SOURCE_OWNED_FIELD; anything else is rejected by validateCandidate, and
// applyMerge structurally cannot touch a managed field (see its code).
// ---------------------------------------------------------------------
//   MANAGED (Ecosystem OS-curated; sync may never change these):
//     id, name, provider, division, type, purposes, stages, domains,
//     description, benefit, eligibility
//   SOURCE-OWNED (a sync candidate may propose changes to these):
//     status, deadline, applicationUrl, officialName,
//     source.url, source.externalId, lastSyncedAt, syncStatus
//
// `officialName` (added to GrowthToolsStore's normalize() in this same
// batch, defaulting to null) is deliberately separate from the curated
// `name`/`title` shown on cards — sync may propose/track the provider's own
// display name without ever silently renaming what the UI shows.
//
// `syncStatus` describes the last SYNCHRONIZATION ATTEMPT ("never" | "ok" |
// "stale" | "error") — it is never a substitute for, and must never be
// confused with, the Growth Tool's own `status` field (whether the program
// itself is open/closed).
//
// "Absence of evidence ≠ deletion": if a candidate's field is null/absent,
// diffCandidate treats it as "no signal from this fetch" and leaves the
// current value alone — it never proposes clearing a previously-known
// value. Actually clearing a field is intentionally NOT supported by this
// version of diffCandidate/applyMerge; it would need an explicit sentinel
// (e.g. `{ __clear: true }`) that a future batch can add deliberately.

(function () {
  if (window.GrowthToolsSyncService) return;

  const MANAGED_FIELDS = [
    "id", "name", "provider", "division", "type", "purposes", "stages",
    "domains", "description", "benefit", "eligibility",
  ];
  const SOURCE_OWNED_FIELDS = [
    "status", "deadline", "applicationUrl", "officialName",
    "source.url", "source.externalId", "lastSyncedAt", "syncStatus",
  ];

  // Minimal, defensible accepted vocabulary for GrowthTool.status. Anything
  // else is rejected rather than silently accepted — expand this list only
  // when a real provider's own vocabulary requires it, never speculatively.
  const STATUS_VALUES = ["open", "closed"];
  const SYNC_STATUS_VALUES = ["never", "ok", "stale", "error"];

  function isPresent(value) {
    return value !== null && value !== undefined;
  }

  function isValidUrl(value) {
    try {
      new URL(value);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Strict YYYY-MM-DD only — no timezone, no end-of-day, no Hebrew
  // calendar conversion, no "soon"/relative-date guessing. If a source
  // doesn't supply an exact date in this shape, the candidate's deadline
  // must be left null rather than approximated.
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function isValidIsoDate(value) {
    if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
    const parsed = new Date(value + "T00:00:00.000Z");
    return !Number.isNaN(parsed.getTime());
  }

  // --- Candidate shape --------------------------------------------------
  //
  // { toolId, providerId, externalId, officialName, status, deadline,
  //   applicationUrl, sourceUrl, fetchedAt, rawSourceFingerprint }
  //
  // Every field but toolId is optional/nullable. normalizeCandidate() fills
  // in any missing optional field with null so downstream code never has to
  // distinguish "undefined" from "null" — both mean "no signal".
  const CANDIDATE_FIELDS = [
    "toolId", "providerId", "externalId", "officialName", "status",
    "deadline", "applicationUrl", "sourceUrl", "fetchedAt", "rawSourceFingerprint",
  ];

  function normalizeCandidate(raw) {
    const candidate = {};
    CANDIDATE_FIELDS.forEach((key) => {
      candidate[key] = isPresent(raw && raw[key]) ? raw[key] : null;
    });
    return candidate;
  }

  // Validates a RAW adapter candidate (before normalizeCandidate trims it
  // to the whitelisted shape above) against the currently-known canonical
  // tool. Deliberately runs pre-trim so an adapter that tries to sneak a
  // managed field (e.g. `type`, `purposes`) onto its candidate is caught
  // and reported, not silently dropped.
  //
  // Returns { valid, errors, warnings }. Unknown/absent optional fields are
  // always valid — only a present-but-malformed or present-but-disallowed
  // value is an error.
  function validateCandidate(rawCandidate, currentTool) {
    const errors = [];
    const warnings = [];

    if (!rawCandidate || typeof rawCandidate !== "object") {
      return { valid: false, errors: ["candidate is not an object"], warnings };
    }

    MANAGED_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(rawCandidate, field)) {
        errors.push(`candidate attempts to update managed field "${field}"`);
      }
    });

    if (!rawCandidate.toolId) {
      errors.push("candidate is missing toolId");
    } else if (!currentTool) {
      errors.push(`toolId does not resolve to a known Growth Tool: ${rawCandidate.toolId}`);
    }

    if (currentTool && isPresent(rawCandidate.providerId)) {
      // currentTool.providerId — the real provider id GrowthToolsStore keeps
      // alongside its flattened display-string `provider` field (see
      // growth-tools-store.js's normalize()).
      if (rawCandidate.providerId !== currentTool.providerId) {
        errors.push(`provider mismatch: candidate says "${rawCandidate.providerId}", tool belongs to "${currentTool.providerId}"`);
      }
    }

    if (isPresent(rawCandidate.status) && STATUS_VALUES.indexOf(rawCandidate.status) === -1) {
      errors.push(`status "${rawCandidate.status}" is outside the accepted vocabulary (${STATUS_VALUES.join(", ")})`);
    }

    if (isPresent(rawCandidate.deadline) && !isValidIsoDate(rawCandidate.deadline)) {
      errors.push(`deadline "${rawCandidate.deadline}" is not a safely parseable ISO date (expected YYYY-MM-DD)`);
    }

    if (isPresent(rawCandidate.applicationUrl) && !isValidUrl(rawCandidate.applicationUrl)) {
      errors.push(`applicationUrl "${rawCandidate.applicationUrl}" is not a valid URL`);
    }

    if (isPresent(rawCandidate.sourceUrl) && !isValidUrl(rawCandidate.sourceUrl)) {
      errors.push(`sourceUrl "${rawCandidate.sourceUrl}" is not a valid URL`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // --- Diff --------------------------------------------------------------
  //
  // Pure comparison of the current canonical tool against a normalized
  // candidate. Only ever inspects/reports SOURCE_OWNED_FIELDS. A
  // null/absent candidate value is always "unchanged" (never a proposed
  // deletion) — see the file header.
  function diffCandidate(currentTool, candidate) {
    const changes = {};
    const unchanged = [];
    const warnings = [];

    function compare(key, currentValue, candidateValue) {
      if (!isPresent(candidateValue)) { unchanged.push(key); return; }
      if (candidateValue === currentValue) { unchanged.push(key); return; }
      changes[key] = { from: isPresent(currentValue) ? currentValue : null, to: candidateValue };
    }

    compare("status", currentTool.status, candidate.status);
    compare("deadline", currentTool.deadline, candidate.deadline);
    compare("applicationUrl", currentTool.applicationUrl, candidate.applicationUrl);
    compare("officialName", currentTool.officialName, candidate.officialName);
    compare("source.url", currentTool.source && currentTool.source.url, candidate.sourceUrl);
    compare("source.externalId", currentTool.source && currentTool.source.externalId, candidate.externalId);

    return { toolId: currentTool.id, changes, unchanged, warnings };
  }

  // --- Merge ---------------------------------------------------------------
  //
  // Produces a NEW tool object from an APPROVED diff — never mutates
  // currentTool. Only ever writes the SOURCE_OWNED_FIELDS keys diffCandidate
  // can possibly produce, so every managed field is structurally guaranteed
  // to survive unchanged (it's carried over by the initial shallow copy and
  // never touched again below). G3A does not call this automatically from
  // any UI or store — it exists so a future Admin "approve" action has a
  // safe, tested function to call.
  function applyMerge(currentTool, diff, options) {
    const opts = Object.assign({ syncStatus: "ok", syncedAt: null }, options || {});
    const next = Object.assign({}, currentTool);
    const changes = (diff && diff.changes) || {};

    if (changes.status) next.status = changes.status.to;
    if (changes.deadline) next.deadline = changes.deadline.to;
    if (changes.applicationUrl) next.applicationUrl = changes.applicationUrl.to;
    if (changes.officialName) next.officialName = changes.officialName.to;
    if (changes["source.url"] || changes["source.externalId"]) {
      next.source = Object.assign({}, currentTool.source);
      if (changes["source.url"]) next.source.url = changes["source.url"].to;
      if (changes["source.externalId"]) next.source.externalId = changes["source.externalId"].to;
    }

    if (SYNC_STATUS_VALUES.indexOf(opts.syncStatus) !== -1) next.syncStatus = opts.syncStatus;
    next.lastSyncedAt = opts.syncedAt || next.lastSyncedAt;

    return next;
  }

  window.GrowthToolsSyncService = {
    MANAGED_FIELDS,
    SOURCE_OWNED_FIELDS,
    STATUS_VALUES,
    SYNC_STATUS_VALUES,
    isValidUrl,
    isValidIsoDate,
    normalizeCandidate,
    validateCandidate,
    diffCandidate,
    applyMerge,
  };
})();
