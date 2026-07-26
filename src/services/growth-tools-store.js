// ecos — curated local reference catalog of ecosystem growth tools
// (מענקים, פיילוטים, תוכניות האצה, תשתיות, יצוא, גישה לחלל וכו').
// This is a static local reference catalog, NOT a live feed: no eligibility
// checks, no scraping, no external API/LinkedIn integration, no automatic
// application, no network requests. Deliberately separate from NeedsStore —
// these are programs/resources a company can receive, not needs/gaps an
// ecosystem actor is looking to fill.
// localStorage-only convention reserved for a future local overlay; v1 is
// read-only seed data (nothing is written yet).
//
// G2 — getRecommendedGrowthTools(company) adds deterministic, explainable
// ranking on top of the same static catalog (see that function below for the
// scoring model). It is a read-only, in-memory computation: no new storage,
// no AI/embeddings, no fabricated eligibility. Recommendation = relevance,
// never an eligibility determination.
//
// Data model (G1A): each canonical record separates fields Ecosystem OS
// curates/owns (type, purposes, stages, domains, description) from fields
// that would eventually be kept fresh by an external source
// (status, deadline, applicationUrl, source.*, lastVerifiedAt, lastSyncedAt,
// syncStatus). No sync logic exists yet — syncStatus is "never" and
// lastSyncedAt is null for every seed record. `source.type` is "web" for
// every v1 record (manually curated from the provider's own website); future
// values may include "manual" | "api" | "json" | "rss" once a real sync
// layer is built on top of a GrowthToolsSyncService (not implemented here).
//
// Only truthful, explicitly-supplied facts are seeded: provider, division,
// program name and official source URL. Status/deadline/applicationUrl/
// eligibility/benefit are left null when not reliably known — an honest
// partial record beats a plausible invented one.

(function () {
  if (window.GrowthToolsStore) return;

  const STORAGE_KEY = "ecosystemOS.growthTools.v1"; // reserved, unused in v1

  // Back-compat category label shown as the card's pill (view-growth-tools.jsx)
  // — one label per `type`, not a duplicate vocabulary.
  const TYPE_LABELS = {
    funding: "מימון",
    accelerator: "האצה ותוכניות צמיחה",
    pilot: "פיילוטים",
    infrastructure: "תשתיות",
    international: "פעילות בינלאומית",
    "market-access": "חדירה לשוק",
    "space-access": "גישה לחלל",
    "research-development": "מחקר ופיתוח",
    support: "תמיכה / שירות",
    directory: "מאגר מסלולים",
    events: "אירועים",
  };

  const PROVIDERS = {
    innovationAuthority: { id: "innovation-authority", name: "רשות החדשנות" },
    growthAdministration: { id: "growth-administration", name: "מנהלת הצמיחה — משרד הכלכלה" },
    investmentAuthority: { id: "investment-authority", name: "הרשות להשקעות — משרד הכלכלה" },
    rakia: { id: "rakia", name: "רקיע" },
    ddrdMafat: { id: "ddrd-mafat", name: "מפא\"ת (DDR&D)" },
  };

  // Curation date for this batch — reflects when the provider/name/URL
  // triplet was checked in, not a live confirmation of program content,
  // status or deadlines.
  const CURATED_AT = "2026-07-26";

  function webSource(url) {
    return { type: "web", url, externalId: null };
  }

  // Canonical Growth Tool records — G1A dataset (real Israeli ecosystem
  // programs only; no invented status/deadline/applicationUrl/eligibility).
  const SEED = [
    {
      id: "gt-iia-application-lifecycle",
      name: "גלגולה של בקשה",
      provider: PROVIDERS.innovationAuthority,
      division: null,
      type: "support",
      purposes: ["הבנת תהליך הגשת בקשה"],
      stages: [],
      domains: [],
      description: "מדריך רשמי של רשות החדשנות המסביר את שלבי הטיפול בבקשה למענק, מרגע ההגשה ועד ההחלטה.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/%d7%92%d7%9c%d7%92%d7%95%d7%9c%d7%94-%d7%a9%d7%9c-%d7%91%d7%a7%d7%a9%d7%94/"),
    },
    {
      id: "gt-iia-rnd-grants",
      name: "מענקים למחקר ופיתוח",
      provider: PROVIDERS.innovationAuthority,
      division: null,
      type: "funding",
      purposes: ["מענקי מו״פ"],
      stages: [],
      domains: [],
      description: "עמוד מרכז של רשות החדשנות המרכז את מסלולי המענקים למחקר ופיתוח טכנולוגי.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/%D7%9E%D7%A2%D7%A0%D7%A7%D7%99%D7%9D-%D7%9C%D7%9E%D7%97%D7%A7%D7%A8-%D7%95%D7%A4%D7%99%D7%AA%D7%95%D7%97/"),
    },
    {
      id: "gt-iia-tech-incubators",
      name: "קרן החממות הטכנולוגיות",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת הזנק",
      type: "accelerator",
      purposes: ["חממה טכנולוגית", "מימון שלב מוקדם מאוד"],
      stages: ["Concept", "Seed"],
      domains: [],
      description: "מסלול מימון של רשות החדשנות (חטיבת ההזנק) הפועל דרך חממות טכנולוגיות מוכרות עבור חברות בשלב מוקדם מאוד.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/technological-incubators-funding-program/"),
    },
    {
      id: "gt-iia-preseed",
      name: "מסלול Pre-Seed",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת הזנק",
      type: "funding",
      purposes: ["מימון שלב רעיוני"],
      stages: ["Concept", "Seed"],
      domains: [],
      description: "מסלול מימון של רשות החדשנות (חטיבת ההזנק) לחברות בשלב הרעיוני, לפני הקמה מלאה.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/preseed/"),
    },
    {
      id: "gt-iia-tech-labs",
      name: "מעבדות לחדשנות טכנולוגית",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת הזנק",
      type: "infrastructure",
      purposes: ["תשתיות מעבדה לחדשנות"],
      stages: [],
      domains: [],
      description: "מסלול של רשות החדשנות (חטיבת ההזנק) התומך בהקמה ובתפעול של מעבדות לחדשנות טכנולוגית.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/%d7%9e%d7%a1%d7%9c%d7%95%d7%9c-%d7%9e%d7%a2%d7%91%d7%93%d7%95%d7%aa-%d7%9c%d7%97%d7%93%d7%a9%d7%a0%d7%95%d7%aa-%d7%98%d7%9b%d7%a0%d7%95%d7%9c%d7%95%d7%92%d7%99%d7%aa/#about_route"),
    },
    {
      id: "gt-iia-momentum",
      name: "מסלול תנופה",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת הזנק",
      type: "funding",
      purposes: ["מימון שלב הזנק"],
      stages: ["Seed"],
      domains: [],
      description: "מסלול מימון של רשות החדשנות (חטיבת ההזנק) לחברות הזנק.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/%d7%9e%d7%a1%d7%9c%d7%95%d7%9c-%d7%aa%d7%a0%d7%95%d7%a4%d7%94-%d7%a7%d7%a8%d7%9f-%d7%94%d7%94%d7%96%d7%a0%d7%a7/#about_route"),
    },
    {
      id: "gt-iia-round-a",
      name: "מסלול Round A",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "funding",
      purposes: ["מימון סבב A"],
      stages: ["Series A"],
      domains: [],
      description: "מסלול מימון של רשות החדשנות (חטיבת הצמיחה) לחברות בשלב גיוס מקביל לסבב A.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/rounda/"),
    },
    {
      id: "gt-iia-seed-track",
      name: "מסלול Seed",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "funding",
      purposes: ["מימון שלב Seed"],
      stages: ["Seed"],
      domains: [],
      description: "מסלול מימון של רשות החדשנות (חטיבת הצמיחה) לחברות בשלב Seed.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/seed/"),
    },
    {
      id: "gt-iia-mofet-feasibility",
      name: "התכנות טכנו-כלכלית — קרן מופ\"ת",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "funding",
      purposes: ["בחינת היתכנות טכנו-כלכלית"],
      stages: [],
      domains: [],
      description: "מסלול של קרן מופ\"ת ברשות החדשנות (חטיבת הצמיחה) לבחינת היתכנות טכנו-כלכלית של מיזם ייצור.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/manufacturing-rnd-mofet-fund-financial-feasability/#about_route"),
    },
    {
      id: "gt-iia-sector-pilots",
      name: "פיילוט משקי — קרן הפיילוטים",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "pilot",
      purposes: ["פיילוט ברמת המשק"],
      stages: [],
      domains: [],
      description: "מסלול של קרן הפיילוטים ברשות החדשנות (חטיבת הצמיחה) לביצוע פיילוטים ברמה משקית/ענפית.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/sector-level-pilots/"),
    },
    {
      id: "gt-iia-mofet-product-dev",
      name: "מסלול פיתוח מוצר — קרן מופ\"ת",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "funding",
      purposes: ["פיתוח מוצר בייצור"],
      stages: [],
      domains: [],
      description: "מסלול של קרן מופ\"ת ברשות החדשנות (חטיבת הצמיחה) למימון פיתוח מוצר.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/%d7%9e%d7%a1%d7%9c%d7%95%d7%9c-%d7%a4%d7%99%d7%aa%d7%95%d7%97-%d7%9e%d7%95%d7%a6%d7%a8-%d7%a7%d7%a8%d7%9f-%d7%9e%d7%95%d7%a4%d7%aa/"),
    },
    {
      id: "gt-iia-space-investment",
      name: "מסלול השקעות בתחום החלל",
      provider: PROVIDERS.innovationAuthority,
      division: "חטיבת צמיחה",
      type: "funding",
      purposes: ["השקעה בחברות תעשיית החלל"],
      stages: [],
      domains: [],
      description: "מסלול מימון ייעודי של רשות החדשנות (חטיבת הצמיחה) לחברות בתעשיית החלל.",
      benefit: null,
      eligibility: null,
      source: webSource("https://innovationisrael.org.il/programs/%d7%9e%d7%a1%d7%9c%d7%95%d7%9c-%d7%94%d7%a9%d7%a7%d7%a2%d7%94-%d7%91%d7%aa%d7%97%d7%95%d7%9d-%d7%94%d7%97%d7%9c%d7%9c/"),
    },
    {
      id: "gt-growth-admin-physical-infra",
      name: "מענק להקמת תשתיות פיזיות",
      provider: PROVIDERS.growthAdministration,
      division: null,
      type: "infrastructure",
      purposes: ["הקמת תשתיות פיזיות"],
      stages: [],
      domains: [],
      description: "מענק של מנהלת הצמיחה במשרד הכלכלה להקמת תשתיות פיזיות.",
      benefit: null,
      eligibility: null,
      source: webSource("https://israelgrowth.org.il/infrastructure/"),
    },
    {
      id: "gt-growth-admin-data-infra",
      name: "מענק להקמת תשתיות דאטא",
      provider: PROVIDERS.growthAdministration,
      division: null,
      type: "infrastructure",
      purposes: ["הקמת תשתיות דאטא"],
      stages: [],
      domains: [],
      description: "מענק של מנהלת הצמיחה במשרד הכלכלה להקמת תשתיות דאטא.",
      benefit: null,
      eligibility: null,
      source: webSource("https://israelgrowth.org.il/calling-voice/"),
    },
    {
      id: "gt-growth-admin-overseas-activity",
      name: "עידוד פעילות בחו\"ל",
      provider: PROVIDERS.growthAdministration,
      division: null,
      type: "international",
      purposes: ["עידוד פעילות בחו\"ל"],
      stages: [],
      domains: [],
      description: "תוכנית של מנהלת הצמיחה במשרד הכלכלה לעידוד פעילות חברות בחו\"ל.",
      benefit: null,
      eligibility: null,
      source: webSource("https://israelgrowth.org.il/growth-to-the-world/"),
    },
    {
      id: "gt-growth-admin-overseas-market-entry",
      name: "פריצת שווקים בחו\"ל",
      provider: PROVIDERS.growthAdministration,
      division: null,
      type: "market-access",
      purposes: ["כניסה לשווקים בינלאומיים"],
      stages: [],
      domains: [],
      description: "תוכנית של מנהלת הצמיחה במשרד הכלכלה לתמיכה בפריצת שווקים בחו\"ל.",
      benefit: null,
      eligibility: null,
      source: webSource("https://israelgrowth.org.il/pilot-program/"),
    },
    {
      id: "gt-growth-admin-regional-engines",
      name: "מנועי צמיחה אזוריים",
      provider: PROVIDERS.growthAdministration,
      division: null,
      type: "support",
      purposes: ["פיתוח כלכלי אזורי"],
      stages: [],
      domains: [],
      description: "תוכנית של מנהלת הצמיחה במשרד הכלכלה לפיתוח מנועי צמיחה אזוריים.",
      benefit: null,
      eligibility: null,
      source: webSource("https://israelgrowth.org.il/regional-growth/"),
    },
    {
      id: "gt-investment-authority-tracks-directory",
      name: "מסלולי סיוע — הרשות להשקעות (מדריך מסלולים)",
      provider: PROVIDERS.investmentAuthority,
      division: null,
      type: "directory",
      purposes: ["מדריך למסלולי סיוע"],
      stages: [],
      domains: [],
      description: "עמוד מרכז (דירקטורי) של הרשות להשקעות המרכז מספר מסלולי סיוע שונים. זהו מקור/דירקטורי כללי ולא מסלול ספציפי — יש לעיין באתר הרשמי לפירוט המסלולים ותנאיהם.",
      benefit: null,
      eligibility: null,
      source: webSource("https://govextra.gov.il/economy/iia-grants/home/"),
    },
    {
      id: "gt-rakia-events-exhibitions",
      name: "אירועים ותערוכות",
      provider: PROVIDERS.rakia,
      division: null,
      type: "events",
      purposes: ["נראות ותערוכות ענפיות"],
      stages: [],
      domains: [],
      description: "אירועים ותערוכות מטעם רקיע לחברות אקוסיסטם החלל.",
      benefit: null,
      eligibility: null,
      source: webSource("https://www.rakiamission.com/events-and-exhibitions-he"),
    },
    {
      id: "gt-rakia-space-experiment-submission",
      name: "הגשת ניסוי לחלל",
      provider: PROVIDERS.rakia,
      division: null,
      type: "space-access",
      purposes: ["הגשת ניסוי לביצוע בחלל"],
      stages: [],
      domains: [],
      description: "ערוץ של רקיע להגשת ניסויים לביצוע בסביבת חלל, בשיתוף תעשייה ואקדמיה.",
      benefit: null,
      eligibility: null,
      source: webSource("https://www.rakiamission.com/industry-academy-he#industry-join-space"),
    },
    {
      id: "gt-mafat-meimad",
      name: "תכנית מימד",
      provider: PROVIDERS.ddrdMafat,
      division: null,
      type: "research-development",
      purposes: ["מו״פ ביטחוני/דואלי עם הזנקים"],
      stages: [],
      domains: [],
      description: "תוכנית של מפא\"ת (DDR&D) במסגרת הפעילות מול הזנקים.",
      benefit: null,
      eligibility: null,
      source: webSource("https://ddrd-mafat.mod.gov.il/he//mafat-for-startups/meimad"),
    },
  ];

  // Adds synced/source-layer fields (all null/never until a sync layer
  // exists) and back-compat fields the current UI/company-feed still read
  // directly (title, category, provider-as-string, stageFit, sectorFit,
  // tags, url) so this reshape doesn't require a UI or consumer change.
  function normalize(tool) {
    return Object.assign({}, tool, {
      status: null,
      deadline: null,
      applicationUrl: null,
      lastVerifiedAt: CURATED_AT,
      lastSyncedAt: null,
      syncStatus: "never",
      // back-compat surface (view-growth-tools.jsx, company-feed.js)
      title: tool.name,
      category: TYPE_LABELS[tool.type] || tool.type,
      provider: tool.provider ? tool.provider.name : null,
      stageFit: tool.stages && tool.stages.length ? tool.stages.join(" / ") : null,
      sectorFit: tool.domains && tool.domains.length ? tool.domains.join(" / ") : null,
      tags: (tool.purposes || []).slice(),
      url: tool.source ? tool.source.url : null,
    });
  }

  const NORMALIZED = SEED.map(normalize);

  function getGrowthTools() {
    return NORMALIZED.slice();
  }

  function getGrowthToolsByCategory(category) {
    return NORMALIZED.filter((item) => item.category === category);
  }

  function getCategories() {
    return Array.from(new Set(NORMALIZED.map((item) => item.category)));
  }

  // --- G2: deterministic, explainable recommendations ------------------
  //
  // Audited inputs (see G1B/G2 batch notes): company.stage is the only
  // company field reliable enough to match against today — company.needs is
  // empty on every seeded company and company.sectors has no counterpart in
  // this dataset yet (every tool.domains is still [], a real data gap, not a
  // bug: G1A curated real programs but none had a documented sector
  // restriction, so domain overlap below is wired for when that data exists
  // but is inert — 0 points — until then). company.readiness is likewise
  // too sparse/inconsistent across seed companies to score against.
  //
  // Scoring is additive across independent signals, capped at 3 reasons.
  // Numeric score is for ranking only — never rendered to the user.
  const GT_SCORE = {
    stageDirect: 40,   // company.stage is literally in tool.stages
    stageDivision: 20, // tool has no stage list, but its Innovation Authority
                       // division ("חטיבת הזנק" / "חטיבת צמיחה") implies an
                       // early- or growth-stage family that fits the company
    domainOverlap: 25, // tool.domains ∩ company.sectors (inert today, see above)
    spaceFocus: 15,    // tool's own curated text explicitly names the space
                       // industry as its target — true of every company in
                       // this space-only ecosystem, so this rewards tools
                       // that are unusually on-topic rather than personalizing
    broadDefault: 5,   // no stage restriction at all — plausibly useful to
                       // any company; keeps "unknown ≠ incompatible" honest
                       // instead of scoring such tools at 0
  };

  // Small, explicit, defensible mapping (not a full ontology): the
  // Innovation Authority's own division names double as a coarse stage
  // family when a specific track lists no stages of its own.
  const GT_EARLY_STAGE_FAMILY = new Set(["Concept", "Seed"]);
  const GT_GROWTH_STAGE_FAMILY = new Set(["Series A", "Series B", "Series C", "Growth"]);

  const GT_SPACE_KEYWORD = "חלל";
  function isSpaceFocused(tool) {
    const text = [tool.description].concat(tool.purposes || []).filter(Boolean).join(" ");
    return text.indexOf(GT_SPACE_KEYWORD) !== -1;
  }

  // Stage-fit is a single dimension — only one of direct / division-family /
  // broad-default applies, so they're not stacked into false precision.
  function stageSignal(tool, company) {
    const stage = company && company.stage;
    if (tool.stages && tool.stages.length) {
      if (stage && tool.stages.indexOf(stage) !== -1) {
        return { points: GT_SCORE.stageDirect, reason: `מתאים לשלב החברה (${stage})` };
      }
      return { points: 0, reason: null };
    }
    if (stage && tool.division === "חטיבת הזנק" && GT_EARLY_STAGE_FAMILY.has(stage)) {
      return { points: GT_SCORE.stageDivision, reason: "מתאים לשלבים מוקדמים (חטיבת הזנק)" };
    }
    if (stage && tool.division === "חטיבת צמיחה" && GT_GROWTH_STAGE_FAMILY.has(stage)) {
      return { points: GT_SCORE.stageDivision, reason: "מתאים לשלבי צמיחה מתקדמים יותר (חטיבת צמיחה)" };
    }
    return { points: GT_SCORE.broadDefault, reason: "מסלול רחב שיכול להתאים למספר שלבי צמיחה" };
  }

  function domainSignal(tool, company) {
    const sectors = (company && Array.isArray(company.sectors)) ? company.sectors : [];
    const domains = tool.domains || [];
    if (!sectors.length || !domains.length) return { points: 0, reason: null };
    const overlap = domains.some((d) => sectors.indexOf(d) !== -1);
    if (!overlap) return { points: 0, reason: null };
    return { points: GT_SCORE.domainOverlap, reason: "רלוונטי לתחום הפעילות של החברה" };
  }

  function spaceSignal(tool) {
    if (!isSpaceFocused(tool)) return { points: 0, reason: null };
    return { points: GT_SCORE.spaceFocus, reason: "רלוונטי לחברות בתחום החלל" };
  }

  function scoreTool(tool, company) {
    const stage = stageSignal(tool, company);
    const domain = domainSignal(tool, company);
    const space = spaceSignal(tool);
    return {
      score: stage.points + domain.points + space.points,
      reasons: [stage.reason, domain.reason, space.reason].filter(Boolean).slice(0, 3),
    };
  }

  // Deterministic: same company + same catalog always yields the same
  // ordering (ties broken by stable tool id, never by insertion/random
  // order). No LLM, no external calls, no randomness.
  function getRecommendedGrowthTools(company, options) {
    const opts = Object.assign({ limit: 5 }, options || {});
    if (!company) return [];
    return NORMALIZED
      .map((tool) => {
        const scored = scoreTool(tool, company);
        return { tool, score: scored.score, reasons: scored.reasons };
      })
      .sort((a, b) => (b.score - a.score) || a.tool.id.localeCompare(b.tool.id))
      .slice(0, opts.limit);
  }

  window.GrowthToolsStore = {
    key: STORAGE_KEY,
    getGrowthTools,
    getGrowthToolsByCategory,
    getRecommendedGrowthTools,
    getCategories,
  };
})();
