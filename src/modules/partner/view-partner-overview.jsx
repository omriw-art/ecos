// ecos — Partner perspective overview (Partner Environment v1).
// A lightweight, partner-facing landing surface. Partner is NOT a new
// entity/store — it's a lens over CompanyStore filtered by organizationType.
// Reuses existing stores/views; no new data shapes, no new storage keys, no
// store branching on perspective. Perspective only selects WHAT is shown; it
// is never permission.

const PARTNER_ORG_TYPES = new Set(["investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit"]);
const PARTNER_NEED_TYPES = new Set(["partner", "pilot", "customer", "research", "challenge"]);

function resolvePartnerOrg(companies) {
  // Deterministic, not a real "logged in" identity — same pattern as the
  // company overview's seeded fallback. EcosPerspective.actingCompanyId is
  // intentionally null outside the company perspective, so partner v1 picks
  // the first matching organization instead of extending perspective state.
  return companies.find((c) => PARTNER_ORG_TYPES.has(c.organizationType)) || null;
}

function PartnerOverviewView({ onNav, onOpenCompany }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  const partnerOrg = React.useMemo(() => resolvePartnerOrg(companies), [companies]);

  const collaborationNeeds = React.useMemo(() => {
    if (!window.NeedsStore) return [];
    return window.NeedsStore.listNeeds().filter((n) => n.needType && PARTNER_NEED_TYPES.has(n.needType)).slice(0, 6);
  }, []);

  const growthPreview = window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools().slice(0, 3) : [];
  const collaborationCategories = Array.from(PARTNER_NEED_TYPES).map((needType) => ({
    value: needType,
    label: window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", needType) : needType,
  }));

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>סביבת שותף</h2>
          <div className="sub">תצוגת דמו · לא כניסת משתמש</div>
        </div>
      </div>

      {/* 1. סביבת שותף */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> מה זו סביבת השותף</div></div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65 }}>
          תצוגה זו מיועדת לגופים כמו משקיעים, מאיצים, אקדמיה, מחקר, ממשל ונותני שירות המעורבים באקוסיסטם.
          זוהי תצוגת דמו בלבד — החלפת התצוגה אינה כניסת משתמש ואינה מעניקה הרשאות אמיתיות; כל הנתונים מוצגים מהמאגר המקומי.
        </div>
        {partnerOrg && (
          <div className="flex center gap-8 wrap" style={{ marginTop: 10 }}>
            <span className="pill">{window.orgTypeLabel ? window.orgTypeLabel(partnerOrg.organizationType) : partnerOrg.organizationType}</span>
          </div>
        )}
      </div>

      {/* 2. פרופיל השותף */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> פרופיל השותף</div></div>
        {!partnerOrg ? (
          <div className="muted" style={{ padding: "8px 0" }}>לא נמצא ארגון שותף לדוגמה במאגר המקומי כרגע.</div>
        ) : (
          <div className="flex gap-14" style={{ alignItems: "flex-start" }}>
            <window.CoLogo company={partnerOrg} size={44} />
            <div className="col grow" style={{ minWidth: 0, gap: 6 }}>
              <div className="flex center gap-8 wrap">
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{partnerOrg.name}</div>
                <span className="pill">{window.orgTypeLabel ? window.orgTypeLabel(partnerOrg.organizationType) : partnerOrg.organizationType}</span>
              </div>
              {!!(partnerOrg.sectors && partnerOrg.sectors.length) && (
                <div className="flex gap-6 wrap">
                  {partnerOrg.sectors.slice(0, 4).map((s) => <window.SectorPill key={s} id={s} />)}
                </div>
              )}
              {!!partnerOrg.blurb && <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{partnerOrg.blurb}</div>}
              <button className="btn btn-ghost" style={{ fontSize: 12.5, alignSelf: "flex-start" }} onClick={() => onOpenCompany && onOpenCompany(partnerOrg.id)}>
                פתח פרופיל מלא ←
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. הזדמנויות לפרסום — truthful placeholder only, no fake publishing */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot amber" /> הזדמנויות לפרסום</div></div>
        <div className="muted" style={{ padding: "6px 0" }}>
          בשלב הבא ניתן יהיה לפרסם קול קורא, פיילוט, מעבדה פתוחה או צורך לשיתוף פעולה.
        </div>
        <div className="muted tiny" style={{ marginTop: 6 }}>
          יכולת הפרסום אינה זמינה עדיין בתצוגת הדמו — אין כאן פרסום פעיל או הפצה חיצונית.
        </div>
      </div>

      {/* 4. צרכים ותחומי עניין */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot violet" /> צרכים ותחומי עניין</div>
          {!!collaborationNeeds.length && <span className="pill">{collaborationNeeds.length}</span>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>צרכים מהמאגר המקומי הרלוונטיים לשיתוף פעולה, פיילוטים ומחקר · ללא AI</div>
        {!collaborationNeeds.length ? (
          <div className="muted" style={{ padding: "8px 0" }}>לא נמצאו כרגע צרכים רלוונטיים לשיתוף פעולה במאגר המקומי.</div>
        ) : (
          <div className="col gap-8">
            {collaborationNeeds.map((n) => (
              <div key={n.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{n.title}</div>
                <div className="flex center gap-6 wrap" style={{ marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", n.needType) : n.needType}</span>
                  {n.sourceOrgName && <span className="mono tiny" style={{ color: "var(--text-4)" }}>{n.sourceOrgName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. שיתופי פעולה */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot green" /> שיתופי פעולה</div></div>
        <div className="muted tiny" style={{ marginBottom: 8 }}>קטגוריות שיתוף פעולה נפוצות באקוסיסטם המקומי</div>
        <div className="flex gap-6 wrap" style={{ marginBottom: 12 }}>
          {collaborationCategories.map((c) => <span key={c.value} className="pill">{c.label}</span>)}
        </div>
        <div className="divider" />
        <div className="col gap-8" style={{ marginTop: 10 }}>
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("needs")}>
            <window.I.Compass size={13} /> עברו ללוח הצרכים לבדיקת פרטים נוספים
          </button>
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("growth-tools")}>
            <window.I.Trend size={13} /> עיינו בהזדמנויות צמיחה
          </button>
        </div>
      </div>

      {/* 6. הזדמנויות צמיחה — read-only reference preview, shared with Company */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot amber" /> קטלוג משאבים</div>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => onNav && onNav("growth-tools")}>
            לכל ההזדמנויות ←
          </button>
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>{window.GROWTH_DISCLAIMER || "מאגר הפניות אוצר לצורכי הדגמה · אינו בדיקת זכאות ואינו מחובר למערכות חיצוניות. אמתו מול הגוף הרלוונטי."}</div>
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

window.PartnerOverviewView = PartnerOverviewView;
