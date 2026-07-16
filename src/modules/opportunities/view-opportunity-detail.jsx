// ecos — Local opportunity detail (Opportunity Detail v1).
// A small inspection screen for a single partner-published opportunity.
// Not a marketplace: no application flow, no eligibility, no external
// distribution. Reads the exact same NeedsStore record Partner/Company/Admin
// already see — no new store, no new data shape.

function OpportunityDetailView({ id, perspective, onNav }) {
  const opportunity = React.useMemo(() => {
    if (!window.NeedsStore || !id) return null;
    return window.NeedsStore.listNeeds().find((n) => n.id === id && n.sourceType === "opportunity") || null;
  }, [id]);

  const backTarget = perspective === "partner" ? "partner-overview" : perspective === "company" ? "company-overview" : "dashboard";
  const backLabel = perspective === "partner" ? "חזרה לסביבת שותף" : perspective === "company" ? "חזרה לסביבת חברה" : "חזרה ללוח הניהול";

  if (!opportunity) {
    return (
      <div className="view">
        <div className="view-head">
          <div>
            <h2>הזדמנות</h2>
            <div className="sub">תצוגת דמו · לא כניסת משתמש</div>
          </div>
        </div>
        <div className="card">
          <div className="muted" style={{ padding: "8px 0" }}>
            ההזדמנות המבוקשת לא נמצאה במאגר המקומי — ייתכן שנמחקה או שהקישור אינו תקין.
          </div>
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => onNav && onNav(backTarget)}>
            <window.I.ArrowRight size={13} /> {backLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>{opportunity.title}</h2>
          <div className="sub">הזדמנות מקומית שפורסמה בדמו · לא כניסת משתמש</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot amber" /> פרטי ההזדמנות</div>
          {opportunity.needType && (
            <span className="pill">{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", opportunity.needType) : opportunity.needType}</span>
          )}
        </div>
        {!!opportunity.description && (
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 10 }}>{opportunity.description}</div>
        )}
        <div className="flex center gap-6 wrap" style={{ marginBottom: 10 }}>
          {opportunity.sourceOrgName && <span className="pill" style={{ fontSize: 10.5 }}>מקור: {opportunity.sourceOrgName}</span>}
          {opportunity.priority && (
            <span className="pill" style={{ fontSize: 10.5 }}>עדיפות {window.TaxonomyStore ? window.TaxonomyStore.labelFor("priority", opportunity.priority) : opportunity.priority}</span>
          )}
          {opportunity.status && (
            <span className="pill" style={{ fontSize: 10.5 }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("status", opportunity.status) : opportunity.status}</span>
          )}
        </div>
        <div className="muted tiny">פורסם מקומית בדמו · לא הופץ מחוץ למערכת</div>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> צעדים נוספים</div></div>
        <div className="col gap-8">
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav(backTarget)}>
            <window.I.ArrowRight size={13} /> {backLabel}
          </button>
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("needs")}>
            <window.I.Compass size={13} /> פתח בלוח צרכים
          </button>
          {/* Same disabled+tooltip "coming soon" convention used elsewhere
              (e.g. view-companies.jsx's "בקש introduction") — not a fake
              contact flow, just an honest not-yet-built affordance. */}
          <button type="button" className="btn" disabled title="יצירת קשר — בקרוב" style={{ justifyContent: "flex-start" }}>
            <window.I.Mail size={13} /> צור קשר
          </button>
        </div>
      </div>
    </div>
  );
}

window.OpportunityDetailView = OpportunityDetailView;
