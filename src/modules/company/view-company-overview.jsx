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

// Same partner organizationType set as view-partner-overview.jsx (duplicated
// per-file, same convention as the label maps above) — used only to prefer
// non-partner-like orgs in the "חברה בתצוגה" selector/resolution, never to
// gate data access.
const CO_PARTNER_ORG_TYPES = new Set(["investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit"]);

// Preferred demo default when no acting company is chosen yet — a deliberate
// pick of a clearly-Israeli space company, not whichever happens to be first
// in the seed array (that was previously "tomorrow-io" by accident of seed
// order, not a real choice). Same list duplicated in app.jsx's
// resolveActingCompanyForNav and view-opportunity-detail.jsx's
// resolveActingCompanyForInterest so all three "acting company" resolvers
// agree — falls through safely (to eligible[0]) if none of these ids exist.
const PREFERRED_DEFAULT_COMPANY_IDS = ["ramon-space", "spacepharma", "spaceil"];
function preferredDefaultCompany(eligible) {
  for (const id of PREFERRED_DEFAULT_COMPANY_IDS) {
    const found = eligible.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

function resolveActingCompany(companies, actingCompanyId) {
  const eligible = companies.filter((c) => !c.organizationType || !CO_PARTNER_ORG_TYPES.has(c.organizationType));
  const acting = actingCompanyId ? eligible.find((c) => c.id === actingCompanyId) : null;
  // Safe seeded default — deterministic, not a real "logged in" identity.
  return acting || preferredDefaultCompany(eligible) || eligible[0] || companies[0] || null;
}

function CompanyOverviewView({ onNav, onOpenCompany, onOpenOpportunity }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  // Local mirror of EcosPerspective.actingCompanyId — a plain useMemo can't
  // react to session state that changes outside props/state, so the selector
  // below updates this alongside the store call.
  const [actingCompanyId, setActingCompanyId] = React.useState(
    () => (window.EcosPerspective ? window.EcosPerspective.get().actingCompanyId : null)
  );
  const company = React.useMemo(() => resolveActingCompany(companies, actingCompanyId), [companies, actingCompanyId]);
  const companyOptions = React.useMemo(
    () => companies.filter((c) => !c.organizationType || !CO_PARTNER_ORG_TYPES.has(c.organizationType)),
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

  const capabilities = (company.capabilities && company.capabilities.length) ? company.capabilities : (company.tech || []);
  const sectors = Array.isArray(company.sectors) ? company.sectors : [];
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
  const growthFeedItems = feedItems.filter((item) => item.type === "growth-tool").slice(0, 3);
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
          <div className="sub">תצוגת דמו · {company.name} · לא כניסת משתמש</div>
        </div>
      </div>

      {window.DemoFlowStrip && <window.DemoFlowStrip active="company" />}

      {window.ActingOrgSelector && (
        <window.ActingOrgSelector
          label="חברה בתצוגה"
          options={companyOptions.map((c) => ({ id: c.id, name: c.name }))}
          value={company.id}
          onChange={handleSelectCompany}
          emptyText="אין חברות זמינות במאגר המקומי כרגע."
        />
      )}

      {/* Context strip — company identity, unchanged from the prior layout */}
      <div className="card">
        <div className="flex gap-14" style={{ alignItems: "flex-start" }}>
          <window.CoLogo company={company} size={48} />
          <div className="col grow" style={{ minWidth: 0, gap: 6 }}>
            <div className="flex center gap-8 wrap">
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>{company.name}</div>
              {company.readiness && <span className="pill">{CO_READINESS_LABEL_HE[company.readiness] || company.readiness}</span>}
              {company.stage && <span className="pill">{CO_STAGE_LABEL_HE[company.stage] || company.stage}</span>}
            </div>
            {!!sectors.length && (
              <div className="flex gap-6 wrap">
                {sectors.slice(0, 4).map((s) => <window.SectorPill key={s} id={s} />)}
              </div>
            )}
            {!!company.blurb && <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{company.blurb}</div>}
            {!!capabilities.length && (
              <div className="flex gap-6 wrap" style={{ marginTop: 4 }}>
                {capabilities.slice(0, 8).map((t, i) => <span key={i} className="pill" style={{ fontSize: 10.5 }}>{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        {/* Main column — Company Feed. Widened relative to the side rail, and
            cards read like opportunity posts (type badge, source, title,
            real description, reasons, real score), so the feed reads as the
            dominant surface rather than one card among equals. */}
        <div className="col gap-14">
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><span className="dot violet" /> פיד הזדמנויות</div>
              {!!rankedFeedItems.length && <span className="pill">{rankedFeedItems.length}</span>}
            </div>
            <div className="muted tiny" style={{ marginBottom: 10 }}>מבוסס על התאמה דטרמיניסטית · ללא AI · לא עדכון חי</div>
            {!rankedFeedItems.length ? (
              <div className="col gap-6" style={{ padding: "10px 0" }}>
                <div className="muted">אין פריטים בפיד כרגע.</div>
                <div className="muted tiny">פרסמו הזדמנות בתצוגת שותף כדי לראות אותה בפיד החברה.</div>
              </div>
            ) : (
              <div className="col gap-10">
                {rankedFeedItems.map((item) => {
                  const isOpportunity = item.type === "opportunity";
                  const description = item.raw && item.raw.description;
                  return (
                    <div key={item.id} style={{ padding: 14, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderInlineStart: `3px solid var(--${isOpportunity ? "amber" : "violet"})`, borderRadius: 10 }}>
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
          </div>

          {/* Growth tools — visually distinct, unranked reference catalog.
              Never interleaved with the ranked feed above. */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><span className="dot amber" /> כלי צמיחה</div>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => onNav && onNav("growth-tools")}>
                לכל ההזדמנויות ←
              </button>
            </div>
            <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
              {window.DemoTag && <window.DemoTag>קטלוג אוצר קבוע</window.DemoTag>}
              {window.DemoTag && <window.DemoTag>לא בדיקת זכאות</window.DemoTag>}
            </div>
            <div className="muted tiny" style={{ marginBottom: 10 }}>
              קטלוג אחיד לכולם, ללא דירוג אישי. {window.GROWTH_DISCLAIMER || "מאגר הפניות אוצר לצורכי הדגמה · אינו בדיקת זכאות ואינו מחובר למערכות חיצוניות. אמתו מול הגוף הרלוונטי."}
            </div>
            {!growthFeedItems.length ? (
              <div className="muted" style={{ padding: "6px 0" }}>אין כלי צמיחה כרגע.</div>
            ) : (
              <div className="col gap-8">
                {growthFeedItems.map((item) => (
                  <div key={item.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{item.title}</div>
                    {item.subtitle && <div className="mono tiny" style={{ color: "var(--text-4)", marginTop: 2 }}>{item.subtitle}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side rail — stable, non-discovery items */}
        <div className="col gap-14">
          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot" /> הפרופיל שלנו</div></div>
            <div className="muted tiny" style={{ marginBottom: 10 }}>עריכת פרטי הארגון מתבצעת בפרופיל המלא הקיים — אין כפילות נתונים.</div>
            <button className="btn btn-primary" onClick={() => onOpenCompany && onOpenCompany(company.id)}>
              <window.I.Building size={13} /> פתח את הפרופיל המלא
            </button>
          </div>

          {/* הזדמנויות שסומנו — locally marked interest (Company Interest v1),
              joined from OpportunityInterestStore + NeedsStore. Local to this
              company's view; no partner-side visibility, no contact sent. */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><span className="dot violet" /> הזדמנויות שסומנו</div>
              {!!markedOpportunities.length && <span className="pill">{markedOpportunities.length}</span>}
            </div>
            <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
              {window.DemoTag && <window.DemoTag>נתוני דמו מקומיים</window.DemoTag>}
              {window.DemoTag && <window.DemoTag>לא נשלחה פנייה</window.DemoTag>}
            </div>
            <div className="muted tiny" style={{ marginBottom: 10 }}>
              הסימון נשמר עבור החברה שנבחרה בתצוגת הדמו · לא נשלחה פנייה לשותף
            </div>
            {!markedOpportunities.length ? (
              <div className="muted" style={{ padding: "8px 0" }}>
                עדיין לא סומנו הזדמנויות עבור החברה בתצוגת הדמו.
              </div>
            ) : (
              <div className="col gap-8">
                {markedOpportunities.map((o) => (
                  <div key={o.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{o.title}</div>
                      {o.needType && <span className="pill" style={{ fontSize: 10.5, flex: "none" }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", o.needType) : o.needType}</span>}
                    </div>
                    {!!o.description && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>{o.description}</div>}
                    {o.sourceOrgName && <div className="mono tiny" style={{ color: "var(--text-4)", marginTop: 4 }}>{o.sourceOrgName}</div>}
                    <div className="flex center gap-6 wrap" style={{ marginTop: 6 }}>
                      {window.DemoTag && <window.DemoTag>סומן מקומית בדמו</window.DemoTag>}
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ fontSize: 12, marginTop: 8 }} onClick={() => onOpenOpportunity && onOpenOpportunity(o.id)}>
                      פתח הזדמנות ←
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot" /> הצעדים הבאים</div></div>
            <div className="col gap-8">
              <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onOpenCompany && onOpenCompany(company.id)}>
                <window.I.Settings size={13} /> עדכנו את פרופיל החברה
              </button>
              <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("needs")}>
                <window.I.Plus size={13} /> הוסיפו צורך חדש
              </button>
              <div className="flex center gap-8" style={{ padding: "6px 2px", color: "var(--text-3)", fontSize: 13 }}>
                <window.I.Compass size={13} /> עברו לפיד למעלה כדי לבדוק הזדמנויות רלוונטיות
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CompanyOverviewView = CompanyOverviewView;
