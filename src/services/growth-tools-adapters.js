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

  // --- Innovation Authority — the G3B pilot provider, sourceType "web" ---
  //
  // Discovery (documented here, not re-derived at runtime): the site
  // (innovationisrael.org.il) is a WordPress install (robots.txt references
  // Yoast SEO sitemaps) but returns HTTP 403 to every automated request
  // tried during this batch — including its own /wp-json/ REST root and
  // sitemap_index.xml, from both the WebFetch tool and a plain `curl` from
  // this environment. No official API/JSON/RSS endpoint was reachable, and
  // no third-party aggregator was used (out of scope regardless). A search
  // of data.gov.il (Israel's official open-data portal) turned up no
  // Innovation Authority program dataset. This adapter is therefore a
  // "web" adapter with a real (currently blocked) fetch, plus a minimal
  // JSON-LD extraction fallback for the day access is available — it does
  // NOT do CSS-selector/DOM HTML scraping, and does not guess a status.
  //
  // The id→URL mapping is NOT duplicated here: the runner passes in the
  // already-canonical GrowthTool records for this provider (each already
  // carries its own curated `source.url`, established in G1A), so there is
  // exactly one place that mapping lives, never two copies that can drift.
  const IIA_FETCH_TIMEOUT_MS = 10000;

  function fetchOne(tool) {
    const url = tool.source && tool.source.url;
    const fetchedAt = new Date().toISOString();
    if (!url || typeof fetch !== "function") {
      return Promise.resolve({ toolId: tool.id, sourceUrl: url || null, ok: false, html: null, error: "no fetch() available or no source URL", fetchedAt });
    }
    const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), IIA_FETCH_TIMEOUT_MS) : null;
    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then((res) => {
        if (timer) clearTimeout(timer);
        if (!res.ok) return { toolId: tool.id, sourceUrl: url, ok: false, html: null, error: `HTTP ${res.status}`, fetchedAt };
        return res.text().then((html) => ({ toolId: tool.id, sourceUrl: url, ok: true, html, error: null, fetchedAt }));
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        return { toolId: tool.id, sourceUrl: url, ok: false, html: null, error: String(err && err.message || err), fetchedAt };
      });
  }

  // Pure, independently-testable extraction: looks for a JSON-LD
  // (`<script type="application/ld+json">`) block and pulls out only the
  // two fields trustworthy enough to use without guessing —
  // `name` -> officialName, and a `validThrough`/`endDate` that is (or
  // starts with) a strict YYYY-MM-DD date -> deadline. Everything else
  // (status, applicationUrl) is left null from this path: schema.org has no
  // reliable generic "is this program open" field, and guessing a
  // submission URL from structured data would be exactly the kind of
  // invented value this pipeline must not produce.
  const JSON_LD_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
  const ISO_DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;
  function extractJsonLdFields(html) {
    const result = { officialName: null, deadline: null };
    if (!html) return result;
    const match = JSON_LD_RE.exec(html);
    if (!match) return result;
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (err) {
      return result;
    }
    const node = Array.isArray(data) ? data[0] : data;
    if (!node || typeof node !== "object") return result;
    if (typeof node.name === "string" && node.name.trim()) result.officialName = node.name.trim();
    const rawDate = node.validThrough || node.endDate || null;
    if (typeof rawDate === "string") {
      const dateMatch = ISO_DATE_PREFIX_RE.exec(rawDate);
      if (dateMatch) result.deadline = dateMatch[1];
    }
    return result;
  }

  const innovationAuthorityWebAdapter = {
    id: "innovation-authority-web",
    providerId: "innovation-authority",
    sourceType: "web",
    // context.tools — the canonical (already provider-filtered) GrowthTool
    // records to check, supplied by the caller (scripts/sync-growth-tools.js
    // filters GrowthToolsStore.getGrowthTools() by providerId before
    // calling this). No network call happens anywhere else in this file.
    fetch(context) {
      const tools = (context && context.tools) || [];
      return Promise.all(tools.map(fetchOne));
    },
    normalize(rawResults) {
      return (rawResults || []).map((row) => {
        const fields = row.ok ? extractJsonLdFields(row.html) : { officialName: null, deadline: null };
        return {
          toolId: row.toolId,
          providerId: "innovation-authority",
          externalId: null,
          officialName: fields.officialName,
          status: null, // never guessed from this path — see extractJsonLdFields doc
          deadline: fields.deadline,
          applicationUrl: null, // never guessed from this path — see extractJsonLdFields doc
          sourceUrl: row.sourceUrl,
          fetchedAt: row.fetchedAt,
        };
      });
    },
  };

  window.GrowthToolsAdapters = {
    register,
    get,
    list,
    byProvider,
    // Exposed for direct, network-free unit testing of the extraction
    // logic (scripts/test-growth-tools-sync.js) — not part of the adapter
    // contract itself.
    _extractJsonLdFields: extractJsonLdFields,
  };

  // Registered eagerly so it's available the moment this file loads, same
  // as GrowthToolsStore's own seed — future real adapters (e.g.
  // "growth-administration-json", "rakia-rss") register themselves the
  // same way from their own adapter file, once G3B builds them.
  register(manualFixtureAdapter);
  register(innovationAuthorityWebAdapter);
})();
