// ecos — Explainable matching engine view.
// Two columns: source company picker + deterministic suggested company matches.

const CONFIDENCE_META = {
  high:   { label: "גבוהה",  tone: "green" },
  medium: { label: "בינונית", tone: "amber" },
  low:    { label: "נמוכה",  tone: "" },
};

// Display-only Hebrew labels for the readiness/stage fields' raw English
// values (company.readiness / company.stage stay untouched).
const READINESS_LABEL_HE = {
  "Initial contact": "קשר ראשוני",
  "Mapped": "ממופה",
  "Verified": "מאומת",
  "Active": "פעיל",
  "Strategic": "אסטרטגי",
  "Needs update": "דורש עדכון",
};
const STAGE_LABEL_HE = {
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

function MatchesView({ onOpenCompany }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  const [picked, setPicked] = React.useState(() => companies[0]?.id || null);

  React.useEffect(() => {
    if (!companies.find((company) => company.id === picked)) {
      setPicked(companies[0]?.id || null);
    }
  }, [companies.length, picked]);

  if (!companies.length) {
    return (
      <div className="view">
        <div className="card">אין חברות זמינות להתאמות.</div>
      </div>
    );
  }

  const source = companies.find((company) => company.id === picked) || companies[0];
  const sourceCapabilities = window.CapabilityRegistry.getCompanyCapabilities(source);
  const matches = window.MatchEngine.generateMatchesForCompany(source, companies, { limit: 8 });
  const top = matches.slice(0, 8);
  const overview = window.MatchEngine.generateCompanyMatches(companies, { limit: 20 });

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>מנוע התאמות מוסבר</h2>
          <div className="sub">התאמות דטרמיניסטיות בין חברות, לפי יכולות, צרכים, הצעות, שלב ומוכנות.</div>
        </div>
        <div className="ops">
          <button className="btn" disabled title="עריכת משקלים — בקרוב">
            <window.I.Settings size={13} /> משקלים קבועים
          </button>
          <button className="btn btn-primary" disabled title="ההתאמות מחושבות מהנתונים המקומיים — מתעדכן אוטומטית">
            <window.I.Sparkles size={13} /> מתעדכן מהנתונים
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>

        {/* Source company column */}
        <div className="card flush" style={{ padding: 0, height: "fit-content" }}>
          <div className="card-hd" style={{ padding: "16px 16px 10px" }}>
            <div className="card-title"><span className="dot" /> חברות מקור</div>
          </div>
          <div className="col">
            {companies.slice(0, 40).map((company) => (
              <div key={company.id} onClick={() => setPicked(company.id)}
                   className="flex center gap-10"
                   style={{
                     padding: "10px 16px",
                     borderInlineStart: picked === company.id ? "2px solid var(--blue)" : "2px solid transparent",
                     background: picked === company.id ? "var(--bg-2)" : "transparent",
                     cursor: "default", transition: "all 0.12s",
                   }}>
                <CoLogo company={company} size={34} />
                <div className="col" style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{String(STAGE_LABEL_HE[company.stage] || company.stage || "Seed").toUpperCase()}</div>
                </div>
                <span className="mono tiny" style={{ color: "var(--text-3)" }}>{window.CapabilityRegistry.getCompanyCapabilityIds(company).length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Match column */}
        <div className="col gap-14">

          {/* Source summary */}
          <div className="card">
            <div className="flex gap-14 center">
              <CoLogo company={source} size={56} />
              <div className="col grow">
                <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600 }}>{source.name}</div>
                <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.05em" }}>
                  {String(source.hq || "ישראל").toUpperCase()} · {String(STAGE_LABEL_HE[source.stage] || source.stage || "Seed").toUpperCase()}
                </div>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "end" }}>Suggested</div>
                <div style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 600, textAlign: "end" }}>{top.length}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="flex wrap gap-8" style={{ marginBottom: 8 }}>
              <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 4 }}>יכולות</span>
              {sourceCapabilities.slice(0, 8).map((capability) => <span key={capability.id} className="chip">{capability.name}</span>)}
              {!sourceCapabilities.length && <span className="muted tiny">אין יכולות ממופות</span>}
            </div>
            <div className="flex wrap gap-8">
              <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 4 }}>צרכים</span>
              {(source.needs || []).slice(0, 5).map((need, i) => <span key={i} className="chip">{need}</span>)}
              {!(source.needs || []).length && <span className="muted tiny">אין צרכים מוגדרים</span>}
            </div>
          </div>

          {/* Matches */}
          <div className="card flush" style={{ padding: 0 }}>
            <div className="flex center between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)" }}>
              <div className="card-title"><span className="dot violet" /> התאמות מוצעות עבור {source.name}</div>
              <div className="flex center gap-8">
                <span className="pill violet">דטרמיניסטי · ניתן להסבר</span>
                <button className="btn btn-ghost" disabled title="Filtering is not wired in this batch"><window.I.Filter size={12} /></button>
              </div>
            </div>

            <div className="col">
              {top.map((match, idx) => <MatchRow key={match.id} match={match} idx={idx} onOpenCompany={onOpenCompany} />)}
              {!top.length && <div className="muted" style={{ padding: 18 }}>לא נמצאו התאמות מספיק חזקות לחברה זו.</div>}
            </div>
          </div>

          {/* Compare strip */}
          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot" /> השוואה: 3 ההתאמות המובילות</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "120px repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
              <div />
              {top.slice(0, 3).map((match) => (
                <div key={match.id} className="flex center gap-8" style={{ paddingBottom: 8, borderBottom: "1px solid var(--line-1)" }}>
                  <CoLogo company={match.target} size={28} />
                  <div className="col" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{match.target.name}</div>
                    <div className="mono tiny" style={{ color: "var(--text-4)" }}>{match.target.flag} {match.target.country}</div>
                  </div>
                </div>
              ))}
              {[
                { l: "ציון", v: (match) => <span className="mono tabnum" style={{ color: "var(--blue)" }}>{match.score}%</span> },
                { l: "רמת ביטחון", v: (match) => (CONFIDENCE_META[match.confidence] || CONFIDENCE_META.low).label },
                { l: "יכולות משותפות", v: (match) => match.sharedCapabilities.length },
                { l: "משלימות", v: (match) => match.complementaryNeedsOffers.length },
                { l: "מוכנות", v: (match) => READINESS_LABEL_HE[match.target.readiness] || match.target.readiness || "ממופה" },
                { l: "שלב", v: (match) => STAGE_LABEL_HE[match.target.stage] || match.target.stage || "Seed" },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <div style={{ padding: "8px 0", color: "var(--text-3)" }}>{row.l}</div>
                  {top.slice(0, 3).map((match) => <div key={match.id} style={{ padding: "8px 0", color: "var(--text-1)" }}>{row.v(match)}</div>)}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot green" /> האותות המובילים במאגר</div><span className="pill">{overview.length}</span></div>
            <div className="flex wrap gap-6">
              {overview.slice(0, 10).map((match) => (
                <span key={match.id} className="chip">
                  {match.source.name} → {match.target.name} · {match.score}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MatchRow({ match, idx, onOpenCompany }) {
  const meta = CONFIDENCE_META[match.confidence] || CONFIDENCE_META.low;
  return (
    <div className="flex center gap-12"
         style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", cursor: "default" }}
         onClick={() => onOpenCompany(match.target.id)}>
      <div style={{ width: 24, color: "var(--text-4)" }} className="mono tabnum tiny">{String(idx + 1).padStart(2, "0")}</div>
      <CoLogo company={match.target} size={40} />
      <div className="col" style={{ minWidth: 220 }}>
        <div className="flex center gap-6">
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{match.target.name}</div>
          <span className={"pill " + meta.tone} style={{ padding: "1px 5px" }}>{meta.label}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          {match.target.flag} {String(match.target.hq || "").toUpperCase()} · {(window.ORGANIZATION_TYPES || []).find((t) => t.id === match.target.organizationType)?.label || "אחר"}
        </div>
      </div>

      <div className="col" style={{ flex: 1, gap: 6 }}>
        <div className="flex wrap gap-4">
          {match.sharedCapabilities.slice(0, 3).map((capability) => <span key={capability} className="pill">{capability}</span>)}
          {!match.sharedCapabilities.length && <span className="pill">איתותים משלימים</span>}
        </div>
        <div className="tiny" style={{ color: "var(--text-3)" }}>
          {match.reasons[0] || "איתותים תואמים מנתוני החברות המקומיים"}
        </div>
        {!!match.reasons.length && (
          <div className="flex wrap gap-4">
            {match.reasons.slice(1, 3).map((reason) => <span key={reason} className="chip" style={{ fontSize: 10 }}>{reason}</span>)}
          </div>
        )}
      </div>

      <div className="col" style={{ width: 160, gap: 6 }}>
        <div className="flex between" style={{ fontSize: 11.5 }}>
          <span className="mono tiny" style={{ color: "var(--text-3)" }}>SCORE</span>
          <span className="mono tabnum" style={{ color: match.score >= 75 ? "var(--green)" : match.score >= 50 ? "var(--blue)" : "var(--amber)", fontWeight: 600 }}>{match.score}%</span>
        </div>
        <MiniBar value={match.score} color={match.score >= 75 ? "var(--green)" : match.score >= 50 ? "var(--blue)" : "var(--amber)"} />
      </div>

      <button
        className="btn btn-primary"
        style={{ padding: "5px 10px", fontSize: 11.5 }}
        onClick={(event) => { event.stopPropagation(); onOpenCompany(match.target.id); }}
      >
        <window.I.ArrowLeft size={11} /> פתח
      </button>
    </div>
  );
}

window.MatchesView = MatchesView;
