// ecos — Dashboard (Mission Control overview)
// Answers: what capabilities exist, who has them, where are the gaps, who to contact next.

function Dashboard({ onOpenCompany, onNav }) {
  const { COMPANIES, SECTOR_DIST, ACTIVITY, FUNNEL, PEOPLE, CONNECTIONS } = window;

  // Real computed stats
  const seedCount   = COMPANIES.filter((c) => c.stage === "Seed").length;
  const matureCount = COMPANIES.filter((c) => c.stage === "Growth" || c.stage === "Public").length;
  const topCity     = (() => {
    const freq = {};
    COMPANIES.forEach((c) => { if (c.hq) freq[c.hq] = (freq[c.hq] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || ["תל אביב", 0];
  })();

  const topMatched  = [...COMPANIES].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Mission Control</h2>
          <div className="sub">
            מיפוי אקוסיסטם ביטחון וסייבר חלל ישראלי —{" "}
            {COMPANIES.length} חברות HT, {CONNECTIONS.length} חיבורים, {PEOPLE.length} עובדים מקושרים
          </div>
        </div>
        <div className="ops">
          <span className="pill green">
            <span className="swatch" style={{ background: "var(--green)" }} />
            <span className="mono">SYNC · LIVE</span>
          </span>
          <button className="btn" onClick={() => window.toast("מייצא דו״ח… (demo)", "ok")}>
            <window.I.Upload size={13} /> ייצוא דו"ח
          </button>
          <button className="btn btn-primary" onClick={() => onNav("onboard")}>
            <window.I.Plus size={13} /> הוסף חברה
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <Kpi
          label="חברות במאגר"
          value={COMPANIES.length}
          trend="Defense & Cyber · HT בלבד"
          accent="oklch(0.7 0.18 250 / 0.18)"
        />
        <Kpi
          label="חיבורים מאומתים"
          value={CONNECTIONS.length}
          trend="בין חברות המאגר"
          accent="oklch(0.7 0.18 295 / 0.18)"
        />
        <Kpi
          label="חברות Seed"
          value={seedCount}
          trend={`${Math.round((seedCount / COMPANIES.length) * 100)}% מהמאגר`}
          accent="oklch(0.78 0.15 80 / 0.18)"
        />
        <Kpi
          label="בוגרות (Growth+)"
          value={matureCount}
          trend="Growth · Public"
          accent="oklch(0.7 0.15 145 / 0.18)"
        />
      </div>

      {/* Row: sector donut + funnel + activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: 14 }}>
        {/* Sector donut */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot violet" /> פילוח לפי תחום</div>
            <button className="btn-ghost btn" onClick={() => onNav("capabilities")}>מפת יכולות</button>
          </div>
          <div className="flex gap-16 center">
            <Donut data={SECTOR_DIST} size={160} />
            <div className="col grow gap-6" style={{ minWidth: 0 }}>
              {SECTOR_DIST.slice(0, 6).map((s) => (
                <div key={s.id} className="flex center gap-8" style={{ fontSize: 12 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: s.color, boxShadow: `0 0 6px ${s.color}`,
                  }} />
                  <span style={{ color: "var(--text-1)" }}>{s.label}</span>
                  <span className="mono tabnum" style={{ marginInlineStart: "auto", color: "var(--text-3)" }}>
                    {s.count}
                  </span>
                </div>
              ))}
              <div className="divider" />
              <div
                className="dim tiny mono"
                style={{ cursor: "default" }}
                onClick={() => onNav("capabilities")}
              >
                + {SECTOR_DIST.length - 6} תחומים נוספים →
              </div>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot" /> מסע אקוסיסטם</div>
            <span className="pill mono">Q2 · 26</span>
          </div>
          <Funnel data={FUNNEL} />
          <div className="divider" />
          <div className="flex between" style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            <span>Conversion: Profiled → Pilot</span>
            <span className="mono tabnum" style={{ color: "var(--green)" }}>
              {((FUNNEL[3].n / FUNNEL[1].n) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot green" /> פעילות אחרונה</div>
            <button className="btn-ghost btn">לכל ההיסטוריה</button>
          </div>
          <div className="col gap-10">
            {ACTIVITY.map((a, i) => <ActivityRow key={i} item={a} />)}
          </div>
        </div>
      </div>

      {/* Row: stage distribution + city distribution + top matches */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {/* Stage distribution */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot" /> פילוח לפי שלב מימון</div>
          </div>
          <StageDist companies={COMPANIES} stages={window.STAGES} />
        </div>

        {/* City distribution */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot cyan" /> ערים מובילות</div>
          </div>
          <CityDist companies={COMPANIES} />
        </div>

        {/* Top matches */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><span className="dot amber" /> חברות הכי רלוונטיות</div>
            <button className="btn-ghost btn" onClick={() => onNav("companies")}>הכל</button>
          </div>
          <div className="col gap-8">
            {topMatched.map((c) => (
              <div
                key={c.id}
                className="flex center gap-10"
                onClick={() => onOpenCompany(c.id)}
                style={{ padding: "6px 8px", borderRadius: 8, cursor: "default", transition: "background 0.1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = ""}
              >
                <CoLogo company={c} size={34} />
                <div className="col grow" style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{c.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{c.hq} · {c.stage}</div>
                </div>
                <ScoreRing value={c.score} size={34} stroke={2.5} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data insights */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot violet" /> תובנות מהמאגר</div>
          <span className="pill violet"><window.I.Sparkles size={10} /> מבוסס נתונים</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <AiInsight
            title="אקוסיסטם early-stage"
            text={`${seedCount} מתוך ${COMPANIES.length} חברות (${Math.round((seedCount / COMPANIES.length) * 100)}%) נמצאות בשלב Seed, ו-${COMPANIES.filter((c) => c.stage === "Series A").length} ב-Series A. רק ${matureCount} חברות הגיעו לשלב Growth או Public — פוטנציאל גדילה משמעותי באקוסיסטם.`}
            tags={["defense", "ai-data"]}
          />
          <AiInsight
            title={`${topCity[0]} — מרכז האקוסיסטם`}
            text={`${topCity[0]} מובילה עם ${topCity[1]} חברות. המאגר מפוזר בעשרות ערים, עם ריכוז בהרצליה, כפר סבא ואזורי התעשייה הצפוניים. פיזור גאוגרפי עם מספר clusters ברורים.`}
            tags={["manufacturing", "defense"]}
          />
          <AiInsight
            title={`${CONNECTIONS.length} חיבורים מאומתים`}
            text={`בין ${COMPANIES.length} החברות הוגדרו ${CONNECTIONS.length} חיבורי שיתוף פעולה, ספקים ופיתוח משותף. לחץ על מפת האקוסיסטם לתצוגה גרפית של הרשת.`}
            tags={["defense", "comms"]}
            action={{ label: "מפת אקוסיסטם", onNav: "map" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Stage distribution bars ── */
function StageDist({ companies, stages }) {
  const maxN = Math.max(...stages.map((s) => companies.filter((c) => c.stage === s).length), 1);
  const hues = [240, 255, 270, 200, 150, 80];
  return (
    <div className="col gap-8">
      {stages.map((stage, i) => {
        const n   = companies.filter((c) => c.stage === stage).length;
        const pct = (n / maxN) * 100;
        return (
          <div key={stage} className="flex center gap-10" style={{ fontSize: 12 }}>
            <div style={{ width: 72, color: "var(--text-2)", flex: "none", fontSize: 11.5 }}>{stage}</div>
            <div className="grow" style={{ position: "relative" }}>
              <div style={{
                width: pct + "%",
                height: 18,
                background: `oklch(0.58 0.18 ${hues[i] || 240})`,
                borderRadius: 4,
                minWidth: n > 0 ? 4 : 0,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div className="mono tabnum" style={{ width: 28, textAlign: "end", color: "var(--text-1)", fontSize: 12 }}>
              {n}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── City distribution bars ── */
function CityDist({ companies }) {
  const freq = {};
  companies.forEach((c) => { if (c.hq) freq[c.hq] = (freq[c.hq] || 0) + 1; });
  const cities = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const maxN   = cities[0]?.[1] || 1;
  return (
    <div className="col gap-8">
      {cities.map(([city, n]) => (
        <div key={city} className="flex center gap-10" style={{ fontSize: 12 }}>
          <div style={{ width: 72, color: "var(--text-2)", flex: "none", fontSize: 11.5 }}>{city}</div>
          <div className="grow">
            <div style={{
              width: `${(n / maxN) * 100}%`,
              height: 18,
              background: "oklch(0.52 0.14 200)",
              borderRadius: 4,
              minWidth: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div className="mono tabnum" style={{ width: 24, textAlign: "end", color: "var(--text-1)", fontSize: 12 }}>
            {n}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── KPI card ── */
function Kpi({ label, value, trend, accent }) {
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

/* ── Activity row ── */
function ActivityRow({ item }) {
  const tagColor = {
    intro:  "var(--blue)",
    ai:     "var(--violet)",
    flag:   "var(--amber)",
    opp:    "var(--green)",
    reject: "var(--rose)",
  }[item.tag] || "var(--text-3)";
  return (
    <div className="flex gap-8 center" style={{ fontSize: 12.5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: 50,
        background: tagColor, boxShadow: `0 0 6px ${tagColor}`, flex: "none",
      }} />
      <span style={{ flex: 1, color: "var(--text-2)" }}>
        <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{item.who}</span>{" "}
        {item.what}{" "}
        <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{item.to}</span>
      </span>
      <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.t}</span>
    </div>
  );
}

/* ── Data insight card ── */
function AiInsight({ title, text, tags, action }) {
  return (
    <div style={{
      padding: 14, borderRadius: 10,
      background: "linear-gradient(180deg, oklch(0.16 0.04 290), oklch(0.13 0.025 285))",
      border: "1px solid oklch(0.30 0.08 295)",
    }}>
      <div className="flex center gap-6" style={{ marginBottom: 8 }}>
        <window.I.Sparkles size={13} style={{ color: "var(--violet)" }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{text}</div>
      <div className="flex between center" style={{ marginTop: 10 }}>
        <div className="flex gap-4 wrap">
          {tags.map((t) => <SectorPill key={t} id={t} />)}
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
