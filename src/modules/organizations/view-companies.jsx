// ecos — Companies list & detail profile
// List: searchable, filterable, grid view + table view toggle.
// Profile: full deep-dive (tabs, score breakdown, connections, contacts, etc.)

function companyEditorInitial(company) {
  return {
    name: company?.name || "",
    sector: company?.sectors?.[0] || window.SECTORS[0]?.id || "earth-obs",
    blurb: company?.blurb || "",
    hq: company?.hq || "",
    website: company?.website || "",
    stage: company?.stage || "Seed",
    techText: (company?.capabilities?.length ? company.capabilities : (company?.tech || [])).join(", "),
  };
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function CompanyEditor({ company, title, submitLabel, onSave, onCancel }) {
  const [form, setForm] = React.useState(() => companyEditorInitial(company));
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setForm(companyEditorInitial(company));
    setError("");
  }, [company?.id]);

  const setField = (field, value) => setForm((prev) => Object.assign({}, prev, { [field]: value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("שם חברה הוא שדה חובה");
      return;
    }
    setError("");
    onSave({
      name: form.name,
      sectors: [form.sector],
      blurb: form.blurb,
      hq: form.hq,
      website: form.website,
      stage: form.stage,
      tech: parseList(form.techText),
      capabilities: parseList(form.techText),
    });
  };

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-hd">
        <div className="card-title"><span className="dot green" /> {title}</div>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>שם חברה <span className="req">*</span></label>
          <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
        </div>
        <div className="field">
          <label>תחום ראשי</label>
          <select className="select" value={form.sector} onChange={(e) => setField("sector", e.target.value)}>
            {window.SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>מיקום</label>
          <input className="input" value={form.hq} onChange={(e) => setField("hq", e.target.value)} placeholder="תל אביב" />
        </div>
        <div className="field">
          <label>שלב</label>
          <select className="select" value={form.stage} onChange={(e) => setField("stage", e.target.value)}>
            {window.STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>אתר</label>
          <input className="input" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://..." dir="ltr" />
        </div>
        <div className="field">
          <label>יכולות / Tags</label>
          <input className="input" value={form.techText} onChange={(e) => setField("techText", e.target.value)} placeholder="Satellite, AI, Payload" />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>תיאור קצר</label>
          <textarea className="textarea" value={form.blurb} onChange={(e) => setField("blurb", e.target.value)} />
        </div>
      </div>
      {error && <div className="help" style={{ color: "var(--rose)", marginTop: 10 }}>{error}</div>}
      <div className="flex center gap-8" style={{ marginTop: 14 }}>
        <button type="submit" className="btn btn-primary"><window.I.Check size={13} /> {submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>סגור</button>}
      </div>
    </form>
  );
}

function CompaniesView({ onOpenCompany, onCreateCompany }) {
  const { COMPANIES, SECTORS } = window;
  const [activeSectors, setActiveSectors] = React.useState([]);
  const [stage,         setStage]         = React.useState("all");
  const [view,          setView]          = React.useState("grid");
  const [q,             setQ]             = React.useState("");
  const [showCreate,    setShowCreate]    = React.useState(false);

  const toggle = (id) => setActiveSectors((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const create = (input) => {
    const company = onCreateCompany(input);
    setShowCreate(false);
    window.toast(`${company.name} נשמרה במאגר המקומי`, "ok");
    onOpenCompany(company.id);
  };

  const filtered = COMPANIES.filter((c) => {
    const sectors = c.sectors || [];
    const tech = c.tech || [];
    if (activeSectors.length && !activeSectors.some((s) => sectors.includes(s))) return false;
    if (stage !== "all" && c.stage !== stage) return false;
    if (q && !`${c.name} ${c.country} ${c.hq} ${c.blurb} ${tech.join(" ")} ${sectors.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>חברות באקוסיסטם</h2>
          <div className="sub">{filtered.length} מתוך {COMPANIES.length} חברות</div>
        </div>
        <div className="ops">
          <div className="seg">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>
              <window.I.Grid size={13} style={{ verticalAlign: -2 }} />&nbsp;Grid
            </button>
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>
              <window.I.Layers size={13} style={{ verticalAlign: -2 }} />&nbsp;Table
            </button>
          </div>
          <button className="btn" disabled title="סינון מתקדם — בקרוב"><window.I.Filter size={13} /> סינון מתקדם</button>
          <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}><window.I.Plus size={13} /> חברה חדשה</button>
        </div>
      </div>

      {showCreate && (
        <CompanyEditor
          title="חברה חדשה"
          submitLabel="שמור חברה"
          onSave={create}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filter chips */}
      <div className="card" style={{ padding: 14 }}>
        <div className="flex center gap-8 wrap">
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>תחום</span>
          {SECTORS.map((s) => (
            <span key={s.id} className={"chip" + (activeSectors.includes(s.id) ? " active" : "")} onClick={() => toggle(s.id)}>
              <span style={{ width: 7, height: 7, borderRadius: 50, background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="divider" />
        <div className="flex center gap-8 wrap">
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>שלב</span>
          {["all", ...window.STAGES].map((s) => (
            <span key={s} className={"chip" + (stage === s ? " active" : "")} onClick={() => setStage(s)}>
              {s === "all" ? "הכל" : s}
            </span>
          ))}
          <div className="grow" />
          <div className="search" style={{ flex: "none", width: 280, padding: "5px 10px" }}>
            <window.I.Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="שם, טכנולוגיה, מדינה…" />
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14 }}>
          {filtered.map((c) => <CoCard key={c.id} c={c} onClick={() => onOpenCompany(c.id)} />)}
        </div>
      ) : (
        <div className="card flush" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>חברה</th>
                <th>תחום</th>
                <th>מדינה</th>
                <th>שלב</th>
                <th>גודל</th>
                <th>Readiness</th>
                <th style={{ width: 80 }}>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => onOpenCompany(c.id)} style={{ cursor: "default" }}>
                  <td><CoLogo company={c} size={28} /></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name} {c.strategic && <window.I.Star size={11} style={{ color: "var(--amber)", verticalAlign: 1 }} fill={true} />}</div>
                    <div className="mono tiny" style={{ color: "var(--text-4)" }}>{String(c.hq || "").toUpperCase()}</div>
                  </td>
                  <td><div className="flex gap-4 wrap">{(c.sectors || []).slice(0,2).map((s) => <SectorPill key={s} id={s} />)}</div></td>
                  <td>{c.flag} {c.country}</td>
                  <td><span className="pill">{c.stage}</span></td>
                  <td className="mono tabnum" style={{ color: "var(--text-2)" }}>{c.size}</td>
                  <td>
                    <span className={"pill " + (c.readiness === "Defense Cleared" ? "rose" : c.readiness === "Commercial" ? "green" : c.readiness === "Pilot Ready" ? "amber" : "")}>
                      {c.readiness}
                    </span>
                  </td>
                  <td><ScoreRing value={c.score} size={32} stroke={2.5} /></td>
                  <td><window.I.ArrowLeft size={14} style={{ color: "var(--text-3)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CoCard({ c, onClick }) {
  const sectors = c.sectors || [];
  return (
    <div className="co-card" onClick={onClick}>
      <div className="score-ring"><ScoreRing value={c.score} size={42} stroke={3} /></div>
      <div className="co-head">
        <CoLogo company={c} size={44} />
        <div className="col" style={{ minWidth: 0 }}>
          <div className="co-name">
            {c.name}
            {c.strategic && <window.I.Star size={11} style={{ color: "var(--amber)", verticalAlign: 1, marginInlineStart: 6 }} fill={true} />}
          </div>
          <div className="co-meta">{c.flag} {String(c.hq || "").toUpperCase()} · {c.stage}</div>
        </div>
      </div>
      <div className="co-blurb" style={{
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{c.blurb}</div>
      <div className="co-tags">
        {sectors.slice(0,3).map((s) => <SectorPill key={s} id={s} />)}
      </div>
      <div className="flex between center" style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--line-1)" }}>
        <div className="flex gap-12 mono tiny" style={{ color: "var(--text-4)" }}>
          <span><span style={{ color: "var(--text-2)" }}>{c.size}</span> EMP</span>
          <span><span style={{ color: "var(--text-2)" }}>{c.founded}</span></span>
          {c.fundingM > 0 && <span><span style={{ color: "var(--text-2)" }}>${c.fundingM}M</span> RAISED</span>}
        </div>
        <span className={"pill " + (c.readiness === "Defense Cleared" ? "rose" : c.readiness === "Commercial" ? "green" : "amber")}>
          {c.readiness}
        </span>
      </div>
    </div>
  );
}


/* ────────────────────────── Profile ────────────────────────── */

function CompanyProfile({ id, onBack, onNav, onOpenCompany, onUpdateCompany }) {
  const c = window.COMPANIES.find((x) => x.id === id);
  if (!c) return <div className="view"><div className="card">חברה לא נמצאה</div></div>;
  const [tab, setTab] = React.useState("overview");
  const [editing, setEditing] = React.useState(false);

  const matchedPeople = window.PEOPLE.filter((p) => p.matches.includes(c.id));
  const overlapCo = (c.overlap || []).map((id) => window.COMPANIES.find((x) => x.id === id)).filter(Boolean);
  const saveEdit = (patch) => {
    const updated = onUpdateCompany(c.id, patch);
    setEditing(false);
    window.toast(`${updated.name} עודכנה ונשמרה מקומית`, "ok");
  };
  const toggleStrategic = () => {
    const updated = onUpdateCompany(c.id, { strategic: !c.strategic });
    window.toast(updated.strategic ? `${updated.name} סומנה כאסטרטגית` : `${updated.name} הוסרה מהרשימה האסטרטגית`, "ok");
  };
  const linkedInUrl = c.linkedin || c.website;
  const openExternalLink = () => {
    if (!linkedInUrl) return;
    window.open(linkedInUrl.startsWith("http") ? linkedInUrl : `https://${linkedInUrl}`, "_blank", "noopener");
  };

  return (
    <div className="view">
      <div className="flex center gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
        <span style={{ cursor: "default" }} onClick={onBack}>חברות</span>
        <window.I.ArrowLeft size={11} />
        <span style={{ color: "var(--text-1)" }}>{c.name}</span>
      </div>

      {/* Hero */}
      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div className="scan-line" />
        <div className="flex gap-20" style={{ alignItems: "flex-start" }}>
          <CoLogo company={c} size={72} />
          <div className="col grow" style={{ minWidth: 0 }}>
            <div className="flex center gap-8" style={{ marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {c.name}
              </h2>
              {c.strategic && <span className="pill amber"><window.I.Star size={10} fill={true} /> Strategic</span>}
              <span className="pill">
                <span className="swatch" style={{ background: c.readiness === "Defense Cleared" ? "var(--rose)" : c.readiness === "Commercial" ? "var(--green)" : "var(--amber)" }} />
                {c.readiness}
              </span>
            </div>
            <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.06em", marginBottom: 12 }}>
              {c.flag} {c.hq.toUpperCase()} · FOUNDED {c.founded} · {c.size} EMPLOYEES{c.fundingM > 0 ? ` · $${c.fundingM}M RAISED` : ""}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-2)", maxWidth: "75ch", lineHeight: 1.6 }}>{c.blurb}</div>
            <div className="co-tags" style={{ marginTop: 14 }}>
              {c.sectors.map((s) => <SectorPill key={s} id={s} />)}
            </div>
          </div>

          {/* Score panel */}
          <div className="col gap-10" style={{ minWidth: 260, padding: 16, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 12 }}>
            <div className="flex center between">
              <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Compatibility</span>
              <ScoreRing value={c.score} size={56} stroke={4} />
            </div>
            <FitBar label="התאמה לעובדים" score={Math.min(99, c.score + 2)} color="var(--blue)" />
            <FitBar label="פוטנציאל שיתוף פעולה" score={Math.max(45, c.score - 8)} color="var(--violet)" />
            <FitBar label="חדשנות" score={Math.max(40, c.score - (c.strategic ? 0 : 12))} color="var(--cyan)" />
            <FitBar label="רלוונטיות אסטרטגית" score={c.strategic ? 95 : Math.max(50, c.score - 5)} color="var(--amber)" />
            <FitBar label="Readiness" score={c.readiness === "Defense Cleared" ? 98 : c.readiness === "Commercial" ? 80 : c.readiness === "Pilot Ready" ? 65 : 45} color="var(--green)" />
          </div>
        </div>

        <div className="flex gap-10 center" style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line-1)" }}>
          <button className="btn btn-primary" disabled title="תהליך intro אינו מוגדר עדיין"><window.I.Mail size={13} /> בקש introduction</button>
          <button className="btn" onClick={toggleStrategic}><window.I.Pin size={13} /> {c.strategic ? "הסר סימון אסטרטגי" : "סמן כאסטרטגי"}</button>
          <button className="btn btn-ghost" onClick={linkedInUrl ? openExternalLink : undefined} disabled={!linkedInUrl} title={linkedInUrl ? undefined : "אין קישור מוגדר לחברה זו"}><window.I.Linkedin size={13} /> {c.linkedin ? "LinkedIn" : "אתר"}</button>
          <button className="btn" onClick={() => setEditing((v) => !v)}><window.I.Settings size={13} /> ערוך פרטים</button>
          <div className="grow" />
          <div className="mono tiny" style={{ color: "var(--text-4)" }}>ID · {c.id.toUpperCase()}</div>
        </div>
      </div>

      {editing && (
        <CompanyEditor
          key={c.id}
          company={c}
          title={`עריכת ${c.name}`}
          submitLabel="שמור שינויים"
          onSave={saveEdit}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Tabs */}
      <div className="card flush" style={{ padding: "0 20px" }}>
        <div className="stepper" style={{ borderBottom: "1px solid var(--line-1)" }}>
          {[
            ["overview", "סקירה"],
            ["tech", "טכנולוגיות ויכולות"],
            ["match", "התאמה לארגון"],
            ["connections", "חיבורים"],
            ["contacts", "אנשי קשר"],
          ].map(([id, lbl]) => (
            <div key={id} className={"step" + (tab === id ? " active" : "")} onClick={() => setTab(id)} style={{ cursor: "default" }}>
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab c={c} />}
      {tab === "tech" && <TechTab c={c} />}
      {tab === "match" && <MatchTab c={c} matchedPeople={matchedPeople} onNav={onNav} />}
      {tab === "connections" && <ConnectionsTab c={c} overlapCo={overlapCo} onOpenCompany={onOpenCompany} />}
      {tab === "contacts" && <ContactsTab c={c} />}
    </div>
  );
}

function OverviewTab({ c }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
      <div className="col gap-14">
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot" /> מציעה ללקוחות</div></div>
          <div className="col gap-8">
            {c.offers.map((o, i) => (
              <div key={i} className="flex gap-8 center" style={{ fontSize: 13, color: "var(--text-1)" }}>
                <window.I.Check size={14} style={{ color: "var(--green)" }} />
                <span>{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot violet" /> מחפשת לשיתוף פעולה</div></div>
          <div className="col gap-8">
            {c.needs.map((o, i) => (
              <div key={i} className="flex gap-8 center" style={{ fontSize: 13, color: "var(--text-1)" }}>
                <window.I.Compass size={14} style={{ color: "var(--violet)" }} />
                <span>{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot green" /> לקוחות ושותפים</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Customers</div>
              <div className="flex wrap gap-6">
                {c.customers.map((x) => <span key={x} className="chip">{x}</span>)}
              </div>
            </div>
            <div>
              <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Partners</div>
              <div className="flex wrap gap-6">
                {c.partners.map((x) => <span key={x} className="chip">{x}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col gap-14">
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot amber" /> סקירה</div></div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>
            {c.blurb}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot" /> נתונים מהירים</div></div>
          <div className="col gap-10">
            <KV k="שלב" v={c.stage} />
            <KV k="מועסקים" v={c.size} />
            <KV k="שנת הקמה" v={c.founded} />
            <KV k="מטה" v={c.hq} />
            {c.fundingM > 0 && <KV k="גיוס מצטבר" v={`$${c.fundingM}M`} />}
            <KV k="Readiness" v={c.readiness} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex between center" style={{ fontSize: 13 }}>
      <span style={{ color: "var(--text-3)" }}>{k}</span>
      <span className="mono tabnum" style={{ color: "var(--text-1)" }}>{v}</span>
    </div>
  );
}

function TechTab({ c }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> טכנולוגיות ליבה</div></div>
        <div className="col gap-10">
          {c.tech.map((t, i) => (
            <div key={i} style={{ padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
              <div className="flex center gap-8">
                <window.I.Cpu size={14} style={{ color: "var(--blue)" }} />
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot violet" /> Tags</div></div>
        <div className="flex wrap gap-6">
          {[...c.tech, ...c.offers, ...c.sectors.map((s) => window.SECTORS.find((x) => x.id === s)?.label)]
            .filter(Boolean)
            .flatMap((t) => String(t).split(/[\s/]+/))
            .filter((t) => t.length > 2)
            .slice(0, 28)
            .map((t, i) => (
              <span key={i} className="chip" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--violet)" }}>#</span>{t}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function MatchTab({ c, matchedPeople, onNav }) {
  if (!matchedPeople.length) {
    return (
      <div className="card">
        <div className="muted">אין כרגע עובדים שמסומנים כהתאמה ישירה לחברה זו.</div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot" /> {matchedPeople.length} עובדים מתאימים</div>
        <button className="btn" onClick={() => onNav("matches")}>פתח במנוע ההתאמות</button>
      </div>
      <div className="col gap-12">
        {matchedPeople.map((p) => <MatchPersonRow key={p.id} p={p} c={c} />)}
      </div>
    </div>
  );
}

function MatchPersonRow({ p, c }) {
  const sharedSectors = p.interests.filter((i) => c.sectors.includes(i)).length;
  const fit = Math.min(99, 55 + sharedSectors * 15);
  return (
    <div className="flex center gap-12" style={{ padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 10 }}>
      <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${p.color}, oklch(from ${p.color} 0.4 c h))` }}>{p.avatar}</div>
      <div className="col" style={{ minWidth: 180 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
        <div className="mono tiny" style={{ color: "var(--text-4)" }}>{p.role.toUpperCase()}</div>
      </div>
      <div className="col grow gap-4">
        <div className="flex between" style={{ fontSize: 11.5 }}>
          <span style={{ color: "var(--text-3)" }}>סיבת ההתאמה: חופף ב-{p.interests.filter((i) => c.sectors.includes(i)).length} תחומים</span>
          <span className="mono tabnum" style={{ color: "var(--blue)" }}>{fit}%</span>
        </div>
        <MiniBar value={fit} color="var(--blue)" />
      </div>
      <button className="btn" disabled title="תהליך intro אינו מוגדר עדיין"><window.I.Send size={12} /> intro</button>
    </div>
  );
}

function ConnectionsTab({ c, overlapCo, onOpenCompany }) {
  const lines = window.CONNECTIONS.filter((cn) => cn.from === c.id || cn.to === c.id);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> חיבורים פעילים</div></div>
        {lines.length === 0 && <div className="muted">אין חיבורים מסומנים — סמן באמצעות Pin.</div>}
        <div className="col gap-8">
          {lines.map((ln, i) => {
            const otherId = ln.from === c.id ? ln.to : ln.from;
            const other = window.COMPANIES.find((x) => x.id === otherId);
            if (!other) return null;
            return (
              <div key={i} className="flex center gap-10" onClick={() => onOpenCompany(other.id)}
                   style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8, cursor: "default" }}>
                <CoLogo company={other} size={32} />
                <div className="col" style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{other.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{ln.type.toUpperCase()}</div>
                </div>
                <window.I.Link size={13} style={{ color: "var(--text-3)" }} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot violet" /> חברות דומות / משלימות</div></div>
        <div className="col gap-8">
          {overlapCo.map((o) => (
            <div key={o.id} className="flex center gap-10" onClick={() => onOpenCompany(o.id)}
                 style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8, cursor: "default" }}>
              <CoLogo company={o} size={32} />
              <div className="col" style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{o.name}</div>
                <div className="mono tiny" style={{ color: "var(--text-4)" }}>{o.sectors.slice(0,2).map((s) => window.SECTORS.find((x) => x.id === s)?.label).join(" · ").toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ c }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot" /> אנשי קשר ב-{c.name}</div>
        <button className="btn" disabled title="הוספת איש קשר — בקרוב"><window.I.Plus size={12} /> הוסף איש קשר</button>
      </div>
      <div style={{ padding: "28px 0", textAlign: "center" }}>
        <window.I.Users size={24} style={{ color: "var(--text-4)", display: "block", margin: "0 auto 10px" }} />
        <div className="muted tiny">אין אנשי קשר מוגדרים לחברה זו עדיין.</div>
      </div>
    </div>
  );
}

Object.assign(window, { CompaniesView, CompanyProfile });
