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

  // --- Shared web-fetch plumbing (G3B/G3D) ---------------------------
  //
  // One reasonable timeout, one honest identifying User-Agent (no browser
  // impersonation, no evasion of any kind), no retries — every provider
  // adapter below builds on this instead of duplicating fetch/timeout
  // logic. The id→URL mapping is NEVER duplicated here: the runner passes
  // in the already-canonical GrowthTool records for each provider (each
  // already carries its own curated `source.url`), so that mapping lives
  // in exactly one place (growth-tools-store.js's SEED, established in
  // G1A) and can never drift between two copies.
  const FETCH_TIMEOUT_MS = 10000;
  const USER_AGENT = "EcosystemOS-GrowthToolsSync/1.0 (+https://github.com/omriw-art/ecos)";

  function fetchHtml(url) {
    if (!url || typeof fetch !== "function") {
      return Promise.resolve({ ok: false, html: null, error: "no fetch() available or no URL" });
    }
    const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;
    return fetch(url, Object.assign({ headers: { "User-Agent": USER_AGENT } }, controller ? { signal: controller.signal } : null))
      .then((res) => {
        if (timer) clearTimeout(timer);
        if (!res.ok) return { ok: false, html: null, error: `HTTP ${res.status}` };
        return res.text().then((html) => ({ ok: true, html, error: null }));
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        return { ok: false, html: null, error: String(err && err.message || err) };
      });
  }

  function fetchToolHtml(tool) {
    const url = tool.source && tool.source.url;
    const fetchedAt = new Date().toISOString();
    return fetchHtml(url).then((r) => Object.assign({ toolId: tool.id, sourceUrl: url || null, fetchedAt }, r));
  }

  function fetchAllTools(context) {
    return Promise.all(((context && context.tools) || []).map(fetchToolHtml));
  }

  // Parses the first JSON-LD (`<script type="application/ld+json">`) block
  // on a page into a flat array of nodes — unwrapping a Yoast-SEO-style
  // `{"@graph": [...]}` envelope if present, or treating a bare
  // array/object as a one-or-many node list otherwise. Shared by every
  // adapter below that reads JSON-LD; never used to invent a value, only
  // to locate one.
  const JSON_LD_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
  function parseJsonLdGraph(html) {
    if (!html) return [];
    const match = JSON_LD_RE.exec(html);
    if (!match) return [];
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (err) {
      return [];
    }
    if (data && Array.isArray(data["@graph"])) return data["@graph"];
    return Array.isArray(data) ? data : [data];
  }

  // --- Innovation Authority — the G3B pilot provider, sourceType "web" ---
  //
  // Discovery (documented here, not re-derived at runtime): the site
  // (innovationisrael.org.il) is a WordPress install (robots.txt references
  // Yoast SEO sitemaps) but returns HTTP 403 to every automated request
  // tried — including its own /wp-json/ REST root and sitemap_index.xml,
  // from both the WebFetch tool and a plain `curl`, and later confirmed
  // blocked from GitHub-hosted runners too (G3C). No official API/JSON/RSS
  // endpoint was reachable, and no third-party aggregator was used (out of
  // scope regardless). A search of data.gov.il (Israel's official open-data
  // portal) turned up no Innovation Authority program dataset. This adapter
  // is therefore a "web" adapter with a real (currently blocked) fetch,
  // plus a minimal JSON-LD extraction fallback for the day access is
  // available — it does NOT do CSS-selector/DOM HTML scraping, and does
  // not guess a status.
  //
  // Pure, independently-testable extraction: pulls only the two fields
  // trustworthy enough to use without guessing — `name` -> officialName,
  // and a `validThrough`/`endDate` that is (or starts with) a strict
  // YYYY-MM-DD date -> deadline. Everything else (status, applicationUrl)
  // is left null from this path: schema.org has no reliable generic "is
  // this program open" field, and guessing a submission URL from
  // structured data would be exactly the kind of invented value this
  // pipeline must not produce.
  const ISO_DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;
  function extractJsonLdFields(html) {
    const result = { officialName: null, deadline: null };
    const node = parseJsonLdGraph(html)[0];
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
    fetch: fetchAllTools,
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

  // --- Rakia — G3D, sourceType "web" ------------------------------------
  //
  // Discovery: rakiamission.com is a Webflow site (static server-rendered
  // HTML, confirmed reachable — HTTP 200 for both program pages and
  // robots.txt/sitemap.xml). No JSON-LD, no API, no RSS found anywhere on
  // either page. Each page does carry exactly one clean `<h1>` matching the
  // page's own subject (verified: "אירועים ותערוכות" / "תעשיה ואקדמיה") —
  // trustworthy enough for officialName, the same way a JSON-LD `name`
  // field would be for another provider.
  //
  // Deadline capability, deliberately conservative: on THIS provider's
  // actual pages it always yields null — the events page is a *past*-
  // events gallery (no future date anywhere, and a listing with several
  // event dates must never collapse into one overall "deadline" per the
  // batch's own instruction) and the industry/experiment-submission page
  // frames itself as a continuous, open-ended invitation, not a dated
  // call. The logic below only ever trusts a date that is BOTH (a) the
  // single date-like token on the whole page and (b) sitting within the
  // Hebrew phrase "מועד אחרון" ("final/deadline date") — two or more date
  // tokens anywhere on the page means "ambiguous, do not guess."
  // `applicationUrl` stays null always: the only submission-adjacent links
  // found on the real pages are a generic in-page `#contact-us-section`
  // anchor and a generic `/contact-us-he` page, neither a dedicated
  // action/submission destination (a contact form is not "the"
  // application).
  const RAKIA_DEADLINE_KEYWORD = "מועד אחרון";
  const DATE_TOKEN_RE = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
  function normalizeDateToken(token) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token;
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(token);
    if (!m) return null;
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    d = d.padStart(2, "0"); mo = mo.padStart(2, "0");
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${y}-${mo}-${d}`;
  }
  function extractRakiaFields(html) {
    const result = { officialName: null, deadline: null };
    if (!html) return result;
    const h1Match = /<h1[^>]*>([^<]*)<\/h1>/i.exec(html);
    if (h1Match && h1Match[1].trim()) result.officialName = h1Match[1].trim();

    const allDates = html.match(DATE_TOKEN_RE) || [];
    const keywordIdx = html.indexOf(RAKIA_DEADLINE_KEYWORD);
    if (allDates.length === 1 && keywordIdx !== -1) {
      const nearby = html.slice(keywordIdx, keywordIdx + 200).match(DATE_TOKEN_RE) || [];
      if (nearby.length === 1) result.deadline = normalizeDateToken(nearby[0]);
    }
    return result;
  }

  const rakiaWebAdapter = {
    id: "rakia-web",
    providerId: "rakia",
    sourceType: "web",
    fetch: fetchAllTools,
    normalize(rawResults) {
      return (rawResults || []).map((row) => {
        const fields = row.ok ? extractRakiaFields(row.html) : { officialName: null, deadline: null };
        return {
          toolId: row.toolId,
          providerId: "rakia",
          externalId: null,
          officialName: fields.officialName,
          status: null,
          deadline: fields.deadline,
          applicationUrl: null, // never derived here — see adapter doc above
          sourceUrl: row.sourceUrl,
          fetchedAt: row.fetchedAt,
        };
      });
    },
  };

  // --- Growth Administration — G3D, sourceType "web" --------------------
  //
  // Discovery: israelgrowth.org.il is WordPress + Yoast SEO (confirmed via
  // the `generator` meta tag and a reachable `/wp-json/` REST root — HTTP
  // 200), reachable for all 5 program pages. Each page's Yoast JSON-LD
  // `@graph` includes a `WebPage` node with a clean official-sounding
  // `name` (e.g. "קול קורא: תשתיות בתחומי הקלאסטרים") — used for
  // officialName the same way as the Innovation Authority adapter.
  //
  // `deadline`/`applicationUrl` capability, deliberately conservative: on
  // the 5 real pages checked, every JSON-LD node is either the `WebPage`
  // itself (whose only dates are `datePublished`/`dateModified` — page-
  // edit metadata, NOT a submission deadline, explicitly excluded rather
  // than trusted per this batch's own warning) or nothing at all, and the
  // `WebPage`'s `potentialAction` is always a generic `ReadAction` pointing
  // back at the page ("you may read this"), never an apply/register
  // action. The logic below stays generic for whichever provider content
  // changes to next: a genuinely date-bearing node (e.g. a future `Event`/
  // `JobPosting`-typed node with `validThrough`/`endDate`) would still be
  // picked up as a deadline, and a `potentialAction` whose `@type` is
  // anything other than `ReadAction` would still be picked up as
  // applicationUrl — but neither exists on any of these 5 pages today, so
  // both correctly yield null in practice.
  function extractGrowthAdminFields(html) {
    const result = { officialName: null, deadline: null, applicationUrl: null };
    const graph = parseJsonLdGraph(html);
    const webPageNode = graph.find((n) => n && n["@type"] === "WebPage");
    if (webPageNode && typeof webPageNode.name === "string" && webPageNode.name.trim()) {
      result.officialName = webPageNode.name.trim();
    }
    graph.forEach((node) => {
      if (!node || typeof node !== "object" || node["@type"] === "WebPage") return;
      const rawDate = node.validThrough || node.endDate || null;
      if (typeof rawDate === "string" && !result.deadline) {
        const m = ISO_DATE_PREFIX_RE.exec(rawDate);
        if (m) result.deadline = m[1];
      }
    });
    const actions = (webPageNode && Array.isArray(webPageNode.potentialAction)) ? webPageNode.potentialAction : [];
    actions.forEach((action) => {
      if (result.applicationUrl || !action || action["@type"] === "ReadAction") return;
      const target = Array.isArray(action.target) ? action.target[0] : action.target;
      if (typeof target === "string") {
        try { new URL(target); result.applicationUrl = target; } catch (err) { /* not a valid URL — ignore */ }
      }
    });
    return result;
  }

  const growthAdministrationWebAdapter = {
    id: "growth-administration-web",
    providerId: "growth-administration",
    sourceType: "web",
    fetch: fetchAllTools,
    normalize(rawResults) {
      return (rawResults || []).map((row) => {
        const fields = row.ok ? extractGrowthAdminFields(row.html) : { officialName: null, deadline: null, applicationUrl: null };
        return {
          toolId: row.toolId,
          providerId: "growth-administration",
          externalId: null,
          officialName: fields.officialName,
          status: null,
          deadline: fields.deadline,
          applicationUrl: fields.applicationUrl,
          sourceUrl: row.sourceUrl,
          fetchedAt: row.fetchedAt,
        };
      });
    },
  };

  // --- MAFAT (DDR&D) — G3D, sourceType "web" ----------------------------
  //
  // Discovery: ddrd-mafat.mod.gov.il is a modern JS-rendered site (CSS-
  // module class-name patterns) but serves a fully server-rendered HTML
  // body (confirmed reachable — HTTP 200), so no browser/JS execution is
  // needed to read it. No JSON-LD, no `__NEXT_DATA__` blob, no API found.
  // The rendered HTML DOES contain an explicit, unambiguous Hebrew status
  // string inside a component literally named with "...edRegistration..."
  // in its CSS-module class — "ההרשמה נסגרה" ("Registration closed") /
  // "ההרשמה פתוחה" ("Registration open") are the only two phrases ever
  // trusted; anything else leaves status null rather than guessing. The
  // page also has TWO `<h1>` elements (the program title, and an unrelated
  // "Mafat AI" chatbot widget title) — officialName is only read from the
  // one whose class name contains "ProgramTitle", never the first `<h1>`
  // found, to avoid picking up the chatbot's heading by accident.
  //
  // Deliberately null always: `applicationUrl` — the only links found are a
  // generic site-wide "צור קשר" (contact) link, not a dedicated submission
  // destination, and registration was observed closed at discovery time
  // anyway. `deadline` — no explicit date was found anywhere on the page.
  function extractMafatFields(html) {
    const result = { officialName: null, status: null };
    if (!html) return result;
    if (html.indexOf("ההרשמה נסגרה") !== -1) result.status = "closed";
    else if (html.indexOf("ההרשמה פתוחה") !== -1) result.status = "open";
    const h1Match = /<h1[^>]*class="[^"]*programtitle[^"]*"[^>]*>([^<]*)<\/h1>/i.exec(html);
    if (h1Match && h1Match[1].trim()) result.officialName = h1Match[1].trim();
    return result;
  }

  const mafatWebAdapter = {
    id: "mafat-web",
    providerId: "ddrd-mafat",
    sourceType: "web",
    fetch: fetchAllTools,
    normalize(rawResults) {
      return (rawResults || []).map((row) => {
        const fields = row.ok ? extractMafatFields(row.html) : { officialName: null, status: null };
        return {
          toolId: row.toolId,
          providerId: "ddrd-mafat",
          externalId: null,
          officialName: fields.officialName,
          status: fields.status,
          deadline: null, // never derived here — see adapter doc above
          applicationUrl: null, // never derived here — see adapter doc above
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
    // Exposed for direct, network-free unit testing of each extraction
    // function (scripts/test-growth-tools-sync-g3d.js) — not part of the
    // adapter contract itself.
    _extractJsonLdFields: extractJsonLdFields,
    _extractRakiaFields: extractRakiaFields,
    _extractGrowthAdminFields: extractGrowthAdminFields,
    _extractMafatFields: extractMafatFields,
  };

  // Registered eagerly so it's available the moment this file loads, same
  // as GrowthToolsStore's own seed.
  register(manualFixtureAdapter);
  register(innovationAuthorityWebAdapter);
  register(rakiaWebAdapter);
  register(growthAdministrationWebAdapter);
  register(mafatWebAdapter);
})();
