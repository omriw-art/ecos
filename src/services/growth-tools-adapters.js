// ecos — Growth Tools provider adapter registry (G3A infrastructure).
//
// An adapter is the ONLY place transport-specific code may live (API call,
// JSON fetch, RSS parse, HTML extraction, or a manual/fixture source). It
// must produce a transport-independent raw candidate — see
// growth-tools-sync-service.js for what happens to that candidate next
// (validate → normalize → diff → merge). GrowthToolsStore and the UI never
// see an adapter directly and never know which transport produced a value.
//
// Contract (all fields required on the adapter object; fetch/normalize are
// the only functions an adapter implements):
//   {
//     id: string,            // adapter instance id, e.g. "innovation-authority-manual"
//     providerId: string,    // must match a real GrowthTool's provider.id
//     sourceType: "api" | "json" | "rss" | "web" | "manual",
//     fetch(context) -> Promise<rawPayload>,   // no side effects beyond the read itself
//     normalize(rawPayload) -> rawCandidate[],  // synchronous, pure, no fabrication
//   }
//
// `fetch` is async by contract (a Promise) even for the manual fixture
// adapter below, so a future API/RSS/HTML adapter is a drop-in replacement
// with no change to any caller. G3A ships no adapter that performs a real
// network call — see the boundary note at the bottom of this file.
//
// `normalize`'s output is a "raw candidate": it may contain only the keys
// growth-tools-sync-service.js's normalizeCandidate()/validateCandidate()
// understand (toolId, providerId, externalId, officialName, status,
// deadline, applicationUrl, sourceUrl, fetchedAt, rawSourceFingerprint).
// An adapter must never invent a value it cannot support from its own
// source — omit the field (null/absent) instead.

(function () {
  if (window.GrowthToolsAdapters) return;

  const registry = new Map();

  // Registers (or replaces) an adapter by id. Last registration for a given
  // id wins — deliberately simple, no versioning, no throw-on-duplicate;
  // this is a dev-time registry, not a runtime plugin system.
  function register(adapter) {
    if (!adapter || typeof adapter.id !== "string" || !adapter.id) {
      throw new Error("GrowthToolsAdapters.register: adapter.id is required");
    }
    if (typeof adapter.fetch !== "function" || typeof adapter.normalize !== "function") {
      throw new Error("GrowthToolsAdapters.register: adapter must implement fetch() and normalize()");
    }
    registry.set(adapter.id, adapter);
    return adapter;
  }

  function get(id) {
    return registry.get(id) || null;
  }

  function list() {
    return Array.from(registry.values());
  }

  function byProvider(providerId) {
    return list().filter((a) => a.providerId === providerId);
  }

  // --- One inert manual fixture adapter, for testing the pipeline only --
  //
  // sourceType "manual" — no network call, no HTML/API/RSS parsing. Its
  // fetch() resolves a small hardcoded payload synchronously wrapped in a
  // Promise (matching the async contract every real adapter will follow).
  // This exists purely so growth-tools-sync-service.js's fixtures/tests
  // have one concrete, registrable adapter to exercise end-to-end without
  // requiring a live provider. It is NOT wired to any real Growth Tool
  // update path.
  const manualFixtureAdapter = {
    id: "manual-fixture",
    providerId: "innovation-authority",
    sourceType: "manual",
    fetch() {
      return Promise.resolve([
        { toolId: "gt-iia-preseed", status: "open", deadline: "2026-09-30", fetchedAt: "2026-07-26T00:00:00.000Z" },
      ]);
    },
    normalize(rawPayload) {
      return (rawPayload || []).map((row) => ({
        toolId: row.toolId || null,
        providerId: "innovation-authority",
        externalId: row.externalId || null,
        officialName: row.officialName || null,
        status: row.status || null,
        deadline: row.deadline || null,
        applicationUrl: row.applicationUrl || null,
        sourceUrl: row.sourceUrl || null,
        fetchedAt: row.fetchedAt || null,
      }));
    },
  };

  window.GrowthToolsAdapters = {
    register,
    get,
    list,
    byProvider,
  };

  // Registered eagerly so it's available the moment this file loads, same
  // as GrowthToolsStore's own seed — future real adapters (e.g.
  // "growth-administration-json", "rakia-rss") register themselves the
  // same way from their own adapter file, once G3B builds them.
  register(manualFixtureAdapter);
})();
