// ecos — הזדמנויות צמיחה (Growth Opportunities).
// Renders GrowthToolsStore's curated local reference catalog. This is a
// static demo reference list — no eligibility checks, no scraping, no
// external integrations, no automatic application. External links (if any
// item ever has one) are plain reference links, never a "you qualify"/apply
// action.

const GROWTH_DISCLAIMER = "מאגר הפניות אוצר לצורכי הדגמה · אינו בדיקת זכאות ואינו מחובר למערכות חיצוניות. אמתו מול הגוף הרלוונטי.";

function GrowthToolCard({ item }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot amber" /> {item.title}</div>
        <span className="pill">{item.category}</span>
      </div>
      <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
        <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.provider}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 10 }}>{item.description}</div>
      <div className="flex gap-6 wrap">
        {item.stageFit && <span className="pill" style={{ fontSize: 10.5 }}>שלב: {item.stageFit}</span>}
        {item.sectorFit && <span className="pill" style={{ fontSize: 10.5 }}>תחום: {item.sectorFit}</span>}
        {(item.tags || []).map((t) => <span key={t} className="pill" style={{ fontSize: 10.5 }}>{t}</span>)}
      </div>
      {item.url && (
        <div style={{ marginTop: 10 }}>
          <a className="btn btn-ghost" href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, display: "inline-flex" }}>
            <window.I.Link size={12} /> קישור לעיון (חיצוני)
          </a>
        </div>
      )}
    </div>
  );
}

function GrowthToolsView() {
  const items = window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools() : [];

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הזדמנויות צמיחה</h2>
          <div className="sub">מאגר מקומי של תוכניות, מענקים ופיילוטים באקוסיסטם · תצוגת דמו</div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--amber)" }}>
        <div className="flex center gap-8">
          <window.I.AlertTriangle size={14} style={{ color: "var(--amber)", flex: "none" }} />
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{GROWTH_DISCLAIMER}</div>
        </div>
      </div>

      {!items.length ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <window.I.Trend size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          <div style={{ fontSize: 15, color: "var(--text-2)" }}>אין כרגע הזדמנויות צמיחה במאגר המקומי.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {items.map((item) => <GrowthToolCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

window.GrowthToolsView = GrowthToolsView;
window.GROWTH_DISCLAIMER = GROWTH_DISCLAIMER;
