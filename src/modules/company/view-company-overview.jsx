// ecos — Company perspective overview (Company Environment v1).
// A lightweight, company-facing landing surface. Reuses existing stores/views —
// no new data shapes, no new storage keys, no store branching on perspective.
// Perspective only selects WHICH company is shown; it is never permission.

// Display-only Hebrew labels for readiness/stage raw English values — same
// pattern already duplicated per-file across view-companies.jsx / view-needs.jsx
// / view-matches.jsx / view-dashboard.jsx (the stored values stay untouched).
const CO_READINESS_LABEL_HE = {
  "Initial contact": "קשר ראשוני",
  "Mapped": "ממופה",
  "Verified": "מאומת",
  "Active": "פעיל",
  "Strategic": "אסטרטגי",
  "Needs update": "דורש עדכון",
};
const CO_STAGE_LABEL_HE = {
  "Concept": "שלב רעיוני",
  "Seed": "Seed",
  "Series A": "Series A",
  "Series B": "Series B",
  "Series C": "Series C",
  "Growth": "צמיחה",
  "Mature": "בוגרת",
  "Public": "ציבורית",
  "Unknown": "לא ידוע",
};

// "Acting company" resolution (eligibility rule + preferred/demo defaults)
// centralized in window.ActingCompanyResolver — shared with app.jsx/
// view-opportunity-detail.jsx/view-growth-tools.jsx so every "acting
// company" call site agrees, including the demo-default (Rakia when
// nothing is explicitly selected yet).
function resolveActingCompany(companies, actingCompanyId) {
  if (!window.ActingCompanyResolver) return companies[0] || null;
  return window.ActingCompanyResolver.resolve(companies, actingCompanyId);
}

function CompanyOverviewView({ onNav, onOpenCompany, onOpenOpportunity }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  // Local mirror of EcosPerspective.actingCompanyId — a plain useMemo can't
  // react to session state that changes outside props/state, so the selector
  // below updates this alongside the store call.
  const [actingCompanyId, setActingCompanyId] = React.useState(
    () => (window.EcosPerspective ? window.EcosPerspective.get().actingCompanyId : null)
  );
  // Compact feed filter (see filteredFeedItems below) — declared here,
  // unconditionally, alongside actingCompanyId so it always runs before the
  // early "no company" return (Rules of Hooks: hook order must not depend on
  // company being present).
  const [feedFilter, setFeedFilter] = React.useState("all");
  const company = React.useMemo(() => resolveActingCompany(companies, actingCompanyId), [companies, actingCompanyId]);
  const companyOptions = React.useMemo(
    () => companies.filter((c) => window.ActingCompanyResolver ? window.ActingCompanyResolver.isEligibleActingCompany(c) : true),
    [companies]
  );
  const handleSelectCompany = (id) => {
    if (window.EcosPerspective) window.EcosPerspective.setActingCompanyId(id);
    setActingCompanyId(id || null);
  };

  if (!company) {
    return (
      <div className="view">
        <div className="card">אין חברות זמינות במאגר המקומי כרגע.</div>
      </div>
    );
  }

  // Company Feed (F2) — one ranked local stream from CompanyFeed.listCompanyFeed,
  // replacing the previous separate relevant-needs / ecosystem-opportunities /
  // growth-tools cards. Deterministic, recomputed per acting company; no fetch,
  // no live update, no AI. Growth tools are the selector's unranked partition —
  // split out here so they render as a visually distinct catalog footer, never
  // interleaved with ranked matches.
  const feedItems = React.useMemo(
    () => (window.CompanyFeed ? window.CompanyFeed.listCompanyFeed(company) : []),
    [company.id]
  );
  const rankedFeedItems = feedItems.filter((item) => item.type !== "growth-tool");
  // Compact feed filter — reuses the existing item.type values already used
  // for each card's badge (need/opportunity); no new category system, no
  // fetched data. Counts are real, derived from rankedFeedItems above.
  const opportunityCount = rankedFeedItems.filter((item) => item.type === "opportunity").length;
  const needCount = rankedFeedItems.filter((item) => item.type === "need").length;
  const filteredFeedItems = feedFilter === "all" ? rankedFeedItems : rankedFeedItems.filter((item) => item.type === feedFilter);
  // Locally marked interest (Company Interest v1) — a separate, additive
  // record store, joined here against the same opportunity records above.
  // No partner-side visibility, no contact sent; this is the company's own
  // local list of what it marked in this demo view.
  const markedOpportunities = React.useMemo(() => {
    if (!window.OpportunityInterestStore || !window.NeedsStore) return [];
    const interests = window.OpportunityInterestStore.listForCompany(company.id);
    if (!interests.length) return [];
    const opportunities = window.NeedsStore.listNeeds().filter((n) => n.sourceType === "opportunity");
    return interests
      .map((i) => opportunities.find((o) => o.id === i.opportunityId))
      .filter(Boolean);
  }, [company.id]);
  const confidenceLabel = (c) => c === "high" ? "התאמה גבוהה" : c === "medium" ? "התאמה בינונית" : "התאמה נמוכה";

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>פיד הזדמנויות</h2>
          <div className="sub">{company.name} · תצוגת דמו · לא כניסת משתמש</div>
        </div>
        {/* Acting-company switch — relocated here (compact, inline in the
            page header) from the old full-width ActingOrgSelector card, so
            it no longer occupies the primary center area. Same underlying
            behavior (EcosPerspective.setActingCompanyId via
            handleSelectCompany) — just a plain compact select. */}
        {companyOptions.length > 1 && (
          <div className="ops">
            <select
              className="select"
              style={{ fontSize: 12.5, maxWidth: 220 }}
              value={company.id}
              onChange={(e) => handleSelectCompany(e.target.value)}
              title="חברה בתצוגה · בחירת תצוגת דמו בלבד · לא כניסת משתמש"
            >
              {companyOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Feed-first workspace grid: center column is flexible/dominant, left
          column is a fixed narrow ~260px "מה חשוב עכשיו" context rail. The
          app's own navigation sidebar (shell.jsx) is untouched and stays on
          the right, outside this grid. Below ~920px the left column stacks
          above the feed instead of narrowing it further. */}
      <style>{`
        .co-feed-grid { display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }
        @media (max-width: 920px) {
          .co-feed-grid { grid-template-columns: 1fr; }
          .co-feed-grid > .co-context-col { order: -1; }
        }
      `}</style>
      <div className="co-feed-grid">
        {/* Center — dominant, flexible: the feed is the primary, continuous
            page content, rendered directly in the workspace flow (not wrapped
            in one large dashboard-style .card). Each feed item is its own
            flat, bordered row — that's the only per-item container. The page
            title itself lives once, in the view-head above (h2) — no second
            "פיד הזדמנויות" heading repeated here. */}
        <div className="col gap-10">
          <div className="muted tiny">מבוסס על התאמה דטרמיניסטית · ללא AI · לא עדכון חי</div>

          {/* Compact filter row — always visible (even at zero items, so the
              feed shell never collapses to nothing), existing item.type
              values only (need/opportunity), real counts from
              rankedFeedItems above; no new category system, no
              fetched/fabricated data. Zero counts are shown honestly, not
              hidden. */}
          <div className="flex gap-6 wrap">
            <button type="button" className={"chip" + (feedFilter === "all" ? " active" : "")} onClick={() => setFeedFilter("all")}>הכל · {rankedFeedItems.length}</button>
            <button type="button" className={"chip" + (feedFilter === "opportunity" ? " active" : "")} onClick={() => setFeedFilter("opportunity")}>הזדמנויות · {opportunityCount}</button>
            <button type="button" className={"chip" + (feedFilter === "need" ? " active" : "")} onClick={() => setFeedFilter("need")}>צרכים · {needCount}</button>
          </div>

          {!filteredFeedItems.length ? (
            <div className="col gap-4" style={{ padding: "14px", background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
              <div className="muted">
                {!rankedFeedItems.length ? "אין פריטים בפיד כרגע." : "אין פריטים בקטגוריה זו כרגע."}
              </div>
              <div className="muted tiny">
                {!rankedFeedItems.length
                  ? "פרסמו הזדמנות בתצוגת שותף כדי לראות אותה בפיד החברה."
                  : "נסו את \"הכל\" כדי לראות את שאר הפריטים בפיד."}
              </div>
            </div>
          ) : (
            <div className="col gap-8">
              {filteredFeedItems.map((item) => {
                const isOpportunity = item.type === "opportunity";
                const description = item.raw && item.raw.description;
                return (
                  <div key={item.id} style={{ padding: "12px 14px", background: "var(--bg-2)", border: "1px solid var(--line-1)", borderInlineStart: `3px solid var(--${isOpportunity ? "amber" : "violet"})`, borderRadius: 8 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div className="flex center gap-8" style={{ minWidth: 0 }}>
                        <span className={"pill " + (isOpportunity ? "amber" : "violet")} style={{ fontSize: 10.5, flex: "none" }}>{isOpportunity ? "הזדמנות" : "צורך"}</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{item.title}</div>
                      </div>
                      {item.ranked && typeof item.score === "number" && (
                        <span className="mono tabnum" style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", flex: "none" }}>{item.score}%</span>
                      )}
                    </div>
                    <div className="mono tiny" style={{ color: "var(--text-4)", marginTop: 4 }}>{item.sourceLabel}</div>
                    {!!description && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>{description}</div>}
                    {item.ranked && item.confidence && (
                      <div style={{ marginTop: 6 }}><span className="pill" style={{ fontSize: 10.5 }}>{confidenceLabel(item.confidence)}</span></div>
                    )}
                    {!!item.reasons.length && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>{item.reasons.join(" · ")}</div>}
                    {isOpportunity && (
                      <button type="button" className="btn btn-primary" style={{ fontSize: 12.5, marginTop: 10 }} onClick={() => onOpenOpportunity && onOpenOpportunity(item.raw.id)}>
                        פתח הזדמנות ←
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Growth tools — no longer a competing catalog card in the primary
              flow; still fully reachable via the existing growth-tools view
              (window.GrowthToolsStore / GrowthToolsView are untouched). */}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ alignSelf: "flex-start", fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}
            onClick={() => onNav && onNav("growth-tools")}
          >
            <window.I.Trend size={13} /> כלי צמיחה — קטלוג אוצר מקומי ←
          </button>
        </div>

        {/* Left — "מה חשוב עכשיו", fixed ~260px. Same underlying data/actions
            as before (unchanged stores/handlers); rendered as a compact
            information rail (spacing + subtle dividers) rather than stacked
            dashboard cards. Company identity itself already lives in the
            page header/company selector above — not repeated here. */}
        <div className="col co-context-col" style={{ gap: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.02em" }}>מה חשוב עכשיו</div>

          {/* Real feed count — same number already shown next to the feed
              heading. No destination beyond this page, so kept as plain text
              rather than a fake link. */}
          <div>
            <div style={{ fontSize: 13, color: "var(--text-1)" }}>{rankedFeedItems.length} פריטים רלוונטיים</div>
            <div className="muted tiny">בפיד החברה כרגע</div>
          </div>

          <div style={{ borderTop: "1px solid var(--line-1)" }} />

          {/* הזדמנויות שסומנו — locally marked interest (Company Interest v1),
              joined from OpportunityInterestStore + NeedsStore. Local to this
              company's view; no partner-side visibility, no contact sent.
              Title-only list (capped at 3, real overflow count) — same
              underlying data and onOpenOpportunity action as before, full
              detail still reachable by opening an item. */}
          <div>
            <div className="flex center between" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>הזדמנויות שסומנו</div>
              {!!markedOpportunities.length && <span className="pill" style={{ fontSize: 10 }}>{markedOpportunities.length}</span>}
            </div>
            <div className="muted tiny" style={{ marginBottom: 6 }}>נתוני דמו מקומיים · לא נשלחה פנייה לשותף</div>
            {!markedOpportunities.length ? (
              <div className="muted tiny">עדיין לא סומנו הזדמנויות.</div>
            ) : (
              <div className="col gap-4">
                {markedOpportunities.slice(0, 3).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="btn btn-ghost"
                    style={{ justifyContent: "flex-start", fontSize: 12, padding: "3px 0", overflow: "hidden" }}
                    onClick={() => onOpenOpportunity && onOpenOpportunity(o.id)}
                    title={o.title}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                  </button>
                ))}
                {markedOpportunities.length > 3 && (
                  <div className="muted tiny">+{markedOpportunities.length - 3} נוספות</div>
                )}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--line-1)" }} />

          {/* Profile — compact context action, not a repeated identity card
              (name/logo already in the page header). readiness/stage shown
              only when the company actually has them. */}
          {(company.readiness || company.stage) && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>פרופיל החברה</div>
              <div className="flex gap-4 wrap">
                {company.readiness && <span className="pill" style={{ fontSize: 9.5 }}>{CO_READINESS_LABEL_HE[company.readiness] || company.readiness}</span>}
                {company.stage && <span className="pill" style={{ fontSize: 9.5 }}>{CO_STAGE_LABEL_HE[company.stage] || company.stage}</span>}
              </div>
            </div>
          )}

          {(company.readiness || company.stage) && <div style={{ borderTop: "1px solid var(--line-1)" }} />}

          {/* Shortcuts — same handlers as before. */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>קיצורי דרך</div>
            <div className="col gap-6">
              <button type="button" className="btn" style={{ justifyContent: "flex-start", fontSize: 12.5 }} onClick={() => onOpenCompany && onOpenCompany(company.id)}>
                <window.I.Settings size={13} /> עדכון פרופיל
              </button>
              <button type="button" className="btn" style={{ justifyContent: "flex-start", fontSize: 12.5 }} onClick={() => onNav && onNav("needs")}>
                <window.I.Plus size={13} /> הוספת צורך
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo-only controls — kept fully functional (same shared component,
          also used by Admin dashboard / Partner overview, unmodified
          internally) but relocated to the bottom of the page so they no
          longer occupy the primary center area above the feed. */}
      {window.DemoFlowStrip && <window.DemoFlowStrip active="company" />}
    </div>
  );
}

window.CompanyOverviewView = CompanyOverviewView;
