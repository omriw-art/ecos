// ecos — Capability Map view
// Organizes the ecosystem by space building blocks.
// Shows coverage level, gaps, and per-capability company drill-down.

const CAPABILITY_DEFS = [
  {
    id: "earth-obs",
    desc: "הדמיה, ניטור כדור הארץ וחישה מרחוק ממסלול לוויין",
    examples: ["Multi-spectral Imaging", "Video from Space", "Change Detection"],
  },
  {
    id: "comms",
    desc: "תקשורת לוויינית, אנטנות, מודמים ופרוטוקולי RF",
    examples: ["Phased Array Antenna", "Ka/Ku Band", "LEO Broadband"],
  },
  {
    id: "ai-data",
    desc: "AI, עיבוד נתוני לוויין, למידת מכונה וניתוח תמונה",
    examples: ["Object Detection", "Signal Processing", "Onboard AI"],
  },
  {
    id: "propulsion",
    desc: "הנעה חללית — מנועים, חמצנים ומיקרו-תרסיסים",
    examples: ["Electric Thruster", "Green Propellant", "Cold Gas System"],
  },
  {
    id: "manufacturing",
    desc: "ייצור, מבנים, רכיבים חלליים ואינטגרציית מערכות",
    examples: ["Structural Components", "Space-Grade PCB", "System Integration"],
  },
  {
    id: "launchers",
    desc: "שיגור לחלל, כלי נשיאה, rideshare ופריסת לוויינים",
    examples: ["Small Launch Vehicle", "Rideshare", "Deployment Service"],
  },
  {
    id: "sar",
    desc: 'SAR ופסיקות מכ"מ לתצפית ביטחונית ואזרחית',
    examples: ["SAR Sensor", "ISAR", "GMTI Radar"],
  },
  {
    id: "life-sci",
    desc: "ביולוגיה, רפואה ומניעת קרינה בסביבת חלל",
    examples: ["Radiation Protection", "Bio-Sensors", "Space Medicine"],
  },
  {
    id: "energy",
    desc: "אנרגיה בחלל — פאנלים סולאריים, סוללות ומערכות כוח",
    examples: ["Solar Array", "Space Battery", "Power Management"],
  },
  // "Virtual" capabilities — not yet mapped to a sector, displayed as gaps
  {
    id: "ground-seg",
    label: "מקטע קרקע",
    desc: "תחנות קרקע, מרכזי שליטה ותוכנה מבצעית",
    examples: ["Ground Station", "Mission Control Software", "TT&C"],
    virtual: true,
  },
  {
    id: "navigation",
    label: "ניווט ו-GNC",
    desc: "שליטה על מיקום ואוריינטציה, GNSS וניווט עצמאי",
    examples: ["Star Tracker", "GNSS Receiver", "Attitude Control"],
    virtual: true,
  },
  {
    id: "isam",
    label: "שירותים בחלל",
    desc: "תיקון לוויינים, תדלוק בחלל וניקוי פסולת חלל",
    examples: ["On-Orbit Refueling", "Debris Removal", "Servicing Arm"],
    virtual: true,
  },
];

const LEVEL_META = {
  strong:   { label: "חזק",    color: "var(--green)",  bg: "oklch(0.20 0.08 145 / 0.55)" },
  moderate: { label: "בינוני", color: "var(--amber)",  bg: "oklch(0.20 0.08 80  / 0.55)" },
  weak:     { label: "חלש",    color: "var(--rose)",   bg: "oklch(0.18 0.06 20  / 0.55)" },
  none:     { label: "פער",    color: "var(--text-4)", bg: "var(--bg-2)"                  },
};

function CapabilitiesView({ onOpenCompany, onNav }) {
  const [selected, setSelected] = React.useState(null);
  const [sortBy,   setSortBy]   = React.useState("count");

  // Build coverage data once
  const coverage = React.useMemo(() => CAPABILITY_DEFS.map((def) => {
    if (def.virtual) {
      return { ...def, sector: null, companies: [], count: 0, level: "none" };
    }
    const sector    = window.SECTORS.find((s) => s.id === def.id);
    const companies = window.COMPANIES
      .filter((c) => c.sectors.includes(def.id))
      .sort((a, b) => b.score - a.score);
    const count = companies.length;
    const level = count >= 12 ? "strong" : count >= 5 ? "moderate" : count >= 1 ? "weak" : "none";
    return { ...def, sector, companies, count, level };
  }), []);

  const sorted = React.useMemo(() =>
    [...coverage].sort((a, b) => sortBy === "count" ? b.count - a.count : a.count - b.count),
    [coverage, sortBy]
  );

  const coveredCount = coverage.filter((c) => c.count > 0).length;
  const strongCount  = coverage.filter((c) => c.level === "strong").length;
  const gapCount     = coverage.filter((c) => c.level === "none" || c.level === "weak").length;
  const maxCount     = Math.max(...coverage.map((c) => c.count), 1);
  const nonVirtual   = coverage.filter((c) => !c.virtual);
  const avgPerCap    = Math.round(window.COMPANIES.length / nonVirtual.length);

  const selectedData = selected ? coverage.find((c) => c.id === selected) : null;

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>מפת יכולות החלל</h2>
          <div className="sub">
            אבני בניין של מרחב חלל ·{" "}
            {coveredCount} מתוך {coverage.length} מיוצגות ·{" "}
            {gapCount} פערים
          </div>
        </div>
        <div className="ops">
          <div className="seg">
            <button className={sortBy === "count" ? "active" : ""} onClick={() => setSortBy("count")}>לפי כיסוי</button>
            <button className={sortBy === "gap"   ? "active" : ""} onClick={() => setSortBy("gap")}>פערים ראשון</button>
          </div>
          <button className="btn" onClick={() => onNav("companies")}>
            <window.I.Building size={13} /> כל החברות
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <CapKpi label="יכולות פעילות"  value={coveredCount} trend={`מתוך ${coverage.length} אבני בניין`} accent="oklch(0.7 0.18 250 / 0.18)" />
        <CapKpi label="כיסוי חזק"      value={strongCount}  trend="12+ חברות בתחום"                       accent="oklch(0.7 0.18 145 / 0.18)" />
        <CapKpi label="פערים זוהו"     value={gapCount}     trend="פחות מ-5 חברות"                        accent="oklch(0.7 0.18 20  / 0.18)" />
        <CapKpi label="ממוצע לתחום"    value={avgPerCap}    trend="חברות לכל יכולת"                      accent="oklch(0.7 0.18 295 / 0.18)" />
      </div>

      {/* Blocks grid + optional detail sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: selectedData ? "1.4fr 1fr" : "1fr", gap: 14 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: 12,
          alignContent: "start",
        }}>
          {sorted.map((cap) => (
            <CapBlock
              key={cap.id}
              cap={cap}
              active={selected === cap.id}
              maxCount={maxCount}
              onClick={() => setSelected(selected === cap.id ? null : cap.id)}
            />
          ))}
        </div>

        {selectedData && (
          <CapDetail
            cap={selectedData}
            onOpenCompany={onOpenCompany}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* Gap analysis */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">
            <span className="dot rose" /> ניתוח פערים — יכולות חסרות או חלשות
          </div>
          <span className="pill rose">{gapCount} פערים</span>
        </div>
        {gapCount === 0 ? (
          <div style={{ padding: 20, color: "var(--text-3)", textAlign: "center" }}>כל היכולות מכוסות באופן סביר</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {coverage
              .filter((c) => c.level === "none" || c.level === "weak")
              .sort((a, b) => a.count - b.count)
              .map((cap) => <GapRow key={cap.id} cap={cap} onClick={() => setSelected(cap.id)} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Local KPI card (mirrors Dashboard's Kpi) ── */
function CapKpi({ label, value, trend, accent }) {
  return (
    <div className="kpi" style={{ "--accent": accent }}>
      <div className="label">{label}</div>
      <div className="value tabnum">{value}</div>
      <div className="trend">
        <span style={{ color: "var(--text-3)", fontSize: 11 }}>{trend}</span>
      </div>
    </div>
  );
}

/* ── Capability block card ── */
function CapBlock({ cap, active, maxCount, onClick }) {
  const meta  = LEVEL_META[cap.level] || LEVEL_META.none;
  const color = cap.sector?.color || "var(--line-3)";

  return (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        borderRadius: 12,
        background: active ? "oklch(0.17 0.05 270 / 0.9)" : "var(--bg-1)",
        border: `1px solid ${active ? color : "var(--line-1)"}`,
        cursor: "default",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--line-1)"; }}
    >
      {/* Right-side accent bar */}
      <div style={{
        position: "absolute", top: 0, insetInlineEnd: 0,
        width: 3, height: "100%",
        background: color,
        opacity: active ? 1 : 0.35,
        borderRadius: "0 12px 12px 0",
      }} />

      {/* Title + level badge */}
      <div className="flex between center" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {cap.label || cap.sector?.label || cap.id}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100,
          background: meta.bg, color: meta.color,
        }}>
          {meta.label}
        </span>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 10 }}>
        {cap.desc}
      </div>

      {/* Coverage bar */}
      <div className="flex between" style={{ fontSize: 10.5, color: "var(--text-4)", marginBottom: 4 }}>
        <span>כיסוי</span>
        <span className="mono tabnum">{cap.count} חברות</span>
      </div>
      <div style={{ height: 3, background: "var(--bg-2)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          width: `${(cap.count / maxCount) * 100}%`,
          height: "100%",
          background: color,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Company preview chips */}
      {cap.companies.length > 0 ? (
        <div className="flex wrap gap-4">
          {cap.companies.slice(0, 3).map((c) => (
            <span key={c.id} style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 5,
              background: "var(--bg-2)", border: "1px solid var(--line-1)", color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              {c.name.length > 17 ? c.name.slice(0, 16) + "…" : c.name}
            </span>
          ))}
          {cap.companies.length > 3 && (
            <span style={{ fontSize: 10, color: "var(--text-4)" }}>+{cap.companies.length - 3}</span>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text-4)", fontStyle: "italic" }}>
          אין חברות ממופות
        </div>
      )}
    </div>
  );
}

/* ── Detail panel (slides in on click) ── */
function CapDetail({ cap, onOpenCompany, onClose }) {
  const color      = cap.sector?.color || "var(--text-3)";
  const stageOrder = ["Seed", "Series A", "Series B", "Series C", "Growth", "Public"];
  const groups     = stageOrder
    .map((s) => ({ stage: s, companies: cap.companies.filter((c) => c.stage === s) }))
    .filter((g) => g.companies.length > 0);

  return (
    <div className="card" style={{ position: "sticky", top: 14, maxHeight: "78vh", overflow: "auto" }}>
      <div className="card-hd" style={{ marginBottom: 12 }}>
        <div className="card-title">
          <span className="swatch" style={{ background: color }} />
          {cap.label || cap.sector?.label || cap.id}
        </div>
        <button className="icon-btn" onClick={onClose}>
          <window.I.X size={14} />
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 12 }}>
        {cap.desc}
      </div>

      {cap.examples && (
        <>
          <div className="mono tiny" style={{
            color: "var(--text-4)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 6,
          }}>
            טכנולוגיות נפוצות
          </div>
          <div className="flex wrap gap-4" style={{ marginBottom: 14 }}>
            {cap.examples.map((ex) => (
              <span key={ex} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 6,
                background: "var(--bg-2)", border: "1px solid var(--line-1)", color: "var(--text-3)",
              }}>{ex}</span>
            ))}
          </div>
        </>
      )}

      <div className="divider" />

      {cap.count === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-4)" }}>
          <window.I.AlertTriangle size={26} style={{ color: "var(--rose)", display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontWeight: 500, fontSize: 13 }}>פער אסטרטגי</div>
          <div style={{ fontSize: 11.5, marginTop: 4 }}>אין חברות ממופות ליכולת זו</div>
        </div>
      ) : (
        <div className="col gap-14">
          {groups.map((g) => (
            <div key={g.stage}>
              <div className="flex center gap-6" style={{ marginBottom: 6 }}>
                <span className="pill">{g.stage}</span>
                <span className="mono tiny" style={{ color: "var(--text-4)" }}>{g.companies.length} חברות</span>
              </div>
              <div className="col gap-4">
                {g.companies.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    className="flex center gap-8"
                    onClick={() => onOpenCompany(c.id)}
                    style={{
                      padding: "7px 10px", borderRadius: 8, cursor: "default",
                      background: "var(--bg-2)", border: "1px solid var(--line-1)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-2)"}
                  >
                    <CoLogo company={c} size={26} />
                    <div className="col grow" style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {c.name}
                      </div>
                      <div className="mono" style={{ fontSize: 9.5, color: "var(--text-4)" }}>{c.hq}</div>
                    </div>
                    <ScoreRing value={c.score} size={26} stroke={2} />
                  </div>
                ))}
                {g.companies.length > 10 && (
                  <div style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", paddingTop: 2 }}>
                    +{g.companies.length - 10} נוספות
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Gap analysis row ── */
function GapRow({ cap, onClick }) {
  const isTotal = cap.count === 0;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 14px", borderRadius: 10,
        display: "flex", alignItems: "center", gap: 12, cursor: "default",
        background: isTotal ? "oklch(0.14 0.04 20 / 0.35)" : "oklch(0.15 0.04 60 / 0.35)",
        border: `1px solid ${isTotal ? "oklch(0.28 0.10 20)" : "oklch(0.28 0.08 65)"}`,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flex: "none",
        background: isTotal ? "oklch(0.18 0.08 20 / 0.5)" : "oklch(0.18 0.06 65 / 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isTotal
          ? <window.I.AlertTriangle size={14} style={{ color: "var(--rose)"  }} />
          : <window.I.AlertTriangle size={14} style={{ color: "var(--amber)" }} />
        }
      </div>
      <div className="col grow">
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
          {cap.label || cap.sector?.label || cap.id}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          {isTotal ? "אין חברות — פער מלא" : `${cap.count} חברות בלבד — כיסוי חלש`}
        </div>
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 100,
        background: isTotal ? "oklch(0.22 0.08 20 / 0.5)" : "oklch(0.22 0.06 65 / 0.5)",
        color: isTotal ? "var(--rose)" : "var(--amber)",
      }}>
        {isTotal ? "חסר" : `${cap.count} חב׳`}
      </span>
    </div>
  );
}

window.CapabilitiesView = CapabilitiesView;
