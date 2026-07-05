// ecos — Matching engine: employee × companies
// Two columns: people picker (left), recommended companies (right) with explainable scoring.

function MatchesView({ onOpenCompany }) {
  const { PEOPLE, COMPANIES, SECTORS } = window;
  const [picked, setPicked] = React.useState(PEOPLE[0].id);
  const p = PEOPLE.find((x) => x.id === picked);

  // Score per company for this person.
  const scored = COMPANIES.map((c) => {
    const sectorOverlap = c.sectors.filter((s) => p.interests.includes(s)).length;
    const focusBoost = c.tech.join(" ").toLowerCase().split(" ").filter((w) =>
      p.focus.join(" ").toLowerCase().includes(w.slice(0, 4))
    ).length;
    const base = c.score;
    const totalRaw = sectorOverlap * 14 + focusBoost * 4 + base * 0.35 + (p.matches.includes(c.id) ? 22 : 0);
    const total = Math.min(99, Math.round(totalRaw));
    return { c, total, sectorOverlap, focusBoost, hand: p.matches.includes(c.id) };
  }).sort((a, b) => b.total - a.total);

  const top = scored.slice(0, 8);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>מנוע התאמות חכם</h2>
          <div className="sub">מתאים בין עובדים בארגון לבין חברות באקוסיסטם, לפי תחומי עניין, מטרות וצרכים.</div>
        </div>
        <div className="ops">
          <button className="btn"><window.I.Settings size={13} /> שינוי משקלים</button>
          <button className="btn btn-primary"><window.I.Sparkles size={13} /> צור Matches חדש</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>

        {/* People column */}
        <div className="card flush" style={{ padding: 0, height: "fit-content" }}>
          <div className="card-hd" style={{ padding: "16px 16px 10px" }}>
            <div className="card-title"><span className="dot" /> עובדים בארגון</div>
          </div>
          <div className="col">
            {PEOPLE.map((person) => (
              <div key={person.id} onClick={() => setPicked(person.id)}
                   className="flex center gap-10"
                   style={{
                     padding: "10px 16px",
                     borderInlineStart: picked === person.id ? "2px solid var(--blue)" : "2px solid transparent",
                     background: picked === person.id ? "var(--bg-2)" : "transparent",
                     cursor: "default", transition: "all 0.12s",
                   }}>
                <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${person.color}, oklch(from ${person.color} 0.4 c h))` }}>{person.avatar}</div>
                <div className="col" style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{person.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{person.role.toUpperCase()}</div>
                </div>
                <span className="mono tiny" style={{ color: "var(--text-3)" }}>{person.matches.length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Match column */}
        <div className="col gap-14">

          {/* Person summary */}
          <div className="card">
            <div className="flex gap-14 center">
              <div className="sidebar-avatar" style={{ width: 56, height: 56, fontSize: 18, background: `linear-gradient(135deg, ${p.color}, oklch(from ${p.color} 0.4 c h))` }}>{p.avatar}</div>
              <div className="col grow">
                <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600 }}>{p.name}</div>
                <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.05em" }}>{p.role.toUpperCase()} · {p.dept.toUpperCase()}</div>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "end" }}>Matches</div>
                <div style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 600, textAlign: "end" }}>{top.length}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="flex wrap gap-8" style={{ marginBottom: 8 }}>
              <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 4 }}>תחומי עניין</span>
              {p.interests.map((i) => <SectorPill key={i} id={i} />)}
            </div>
            <div className="flex wrap gap-8">
              <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 4 }}>פוקוס</span>
              {p.focus.map((f, i) => <span key={i} className="chip">{f}</span>)}
            </div>
          </div>

          {/* Matches */}
          <div className="card flush" style={{ padding: 0 }}>
            <div className="flex center between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)" }}>
              <div className="card-title"><span className="dot violet" /> מומלצות עבור {p.name}</div>
              <div className="flex center gap-8">
                <span className="pill violet"><window.I.Sparkles size={10} /> ME-Score · Auto</span>
                <button className="btn btn-ghost"><window.I.Filter size={12} /></button>
              </div>
            </div>

            <div className="col">
              {top.map((m, idx) => <MatchRow key={m.c.id} m={m} idx={idx} person={p} onClick={() => onOpenCompany(m.c.id)} />)}
            </div>
          </div>

          {/* Compare strip */}
          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot" /> השוואה: 3 ההמלצות המובילות</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "120px repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
              <div />
              {top.slice(0, 3).map((m) => (
                <div key={m.c.id} className="flex center gap-8" style={{ paddingBottom: 8, borderBottom: "1px solid var(--line-1)" }}>
                  <CoLogo company={m.c} size={28} />
                  <div className="col" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{m.c.name}</div>
                    <div className="mono tiny" style={{ color: "var(--text-4)" }}>{m.c.flag} {m.c.country}</div>
                  </div>
                </div>
              ))}
              {[
                { l: "Score", k: "total", v: (m) => <span className="mono tabnum" style={{ color: "var(--blue)" }}>{m.total}%</span> },
                { l: "Sector overlap", v: (m) => `${m.sectorOverlap} תחומים` },
                { l: "Readiness", v: (m) => m.c.readiness },
                { l: "Stage", v: (m) => m.c.stage },
                { l: "Funding", v: (m) => m.c.fundingM > 0 ? `$${m.c.fundingM}M` : "—" },
                { l: "סנכרון אחרון", v: () => "לפני 2 ש׳" },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <div style={{ padding: "8px 0", color: "var(--text-3)" }}>{row.l}</div>
                  {top.slice(0,3).map((m) => <div key={m.c.id} style={{ padding: "8px 0", color: "var(--text-1)" }}>{row.v(m)}</div>)}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MatchRow({ m, idx, person, onClick }) {
  const { c, total, sectorOverlap, hand } = m;
  return (
    <div className="flex center gap-12"
         style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", cursor: "default" }}
         onClick={onClick}>
      <div style={{ width: 24, color: "var(--text-4)" }} className="mono tabnum tiny">{String(idx+1).padStart(2,"0")}</div>
      <CoLogo company={c} size={40} />
      <div className="col" style={{ minWidth: 220 }}>
        <div className="flex center gap-6">
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
          {hand && <span className="pill amber" style={{ padding: "1px 5px" }}><window.I.Star size={9} fill={true} /> hand-picked</span>}
        </div>
        <div className="mono tiny" style={{ color: "var(--text-4)" }}>{c.flag} {c.hq.toUpperCase()}</div>
      </div>

      <div className="col" style={{ flex: 1, gap: 6 }}>
        <div className="flex wrap gap-4">
          {c.sectors.slice(0,3).map((s) => <SectorPill key={s} id={s} />)}
        </div>
        <div className="tiny" style={{ color: "var(--text-3)" }}>
          {sectorOverlap > 0 ? `חופף ב-${sectorOverlap} מתחומי העניין של ${person.name.split(" ")[0]}` : "התאמה לפי טכנולוגיה ודמיון פרופיל"}
        </div>
      </div>

      <div className="col" style={{ width: 160, gap: 6 }}>
        <div className="flex between" style={{ fontSize: 11.5 }}>
          <span className="mono tiny" style={{ color: "var(--text-3)" }}>ME-SCORE</span>
          <span className="mono tabnum" style={{ color: total >= 85 ? "var(--green)" : total >= 70 ? "var(--blue)" : "var(--amber)", fontWeight: 600 }}>{total}%</span>
        </div>
        <MiniBar value={total} color={total >= 85 ? "var(--green)" : total >= 70 ? "var(--blue)" : "var(--amber)"} />
      </div>

      <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={() => window.toast(`שולח intro…`, "ok")}>
        <window.I.Send size={11} /> intro
      </button>
    </div>
  );
}

window.MatchesView = MatchesView;
