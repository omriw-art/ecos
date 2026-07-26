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
  return (
    <div className="card">
      <div className="flex center gap-6" style={{ marginBottom: 6 }}>
        <window.I.Building size={12} style={{ color: "var(--text-4)", flex: "none" }} />
        <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.provider}</span>
      </div>
      <div className="card-hd" style={{ marginBottom: item.division ? 4 : 8 }}>
        <div className="card-title"><span className="dot amber" /> {item.title}</div>
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

function GrowthToolsView() {
  const allItems = React.useMemo(
    () => (window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools() : []),
    []
  );

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

      {/* G2 insertion point — no matching/scoring exists yet; kept small and
          honest on purpose so it never implies a recommendation that hasn't
          been computed. */}
      <div className="card" style={{ padding: 14 }}>
        <div className="flex center gap-8">
          <window.I.Sparkles size={13} style={{ color: "var(--text-4)", flex: "none" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>מומלץ עבורכם</div>
            <div className="muted tiny">המלצות מותאמות לפי פרופיל החברה יופיעו כאן בהמשך.</div>
          </div>
        </div>
      </div>

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
