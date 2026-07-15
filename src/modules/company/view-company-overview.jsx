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

function resolveActingCompany(companies) {
  const perspective = window.EcosPerspective ? window.EcosPerspective.get() : { actingCompanyId: null };
  const acting = perspective.actingCompanyId ? companies.find((c) => c.id === perspective.actingCompanyId) : null;
  // Safe seeded default — deterministic, not a real "logged in" identity.
  return acting || companies[0] || null;
}

function CompanyOverviewView({ onNav, onOpenCompany }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  const company = React.useMemo(() => resolveActingCompany(companies), [companies]);

  if (!company) {
    return (
      <div className="view">
        <div className="card">אין חברות זמינות במאגר המקומי כרגע.</div>
      </div>
    );
  }

  const capabilities = (company.capabilities && company.capabilities.length) ? company.capabilities : (company.tech || []);
  const sectors = Array.isArray(company.sectors) ? company.sectors : [];
  const relevantNeeds = window.getRelevantNeedsForCompany ? window.getRelevantNeedsForCompany(company).slice(0, 5) : [];
  const ourNeeds = window.NeedsStore ? window.NeedsStore.listNeeds().filter((n) => n.sourceOrgId === company.id) : [];
  // Locally published partner opportunities (Partner Opportunity Publishing v1)
  // — same NeedsStore records, not a separate feed. Not personalized/matched,
  // just the raw local list, same honesty stance as the Growth Tools preview.
  const ecosystemOpportunities = window.NeedsStore
    ? window.NeedsStore.listNeeds().filter((n) => n.sourceType === "opportunity").slice(0, 5)
    : [];
  const confidenceLabel = (c) => c === "high" ? "התאמה גבוהה" : c === "medium" ? "התאמה בינונית" : "התאמה נמוכה";
  // Real preview, not personalized — same catalog everyone sees, no eligibility claim.
  const growthPreview = window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools().slice(0, 3) : [];

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>סקירת חברה</h2>
          <div className="sub">תצוגת דמו · {company.name} · לא כניסת משתמש</div>
        </div>
      </div>

      {window.DemoFlowStrip && <window.DemoFlowStrip active="company" />}

      {/* 1. סקירת חברה */}
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

      {/* 2. הפרופיל שלנו */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> הפרופיל שלנו</div></div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>עריכת פרטי הארגון מתבצעת בפרופיל המלא הקיים — אין כפילות נתונים.</div>
        <button className="btn btn-primary" onClick={() => onOpenCompany && onOpenCompany(company.id)}>
          <window.I.Building size={13} /> פתח את הפרופיל המלא
        </button>
      </div>

      {/* 3. צרכים רלוונטיים */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot violet" /> צרכים רלוונטיים</div>
          {!!relevantNeeds.length && <span className="pill">{relevantNeeds.length}</span>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>מבוסס על יכולות, תגיות, צרכים והצעות · דטרמיניסטי, ללא AI</div>
        {!relevantNeeds.length ? (
          <div className="muted" style={{ padding: "8px 0" }}>לא נמצאו צרכים רלוונטיים לחברה זו במאגר המקומי כרגע.</div>
        ) : (
          <div className="col gap-8">
            {relevantNeeds.map((r) => (
              <div key={r.need.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div className="flex center between" style={{ gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{r.need.title}</div>
                  <span className="mono tabnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)", flex: "none" }}>{r.score}%</span>
                </div>
                <div className="flex center gap-6 wrap" style={{ marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>{confidenceLabel(r.confidence)}</span>
                  {r.need.sourceOrgName && <span className="mono tiny" style={{ color: "var(--text-4)" }}>{r.need.sourceOrgName}</span>}
                </div>
                {!!r.reasons.length && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{r.reasons.join(" · ")}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. הצרכים שלנו */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot green" /> הצרכים שלנו</div>
          {!!ourNeeds.length && <span className="pill">{ourNeeds.length}</span>}
        </div>
        {!ourNeeds.length ? (
          <div className="muted" style={{ padding: "8px 0" }}>עדיין לא הוגדרו צרכים עבור החברה בתצוגת הדמו.</div>
        ) : (
          <div className="col gap-8">
            {ourNeeds.map((n) => (
              <div key={n.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{n.title}</div>
                <div className="flex center gap-6 wrap" style={{ marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>{n.sourceLabel}</span>
                  {n.priority && <span className="pill" style={{ fontSize: 10.5 }}>עדיפות {window.TaxonomyStore ? window.TaxonomyStore.labelFor("priority", n.priority) : n.priority}</span>}
                  {n.status && <span className="pill" style={{ fontSize: 10.5 }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("status", n.status) : n.status}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. הזדמנויות מהאקו-סיסטם — locally published partner opportunities
          (NeedsStore, sourceType: "opportunity"). Separate feed from Growth
          Tools below — not merged, not eligibility-checked. */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot amber" /> הזדמנויות מהאקו-סיסטם</div>
          {!!ecosystemOpportunities.length && <span className="pill">{ecosystemOpportunities.length}</span>}
        </div>
        <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
          {window.DemoTag && <window.DemoTag>נתוני דמו מקומיים</window.DemoTag>}
          {window.DemoTag && <window.DemoTag>לא הופץ מחוץ למערכת</window.DemoTag>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>הזדמנויות שפורסמו על ידי שותפים בתצוגת הדמו המקומית</div>
        {!ecosystemOpportunities.length ? (
          <div className="muted" style={{ padding: "8px 0" }}>
            אין עדיין הזדמנויות שפורסמו בדמו. כשיפורסמו הזדמנויות בתצוגת שותף, הן יופיעו כאן.
          </div>
        ) : (
          <div className="col gap-8">
            {ecosystemOpportunities.map((o) => (
              <div key={o.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{o.title}</div>
                {!!o.description && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>{o.description}</div>}
                <div className="flex center gap-6 wrap" style={{ marginTop: 6 }}>
                  {o.needType && <span className="pill" style={{ fontSize: 10.5 }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", o.needType) : o.needType}</span>}
                  {o.priority && <span className="pill" style={{ fontSize: 10.5 }}>עדיפות {window.TaxonomyStore ? window.TaxonomyStore.labelFor("priority", o.priority) : o.priority}</span>}
                  {o.sourceOrgName && <span className="mono tiny" style={{ color: "var(--text-4)" }}>{o.sourceOrgName}</span>}
                </div>
                <div className="muted tiny" style={{ marginTop: 6 }}>מקור: הזדמנות מקומית שפורסמה בתצוגת שותף · פורסם מקומית בדמו · לא הופץ מחוץ למערכת</div>
              </div>
            ))}
          </div>
        )}
        {!!ecosystemOpportunities.length && (
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, marginTop: 10 }} onClick={() => onNav && onNav("needs")}>
            פתח בלוח צרכים ←
          </button>
        )}
      </div>

      {/* 6. הצעדים הבאים */}
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
            <window.I.Compass size={13} /> בדקו את הצרכים הרלוונטיים למעלה בעמוד זה
          </div>
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("growth-tools")}>
            <window.I.Trend size={13} /> עברו להזדמנויות צמיחה
          </button>
        </div>
      </div>

      {/* 7. הזדמנויות צמיחה — real preview from GrowthToolsStore, not a mock */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot amber" /> הזדמנויות צמיחה</div>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => onNav && onNav("growth-tools")}>
            לכל ההזדמנויות ←
          </button>
        </div>
        <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
          {window.DemoTag && <window.DemoTag>קטלוג אוצר קבוע</window.DemoTag>}
          {window.DemoTag && <window.DemoTag>לא בדיקת זכאות</window.DemoTag>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>
          קטלוג אחיד לכולם, שונה מהזדמנויות שפורסמו על ידי שותפים למעלה. {window.GROWTH_DISCLAIMER || "מאגר הפניות אוצר לצורכי הדגמה · אינו בדיקת זכאות ואינו מחובר למערכות חיצוניות. אמתו מול הגוף הרלוונטי."}
        </div>
        {!growthPreview.length ? (
          <div className="muted" style={{ padding: "6px 0" }}>אין כרגע הזדמנויות צמיחה במאגר המקומי.</div>
        ) : (
          <div className="col gap-8">
            {growthPreview.map((g) => (
              <div key={g.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div className="flex center between" style={{ gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{g.title}</div>
                  <span className="pill" style={{ fontSize: 10.5, flex: "none" }}>{g.category}</span>
                </div>
                <div className="mono tiny" style={{ color: "var(--text-4)", marginTop: 2 }}>{g.provider}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.CompanyOverviewView = CompanyOverviewView;
