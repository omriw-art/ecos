// ecos — כלי צמיחה (Growth Tools).
// Renders GrowthToolsStore's curated local reference catalog: real Israeli
// ecosystem programs (grants, pilots, infrastructure, accelerators, market
// access, events, R&D support…) that an ecosystem actor OFFERS to help a
// company grow — the mirror image of an Opportunity, where an ecosystem
// actor is looking for something FROM a company. Static local catalog, no
// eligibility checks, no scraping, no external integrations, no automatic
// application, no live sync. Official-source links are plain reference
// links, never a "you qualify"/apply action, unless a record's own
// applicationUrl is truthfully populated (none are, in this dataset).
//
// G2 adds a "מומלץ עבורכם" section for the company perspective, backed by
// GrowthToolsStore.getRecommendedGrowthTools — deterministic ranking with
// human-readable reasons, no AI, no fabricated eligibility. See that
// function for the scoring model. The full catalog/search/filters below are
// unchanged and remain available regardless of any recommendation.

const GROWTH_DISCLAIMER = "מאגר מקורות רשמי שנאסף ונאמת ידנית · אינו בדיקת זכאות ואינו מחובר בזמן אמת למערכות חיצוניות. יש לאמת פרטים, תנאים ומועדים מול הגוף הרלוונטי.";

// Stage labels — only for the STAGES values GrowthToolsStore records
// actually use (Concept/Seed/Series A in this dataset); no fictional
// mapping for stages the data doesn't contain.
const GT_STAGE_LABEL_HE = {
  Concept: "רעיוני",
  Seed: "Seed",
  "Series A": "Series A",
  "Series B": "Series B",
  "Series C": "Series C",
  Growth: "צמיחה",
  Mature: "בשל",
  Public: "ציבורי",
};

// Acting-company resolution — same pattern already duplicated per-file in
// app.jsx/view-company-overview.jsx/view-opportunity-detail.jsx (same
// PREFERRED_DEFAULT_COMPANY_IDS list, kept in sync so every "acting company"
// resolver agrees); GT_-prefixed here to avoid colliding with those files'
// same-named top-level consts, since every <script> shares one page scope.
const GT_PARTNER_ORG_TYPES = new Set(["investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit"]);
const GT_PREFERRED_DEFAULT_COMPANY_IDS = ["ramon-space", "spacepharma", "spaceil"];
function gtPreferredDefaultCompany(eligible) {
  for (const id of GT_PREFERRED_DEFAULT_COMPANY_IDS) {
    const found = eligible.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}
function resolveActingCompanyForGrowthTools(companies, actingCompanyId) {
  const eligible = companies.filter((c) => !c.organizationType || !GT_PARTNER_ORG_TYPES.has(c.organizationType));
  const acting = actingCompanyId ? eligible.find((c) => c.id === actingCompanyId) : null;
  return acting || gtPreferredDefaultCompany(eligible) || eligible[0] || companies[0] || null;
}

// Sparse-profile check for the recommendation nudge — recommendations are
// still shown (broad/space-focused signals don't need a stage), but the UI
// says so honestly rather than pretending the ranking is fully personalized.
function hasSufficientProfileForRecommendations(company) {
  return !!(company && company.stage && company.stage !== "Unknown");
}

// One restrained visual cue per canonical `type` — prefers an existing
// window.I icon over emoji wherever one is a clean semantic match (keeps
// the design consistent instead of scattering emoji everywhere); emoji
// only where no existing icon fits. Covers all 11 `type` values currently
// in the dataset (verified against GrowthToolsStore's own TYPE_LABELS) —
// no entry for a hypothetical type that doesn't exist yet.
const GT_TYPE_ICON_COMPONENT = {
  pilot: "Rocket",
  international: "Globe",
  accelerator: "Bolt",
  "space-access": "Satellite",
};
const GT_TYPE_EMOJI = {
  funding: "💰",
  "research-development": "🧪",
  infrastructure: "🏗️",
  "market-access": "📈",
  events: "📅",
  directory: "🗂️",
  support: "🤝",
};
function TypeCue({ type }) {
  const iconName = GT_TYPE_ICON_COMPONENT[type];
  if (iconName && window.I[iconName]) {
    const Icon = window.I[iconName];
    return <Icon size={13} style={{ color: "var(--amber)", flex: "none" }} />;
  }
  const emoji = GT_TYPE_EMOJI[type];
  if (emoji) return <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1, flex: "none" }}>{emoji}</span>;
  return <span className="dot amber" />; // unseen type — same neutral fallback the card always used
}

// Provider logo, reusing the exact same CoLogo component/fallback pattern
// already used for company logos everywhere else (view-companies.jsx,
// view-company-overview.jsx) — no second logo system. Resolution order:
//  1. a real organization/company record with this exact id (only Rakia
//     currently has one — GrowthToolsStore.providerId "rakia" matches a
//     real CompanyStore record 1:1, so its real logoUrl is used as-is).
//  2. a small explicit fallback to an already-existing repo asset for the
//     4 institutional providers with no organization record yet (real
//     files already present under /logos/, not fabricated paths) — this
//     is a presentation-only fallback, not a new Growth Tool data field,
//     and not a claim that these providers have organization profiles.
//  3. CoLogo's own built-in graceful fallback (initials) if neither
//     resolves — never a fabricated logo.
// Missing org records are worth closing later (a small future batch could
// add real organization entries for these institutional providers), not
// solved here.
const GT_PROVIDER_LOGO_FALLBACK = {
  "innovation-authority": "logos/iia_color.png",
  "growth-administration": "logos/growth.png",
  "investment-authority": "logos/invest.png",
  "ddrd-mafat": "logos/mafat-logo-full.svg",
};
function resolveProviderLogoOrg(providerId, providerName) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : [];
  const real = providerId ? companies.find((c) => c.id === providerId) : null;
  if (real) return real;
  return { name: providerName || providerId || "", sectors: [], logoUrl: GT_PROVIDER_LOGO_FALLBACK[providerId] || null };
}

function matchesQuery(tool, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    tool.title,
    tool.provider,
    tool.division,
    tool.description,
    ...(tool.tags || []),
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(needle);
}

function GrowthToolCard({ item }) {
  const hasApplicationUrl = !!item.applicationUrl;
  const providerOrg = resolveProviderLogoOrg(item.providerId, item.provider);
  return (
    <div className="card">
      <div className="flex center gap-8" style={{ marginBottom: 6 }}>
        <window.CoLogo company={providerOrg} size={22} />
        <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.provider}</span>
      </div>
      <div className="card-hd" style={{ marginBottom: item.division ? 4 : 8 }}>
        <div className="card-title"><TypeCue type={item.type} /> {item.title}</div>
      </div>
      {item.division && (
        <div style={{ marginBottom: 8 }}>
          <span className="pill" style={{ fontSize: 10.5 }}>{item.division}</span>
        </div>
      )}
      <div className="flex gap-6 wrap" style={{ marginBottom: 10 }}>
        <span className="pill blue" style={{ fontSize: 10.5 }}>{item.category}</span>
        {(item.tags || []).map((t) => <span key={t} className="pill" style={{ fontSize: 10.5 }}>{t}</span>)}
        {item.stageFit && <span className="pill" style={{ fontSize: 10.5 }}>{item.stageFit}</span>}
      </div>
      {item.description && (
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 12 }}>{item.description}</div>
      )}
      <div className="flex center between" style={{ paddingTop: 10, borderTop: "1px solid var(--line-1)" }}>
        <span className="mono tiny" style={{ color: "var(--text-4)" }}>
          <window.I.Shield size={11} style={{ verticalAlign: -1, marginInlineEnd: 4 }} /> מקור רשמי
        </span>
        <div className="flex gap-8">
          {hasApplicationUrl && (
            <a className="btn btn-primary" href={item.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, display: "inline-flex" }}>
              הגשה <window.I.Link size={12} />
            </a>
          )}
          {item.url && (
            <a className="btn btn-ghost" href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, display: "inline-flex" }}>
              <window.I.Link size={12} /> {hasApplicationUrl ? "פרטים באתר הרשמי" : "לפרטים באתר הרשמי"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Lighter recommendation card — provider/name/type/reasons/CTA only, per G2
// spec ("do not duplicate too much information" from the full catalog card).
function RecommendedToolCard({ rec }) {
  const { tool, reasons } = rec;
  const providerOrg = resolveProviderLogoOrg(tool.providerId, tool.provider);
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex center gap-6">
        <window.CoLogo company={providerOrg} size={18} />
        <span className="mono tiny" style={{ color: "var(--text-4)" }}>{tool.provider}</span>
      </div>
      <div className="flex center gap-6" style={{ marginTop: 4 }}>
        <TypeCue type={tool.type} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{tool.title}</div>
      </div>
      <div className="flex gap-6 wrap" style={{ margin: "6px 0 8px" }}>
        <span className="pill blue" style={{ fontSize: 10.5 }}>{tool.category}</span>
      </div>
      {!!reasons.length && (
        <div className="col gap-4" style={{ marginBottom: 10 }}>
          {reasons.map((r) => (
            <div key={r} className="flex center gap-6" style={{ fontSize: 12, color: "var(--text-3)" }}>
              <window.I.Check size={11} style={{ color: "var(--green)", flex: "none" }} /> {r}
            </div>
          ))}
        </div>
      )}
      {tool.url && (
        <a className="btn btn-ghost" href={tool.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, display: "inline-flex" }}>
          <window.I.Link size={11} /> לפרטים באתר הרשמי
        </a>
      )}
    </div>
  );
}

function GrowthToolsView() {
  const allItems = React.useMemo(
    () => (window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools() : []),
    []
  );

  // Recommendations are company-perspective-only (a partner/admin viewer has
  // no single "my company" to personalize against) — everyone else just gets
  // the general catalog below, unchanged.
  const perspective = window.EcosPerspective ? window.EcosPerspective.get().perspective : null;
  const companies = perspective === "company" && window.CompanyStore ? window.CompanyStore.getCompanies() : [];
  const [actingCompanyId, setActingCompanyId] = React.useState(
    () => (window.EcosPerspective ? window.EcosPerspective.get().actingCompanyId : null)
  );
  React.useEffect(() => {
    if (!window.EcosPerspective || !window.EcosPerspective.subscribe) return;
    return window.EcosPerspective.subscribe(() => setActingCompanyId(window.EcosPerspective.get().actingCompanyId));
  }, []);
  const company = perspective === "company"
    ? resolveActingCompanyForGrowthTools(companies, actingCompanyId)
    : null;
  const recommendations = React.useMemo(
    () => (company && window.GrowthToolsStore ? window.GrowthToolsStore.getRecommendedGrowthTools(company, { limit: 5 }) : []),
    [company && company.id]
  );
  const showProfileNudge = !!company && !hasSufficientProfileForRecommendations(company);

  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [providerFilter, setProviderFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState("all");

  const categories = React.useMemo(
    () => Array.from(new Set(allItems.map((i) => i.category).filter(Boolean))),
    [allItems]
  );
  const providers = React.useMemo(
    () => Array.from(new Set(allItems.map((i) => i.provider).filter(Boolean))),
    [allItems]
  );
  // Only real stage values present in the dataset — never the full STAGES
  // vocabulary, so the control never implies fictional coverage.
  const stagesInData = React.useMemo(() => {
    const set = new Set();
    allItems.forEach((i) => (i.stages || []).forEach((s) => set.add(s)));
    return Array.from(set);
  }, [allItems]);

  const filtered = allItems.filter((item) =>
    matchesQuery(item, q) &&
    (typeFilter === "all" || item.category === typeFilter) &&
    (providerFilter === "all" || item.provider === providerFilter) &&
    (stageFilter === "all" || (item.stages || []).includes(stageFilter))
  );

  const hasActiveFilters = !!q || typeFilter !== "all" || providerFilter !== "all" || stageFilter !== "all";
  const resetFilters = () => {
    setQ("");
    setTypeFilter("all");
    setProviderFilter("all");
    setStageFilter("all");
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>כלי צמיחה</h2>
          <div className="sub">תוכניות, מענקים, תשתיות והזדמנויות שיכולים לעזור לחברה להתקדם{allItems.length ? ` · ${allItems.length} כלים` : ""}</div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--amber)" }}>
        <div className="flex center gap-8">
          <window.I.AlertTriangle size={14} style={{ color: "var(--amber)", flex: "none" }} />
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{GROWTH_DISCLAIMER}</div>
        </div>
      </div>

      {/* G2 — deterministic recommendations, company perspective only. No
          active company (partner/admin viewers, or an empty CompanyStore)
          means no personalization claim at all: the general catalog below
          is shown with no recommendation section, per spec. */}
      {!!company && (
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot violet" /> מומלץ עבורכם</div>
          </div>
          <div className="muted tiny" style={{ marginBottom: showProfileNudge ? 6 : 10 }}>
            ההתאמה מבוססת על פרופיל החברה ואינה מהווה אישור זכאות.
          </div>
          {showProfileNudge && (
            <div className="muted tiny" style={{ marginBottom: 10 }}>
              השלמת פרטי החברה תאפשר התאמה טובה יותר של כלי צמיחה.
            </div>
          )}
          {!recommendations.length ? (
            <div className="muted" style={{ padding: "6px 0" }}>אין כרגע המלצות להצגה.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {recommendations.map((rec) => <RecommendedToolCard key={rec.tool.id} rec={rec} />)}
            </div>
          )}
        </div>
      )}

      {!!allItems.length && (
        <div className="card" style={{ padding: 14 }}>
          <div className="flex center gap-8 wrap">
            <div className="search" style={{ flex: "none", width: 280, padding: "5px 10px" }}>
              <window.I.Search size={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם, גוף, תיאור…" />
            </div>
            <div className="grow" />
            {hasActiveFilters && (
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={resetFilters}>
                <window.I.X size={12} /> איפוס סינון
              </button>
            )}
          </div>

          {!!categories.length && (
            <>
              <div className="divider" />
              <div className="flex center gap-8 wrap">
                <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>סוג</span>
                <span className={"chip" + (typeFilter === "all" ? " active" : "")} onClick={() => setTypeFilter("all")}>הכל</span>
                {categories.map((c) => (
                  <span key={c} className={"chip" + (typeFilter === c ? " active" : "")} onClick={() => setTypeFilter(c)}>{c}</span>
                ))}
              </div>
            </>
          )}

          {!!providers.length && (
            <>
              <div className="divider" />
              <div className="flex center gap-8 wrap">
                <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>גוף מפעיל</span>
                <span className={"chip" + (providerFilter === "all" ? " active" : "")} onClick={() => setProviderFilter("all")}>הכל</span>
                {providers.map((p) => (
                  <span key={p} className={"chip" + (providerFilter === p ? " active" : "")} onClick={() => setProviderFilter(p)}>{p}</span>
                ))}
              </div>
            </>
          )}

          {!!stagesInData.length && (
            <>
              <div className="divider" />
              <div className="flex center gap-8 wrap">
                <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>שלב</span>
                <span className={"chip" + (stageFilter === "all" ? " active" : "")} onClick={() => setStageFilter("all")}>הכל</span>
                {stagesInData.map((s) => (
                  <span key={s} className={"chip" + (stageFilter === s ? " active" : "")} onClick={() => setStageFilter(s)}>{GT_STAGE_LABEL_HE[s] || s}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!allItems.length ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <window.I.Trend size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          <div style={{ fontSize: 15, color: "var(--text-2)" }}>אין כרגע כלי צמיחה במאגר המקומי.</div>
        </div>
      ) : !filtered.length ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <window.I.Search size={28} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          <div style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 12 }}>לא נמצאו כלי צמיחה שמתאימים לסינון שבחרת.</div>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={resetFilters}>איפוס סינון</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map((item) => <GrowthToolCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

window.GrowthToolsView = GrowthToolsView;
window.GROWTH_DISCLAIMER = GROWTH_DISCLAIMER;
