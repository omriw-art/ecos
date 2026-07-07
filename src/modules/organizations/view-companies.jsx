// ecos — Companies list & detail profile
// List: searchable, filterable, grid view + table view toggle.
// Profile: full deep-dive (tabs, score breakdown, connections, contacts, etc.)

// P15A — dual organization taxonomy display helpers.
function orgTypeLabel(id) {
  const found = (window.ORGANIZATION_TYPES || []).find((t) => t.id === id);
  return found ? found.label : "אחר";
}
function spaceSegmentLabel(id) {
  const found = (window.SPACE_SEGMENTS || []).find((s) => s.id === id);
  return found ? found.label : "אחר";
}
function spaceSegmentShortLabel(id) {
  const full = spaceSegmentLabel(id);
  const parts = full.split(" / ");
  return parts.length > 1 ? parts[1] : full;
}

function companyEditorInitial(company) {
  return {
    name: company?.name || "",
    sector: company?.sectors?.[0] || window.SECTORS[0]?.id || "earth-obs",
    blurb: company?.blurb || "",
    hq: company?.hq || "",
    website: company?.website || "",
    stage: company?.stage || "Seed",
    organizationType: company?.organizationType || "other",
    spaceSegment: company?.spaceSegment || "other",
    capabilitiesText: (company?.capabilities?.length ? company.capabilities : (company?.tech || [])).join(", "),
    tagsText: (company?.tags || []).join(", "),
    needsText: (company?.needs || []).join(", "),
    offersText: (company?.offers || []).join(", "),
  };
}

function parseList(value) {
  return String(value || "")
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Rebuilt company editor UI (P13C). Deliberately NOT the mono/uppercase
// console style used for dashboard chrome — this is a plain-language,
// high-contrast data-entry form. Every size below is enforced with
// `!important` and scoped to `.company-editor-form-v2` (a class unique to
// this component) so it (a) cannot be beaten by the shared .input/.select/
// .textarea rules regardless of stylesheet order, and (b) cannot leak into
// any other form in the app.
const editorHeadingStyle = { fontFamily: "inherit", fontSize: 26, fontWeight: 800, letterSpacing: "normal", textTransform: "none", color: "var(--text-1)", margin: 0 };
const editorSubtitleStyle = { fontFamily: "inherit", fontSize: 16, fontWeight: 500, letterSpacing: "normal", textTransform: "none", color: "var(--text-2)", marginTop: 4 };
const editorStatusStyle = { fontFamily: "inherit", fontSize: 12.5, letterSpacing: "normal", textTransform: "none", color: "var(--text-3)", marginTop: 6 };
const editorSectionHeadingStyle = { fontFamily: "inherit", fontSize: 20, fontWeight: 800, letterSpacing: "normal", textTransform: "none", color: "var(--text-1)", marginBottom: 18, paddingTop: 4, paddingBottom: 10, borderBottom: "2px solid var(--line-2)" };
const editorGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 };
const editorFullRow = { gridColumn: "1 / -1" };
const editorFieldStyle = { display: "flex", flexDirection: "column", gap: 8 };
const editorLabelStyle = { fontFamily: "inherit", fontSize: 15, fontWeight: 700, letterSpacing: "normal", textTransform: "none", color: "var(--text-1)" };
const editorHelpStyle = { fontSize: 13, color: "var(--text-3)", marginTop: 2 };

// Injected once per mount. Scoped to .company-editor-form-v2 with !important
// so no shared/global rule (whatever its source order or specificity) can
// silently win and make this look like the old form again.
function EditorStyleOverrides() {
  return (
    <style>{`
      .company-editor-form-v2 { background: var(--bg-2, var(--bg-1)) !important; border: 1px solid var(--line-3) !important; border-radius: 20px !important; padding: 32px !important; }
      .company-editor-form-v2 input.input,
      .company-editor-form-v2 select.select,
      .company-editor-form-v2 textarea.textarea {
        font-size: 17px !important;
        padding: 14px 16px !important;
        min-height: 54px !important;
        border-radius: 14px !important;
        color: var(--text-1) !important;
        background: var(--bg-1) !important;
        border: 1px solid var(--line-3) !important;
      }
      .company-editor-form-v2 textarea.textarea { min-height: 140px !important; }
      .company-editor-form-v2 input.input::placeholder,
      .company-editor-form-v2 textarea.textarea::placeholder { color: var(--text-3) !important; opacity: 1 !important; }
      .company-editor-form-v2 .btn { font-size: 15px !important; padding: 12px 20px !important; border-radius: 12px !important; }
      @media (max-width: 720px) {
        .company-editor-form-v2 { padding: 20px !important; }
      }
    `}</style>
  );
}

function EditorSection({ heading, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={editorSectionHeadingStyle}>{heading}</div>
      <div style={editorGridStyle}>{children}</div>
    </div>
  );
}

function EditorField({ label, required, full, hint, children }) {
  return (
    <div className="field" style={Object.assign({}, editorFieldStyle, full ? editorFullRow : null)}>
      <label style={editorLabelStyle}>{label} {required && <span className="req">*</span>}</label>
      {children}
      {hint && <div style={editorHelpStyle}>{hint}</div>}
    </div>
  );
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
      organizationType: form.organizationType,
      spaceSegment: form.spaceSegment,
      tech: parseList(form.capabilitiesText),
      capabilities: parseList(form.capabilitiesText),
      tags: parseList(form.tagsText),
      needs: parseList(form.needsText),
      offers: parseList(form.offersText),
    });
  };

  return (
    <form className="company-editor-form-v2" style={{ maxWidth: 960, margin: "0 auto 20px" }} onSubmit={submit}>
      <EditorStyleOverrides />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={editorHeadingStyle}>{company ? "עריכת חברה" : title}</h2>
          {company?.name && <div style={editorSubtitleStyle}>{company.name}</div>}
          <div style={editorStatusStyle}>שמירה מקומית בדפדפן</div>
        </div>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>}
      </div>

      <EditorSection heading="פרטי חברה">
        <EditorField label="שם חברה" required>
          <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
        </EditorField>
        <EditorField label="אתר">
          <input className="input" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://..." dir="ltr" />
        </EditorField>
        <EditorField label="מיקום">
          <input className="input" value={form.hq} onChange={(e) => setField("hq", e.target.value)} placeholder="תל אביב" />
        </EditorField>
        <EditorField label="תיאור קצר" full>
          <textarea className="textarea" value={form.blurb} onChange={(e) => setField("blurb", e.target.value)} />
        </EditorField>
      </EditorSection>

      <EditorSection heading="סיווג">
        <EditorField label="תחום">
          <select className="select" value={form.sector} onChange={(e) => setField("sector", e.target.value)}>
            {window.SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            {!window.SECTORS.find((s) => s.id === form.sector) && form.sector && (
              <option value={form.sector}>{form.sector} · imported</option>
            )}
          </select>
        </EditorField>
        <EditorField label="שלב">
          <select className="select" value={form.stage} onChange={(e) => setField("stage", e.target.value)}>
            {window.STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            {!window.STAGES.includes(form.stage) && form.stage && (
              <option value={form.stage}>{form.stage} · imported</option>
            )}
          </select>
        </EditorField>
        <EditorField label="סוג ארגון">
          <select className="select" value={form.organizationType} onChange={(e) => setField("organizationType", e.target.value)}>
            {(window.ORGANIZATION_TYPES || []).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </EditorField>
        <EditorField label="סגמנט פעילות">
          <select className="select" value={form.spaceSegment} onChange={(e) => setField("spaceSegment", e.target.value)}>
            {(window.SPACE_SEGMENTS || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </EditorField>
      </EditorSection>

      <EditorSection heading="יכולות והתאמה">
        <EditorField label="יכולות / Capabilities" full hint="הפרד ערכים בפסיק או נקודה-פסיק · לדוגמה: Earth Observation; Analytics; Communication">
          <input className="input" value={form.capabilitiesText} onChange={(e) => setField("capabilitiesText", e.target.value)} placeholder="Earth Observation; Analytics; Communication" />
        </EditorField>
        <EditorField label="תגיות / Tags" full hint="הפרד ערכים בפסיק או נקודה-פסיק · לדוגמה: Satellite, AI, Payload">
          <input className="input" value={form.tagsText} onChange={(e) => setField("tagsText", e.target.value)} placeholder="Satellite, AI, Payload" />
        </EditorField>
        <EditorField label="צרכים / Needs" full hint="לדוגמה: Funding; Lab access; Pilot customers">
          <input className="input" value={form.needsText} onChange={(e) => setField("needsText", e.target.value)} placeholder="Funding; Lab access; Pilot customers" />
        </EditorField>
        <EditorField label="הצעות / Offers" full hint="לדוגמה: SAR data; Analytics platform">
          <input className="input" value={form.offersText} onChange={(e) => setField("offersText", e.target.value)} placeholder="SAR data; Analytics platform" />
        </EditorField>
      </EditorSection>

      {error && <div className="help" style={{ color: "var(--rose)", marginTop: 10, fontSize: 14 }}>{error}</div>}
      <div className="flex center gap-8" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line-2)" }}>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>סגור</button>}
        <button type="submit" className="btn btn-primary"><window.I.Check size={13} /> {submitLabel}</button>
      </div>
    </form>
  );
}

function CompaniesView({ onOpenCompany, onCreateCompany }) {
  const { COMPANIES, SECTORS } = window;
  const [activeSectors, setActiveSectors] = React.useState([]);
  const [stage,         setStage]         = React.useState("all");
  const [orgType,       setOrgType]       = React.useState("all");
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
    if (orgType !== "all" && (c.organizationType || "other") !== orgType) return false;
    if (q && !`${c.name} ${c.country} ${c.hq} ${c.blurb} ${tech.join(" ")} ${sectors.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>ארגונים באקוסיסטם</h2>
          <div className="sub">{filtered.length} מתוך {COMPANIES.length} ארגונים</div>
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
          <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}><window.I.Plus size={13} /> הוספת ארגון</button>
        </div>
      </div>

      {showCreate && (
        <CompanyEditor
          title="הוספת ארגון"
          submitLabel="שמור ארגון"
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
        <div className="divider" />
        <div className="flex center gap-8 wrap">
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>סוג ארגון</span>
          <span className={"chip" + (orgType === "all" ? " active" : "")} onClick={() => setOrgType("all")}>הכל</span>
          {(window.ORGANIZATION_TYPES || []).map((t) => (
            <span key={t.id} className={"chip" + (orgType === t.id ? " active" : "")} onClick={() => setOrgType(t.id)}>
              {t.label}
            </span>
          ))}
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
                  <td><div className="flex gap-4 wrap">{(c.sectors || []).slice(0,2).map((s) => window.SECTORS.find((x) => x.id === s) ? <SectorPill key={s} id={s} /> : <span key={s} className="pill">{s}</span>)}</div></td>
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
          <div className="flex gap-6 wrap" style={{ marginTop: 5 }}>
            <span className="pill" style={{ fontSize: 11 }}>{orgTypeLabel(c.organizationType)}</span>
            <span className="pill" style={{ fontSize: 11 }}>{spaceSegmentShortLabel(c.spaceSegment)}</span>
          </div>
        </div>
      </div>
      <div className="co-blurb" style={{
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{c.blurb}</div>
      <div className="co-tags">
        {sectors.slice(0,3).map((s) => window.SECTORS.find((x) => x.id === s) ? <SectorPill key={s} id={s} /> : <span key={s} className="pill">{s}</span>)}
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
    <div className="view company-profile-view">
      <style>{`
        .company-profile-view .card-title {
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: normal;
          text-transform: none;
          color: var(--text-1);
        }
      `}</style>
      <div className="flex center gap-8" style={{ fontSize: 12, color: "var(--text-3)" }}>
        <span style={{ cursor: "default" }} onClick={onBack}>ארגונים</span>
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
            <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 8 }}>
              {c.flag} {c.hq.toUpperCase()} · FOUNDED {c.founded} · {c.size} EMPLOYEES{c.fundingM > 0 ? ` · $${c.fundingM}M RAISED` : ""}
            </div>
            <div className="flex gap-8 wrap" style={{ marginBottom: 12 }}>
              <span className="pill">סוג ארגון: {orgTypeLabel(c.organizationType)}</span>
              <span className="pill">סגמנט פעילות: {spaceSegmentLabel(c.spaceSegment)}</span>
            </div>
            <div style={{ fontSize: 18, color: "var(--text-1)", maxWidth: "75ch", lineHeight: 1.6 }}>{c.blurb}</div>
            <div className="co-tags" style={{ marginTop: 14 }}>
              {c.sectors.map((s) => window.SECTORS.find((x) => x.id === s) ? <SectorPill key={s} id={s} /> : <span key={s} className="pill">{s}</span>)}
            </div>
          </div>

          {/* Score panel */}
          <div className="col gap-10" style={{ minWidth: 260, padding: 16, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 12 }}>
            <div className="flex center between">
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Compatibility</span>
              <ScoreRing value={c.score} size={56} stroke={4} />
            </div>
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
              <div key={i} className="flex gap-8 center" style={{ fontSize: 15, color: "var(--text-1)" }}>
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
              <div key={i} className="flex gap-8 center" style={{ fontSize: 15, color: "var(--text-1)" }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>Customers</div>
              <div className="flex wrap gap-6">
                {c.customers.map((x) => <span key={x} className="chip">{x}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>Partners</div>
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
          <div style={{ fontSize: 16, color: "var(--text-1)", lineHeight: 1.65 }}>
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
    <div className="flex between center" style={{ fontSize: 15 }}>
      <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{k}</span>
      <span className="mono tabnum" style={{ color: "var(--text-1)", fontSize: 16 }}>{v}</span>
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
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-1)" }}>{t}</div>
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
                  <div style={{ fontSize: 15, color: "var(--text-1)" }}>{other.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{ln.type.toUpperCase()}</div>
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
                <div style={{ fontSize: 15, color: "var(--text-1)" }}>{o.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>{o.sectors.slice(0,2).map((s) => window.SECTORS.find((x) => x.id === s)?.label || s).join(" · ").toUpperCase()}</div>
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

Object.assign(window, { CompaniesView, CompanyProfile, orgTypeLabel, spaceSegmentLabel, spaceSegmentShortLabel });
