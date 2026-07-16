// ecos — Local opportunity detail (Opportunity Detail v1 + Company Interest v1).
// A small inspection screen for a single partner-published opportunity.
// Not a marketplace: no application flow, no eligibility, no external
// distribution. Reads the exact same NeedsStore record Partner/Company/Admin
// already see — no new store, no new data shape for the opportunity itself.
// "Mark interest" (company perspective only) writes to the separate, additive
// OpportunityInterestStore — never mutates the NeedsStore opportunity record.

// Same partner organizationType set duplicated per-file elsewhere (see
// view-company-overview.jsx's CO_PARTNER_ORG_TYPES) — used only to keep the
// acting-company resolution consistent with the Company overview's own
// exclusion of partner-like orgs, never to gate data access.
const OD_PARTNER_ORG_TYPES = new Set(["investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit"]);

function resolveActingCompanyForInterest() {
  if (!window.EcosPerspective || !window.CompanyStore) return null;
  const actingId = window.EcosPerspective.get().actingCompanyId;
  const companies = window.CompanyStore.getCompanies();
  const eligible = companies.filter((c) => !c.organizationType || !OD_PARTNER_ORG_TYPES.has(c.organizationType));
  const acting = actingId ? eligible.find((c) => c.id === actingId) : null;
  return acting || eligible[0] || companies[0] || null;
}

function OpportunityDetailView({ id, perspective, onNav }) {
  const opportunity = React.useMemo(() => {
    if (!window.NeedsStore || !id) return null;
    return window.NeedsStore.listNeeds().find((n) => n.id === id && n.sourceType === "opportunity") || null;
  }, [id]);

  const actingCompany = React.useMemo(
    () => (perspective === "company" ? resolveActingCompanyForInterest() : null),
    [perspective]
  );
  const [interestVersion, setInterestVersion] = React.useState(0);
  // Distinguishes "just marked it in this view" (shows the full confirmation
  // line) from "was already marked before this page loaded" (shows the short
  // status) — both read the same underlying persisted record.
  const [justMarked, setJustMarked] = React.useState(false);
  const alreadyInterested = React.useMemo(() => {
    if (!window.OpportunityInterestStore || !opportunity || !actingCompany) return false;
    return window.OpportunityInterestStore.hasInterest(opportunity.id, actingCompany.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity, actingCompany, interestVersion]);

  const handleMarkInterest = () => {
    if (!window.OpportunityInterestStore || !opportunity || !actingCompany) return;
    window.OpportunityInterestStore.markInterest(opportunity.id, actingCompany.id);
    setJustMarked(true);
    setInterestVersion((v) => v + 1);
  };

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
        {/* Partner Interest Signals v1 — aggregate count only, same signal
            shown in the Partner overview's published-opportunities list.
            Never names/contacts/scores/status. */}
        {perspective === "partner" && window.OpportunityInterestStore && (
          <div className="muted tiny" style={{ marginTop: 6 }}>
            {window.OpportunityInterestStore.countForOpportunity(opportunity.id) > 0
              ? `סומנו ${window.OpportunityInterestStore.countForOpportunity(opportunity.id)} התעניינויות בדמו`
              : "עדיין לא סומנה התעניינות בדמו"}
          </div>
        )}
      </div>

      {perspective === "company" && (
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot violet" /> סימון עניין</div></div>
          <div className="muted tiny" style={{ marginBottom: 10 }}>סימון עניין הוא מקומי בלבד · לא נוצר קשר עם השותף</div>
          {alreadyInterested ? (
            <div className="muted" style={{ padding: "6px 0" }}>
              {justMarked ? "עניין נשמר מקומית בדמו · לא נשלחה פנייה" : "סומן עניין בדמו"}
            </div>
          ) : actingCompany ? (
            <button type="button" className="btn btn-primary" onClick={handleMarkInterest}>
              <window.I.Star size={13} /> סמן עניין
            </button>
          ) : (
            <div className="muted" style={{ padding: "6px 0" }}>לא נמצאה חברה פעילה בתצוגת דמו כרגע.</div>
          )}
        </div>
      )}

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
