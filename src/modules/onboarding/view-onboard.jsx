// ecos — Company self-onboarding
// 6-step flow with LinkedIn smart import, AI auto-fill, and live progress bar.

const STEPS = [
  { id: "import",   label: "ייבוא מהיר",  short: "Import" },
  { id: "basics",   label: "פרטי חברה",   short: "Basics" },
  { id: "tech",     label: "טכנולוגיות",  short: "Tech" },
  { id: "offer",    label: "הצעה וצרכים", short: "Offer" },
  { id: "readiness",label: "מוכנות",      short: "Readiness" },
  { id: "review",   label: "סקירה ושיגור", short: "Review" },
];

function OnboardView() {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    name: "", website: "", linkedin: "",
    sectors: [], stage: "Seed", founded: 2020, size: "",
    country: "ישראל", hq: "",
    tech: ["", "", ""],
    offers: ["", ""],
    needs: ["", ""],
    customers: "",
    readiness: "Pilot Ready",
    govReady: "ידני",
    budgetMin: 50, budgetMax: 500,
    interests: [],
    contacts: [{ name: "", role: "", email: "" }],
  });
  const [importing, setImporting] = React.useState(false);
  const [imported, setImported] = React.useState(false);

  const setField = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const pct = Math.round(((step) / (STEPS.length - 1)) * 100);

  const onImport = () => {
    setImporting(true);
    setTimeout(() => {
      // Mock-import: pretend we read LinkedIn + website
      setData((d) => ({
        ...d,
        name: "Skylight Dynamics",
        website: "https://skylight-dynamics.com",
        linkedin: "linkedin.com/company/skylight-dynamics",
        sectors: ["sar","ai"],
        stage: "Series A",
        founded: 2021,
        size: "28",
        country: "ישראל",
        hq: "Tel Aviv",
        tech: ["L-band SAR analytics", "On-board AI inference", "Cloud-native tasking"],
        offers: ["Maritime monitoring API", "Edge SAR processing"],
        needs: ["Distribution partners in EU", "Ground network access"],
        customers: "Allied MoDs, Insurance",
        interests: ["sar","ai","defense"],
      }));
      setImported(true);
      setImporting(false);
      setStep(1);
    }, 1800);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הצטרפו ל-ecos</h2>
          <div className="sub">פרסמו את החברה שלכם באקוסיסטם החלל. ייבוא חכם או מילוי ידני, פחות מ-4 דקות.</div>
        </div>
        <div className="ops">
          <span className="pill"><span className="swatch" style={{ background: "var(--green)" }} /> שמירה אוטומטית</span>
          <span className="pill mono">STEP {step+1}/{STEPS.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: 16 }}>
        <div className="flex between center" style={{ marginBottom: 10 }}>
          <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {STEPS[step].short} · {STEPS[step].label}
          </div>
          <div className="mono tabnum tiny" style={{ color: "var(--text-2)" }}>{pct}%</div>
        </div>
        <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            width: pct + "%", height: "100%",
            background: "linear-gradient(90deg, var(--blue), var(--violet))",
            boxShadow: "0 0 12px oklch(0.7 0.18 270 / 0.8)",
            transition: "width 0.4s ease",
          }} />
        </div>
        <div className="stepper" style={{ marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={"step" + (i === step ? " active" : i < step ? " done" : "")}>
              <span className="step-num">{i < step ? "✓" : i+1}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>

        <div className="card">
          {step === 0 && <StepImport onImport={onImport} importing={importing} imported={imported} skip={() => setStep(1)} />}
          {step === 1 && <StepBasics data={data} setField={setField} />}
          {step === 2 && <StepTech data={data} setField={setField} setData={setData} />}
          {step === 3 && <StepOffer data={data} setField={setField} setData={setData} />}
          {step === 4 && <StepReadiness data={data} setField={setField} />}
          {step === 5 && <StepReview data={data} />}

          <div className="divider" style={{ marginTop: 20 }} />
          <div className="flex between center">
            <button className="btn btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <window.I.ArrowRight size={13} /> חזרה
            </button>
            <div className="flex gap-8 center">
              <button className="btn btn-ghost">שמור טיוטה</button>
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={() => setStep(step + 1)}>המשך <window.I.ArrowLeft size={13} /></button>
              ) : (
                <button className="btn btn-primary"><window.I.Send size={13} /> שגר ל-ecos</button>
              )}
            </div>
          </div>
        </div>

        {/* AI side panel */}
        <div className="col gap-14">
          <div className="card" style={{ background: "linear-gradient(180deg, oklch(0.16 0.06 290), oklch(0.13 0.025 285))", borderColor: "oklch(0.30 0.10 295)" }}>
            <div className="flex center gap-8" style={{ marginBottom: 10 }}>
              <window.I.Sparkles size={14} style={{ color: "var(--violet)" }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>עוזר חכם</div>
              <span className="pill violet mono" style={{ marginInlineStart: "auto" }}>Claude</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
              {step === 0 && "אני יכול למלא 80% מהטופס באמצעות פרופיל LinkedIn או אתר החברה. שמרו זמן."}
              {step === 1 && "נסו לדייק את שם החברה ותחום הפעילות — אלה מזינים את אלגוריתם ההתאמה."}
              {step === 2 && "ככל שתפרטו טכנולוגיות ליבה, ה-AI ימצא חברות משלימות מדויקות יותר."}
              {step === 3 && "תגדירו מה אתם מציעים ואיזה שותפויות אתם מחפשים — זה הצומת המרכזי להתאמות."}
              {step === 4 && "Readiness עוזר לנו לקשר אתכם לפרויקטים מתאימים בלבד (אזרחי / ביטחוני)."}
              {step === 5 && "כל הפרטים מסוכמים. ניתן לחזור ולערוך כל פרק לפני השיגור."}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title"><span className="dot" /> Live Preview</div></div>
            {data.name ? <PreviewCard data={data} /> : (
              <div className="muted tiny">המראה של פרופיל החברה יופיע כאן ברגע שתזינו פרטים בסיסיים.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepImport({ onImport, importing, imported, skip }) {
  return (
    <div className="col gap-14">
      <div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
          בואו נחסוך לכם זמן.
        </h3>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          חברו את ה-LinkedIn או הזינו URL לאתר. אנחנו נשלוף את רוב הפרטים אוטומטית.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button className="btn" style={{
          flexDirection: "column", padding: 24, gap: 10,
          background: "linear-gradient(180deg, oklch(0.20 0.04 240), oklch(0.14 0.025 240))",
          borderColor: "oklch(0.34 0.10 240)",
        }} onClick={onImport} disabled={importing}>
          <window.I.Linkedin size={26} style={{ color: "var(--blue)" }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>ייבוא מ-LinkedIn</div>
          <div className="tiny dim">קליק אחד · OAuth מאובטח</div>
        </button>
        <button className="btn" style={{
          flexDirection: "column", padding: 24, gap: 10,
          background: "linear-gradient(180deg, oklch(0.20 0.04 295), oklch(0.14 0.025 295))",
          borderColor: "oklch(0.34 0.10 295)",
        }} onClick={onImport} disabled={importing}>
          <window.I.Globe size={26} style={{ color: "var(--violet)" }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>סריקת אתר אינטרנט</div>
          <div className="tiny dim">AI ישלוף את כל הפרטים</div>
        </button>
      </div>

      <div className="field">
        <label>URL לאתר (אופציונלי)</label>
        <input className="input" placeholder="https://your-space-company.com" />
      </div>

      {importing && (
        <div className="hint-ai" style={{ background: "oklch(0.18 0.07 250 / 0.4)", borderColor: "oklch(0.35 0.10 250)", color: "var(--blue)" }}>
          <div className="pulse"><window.I.Cpu size={12} /></div>
          <span>טוען LinkedIn · מנתח אתר · מסווג פעילות · יוצר Tags · יישלם מילוי…</span>
        </div>
      )}
      {imported && (
        <div className="hint-ai" style={{ background: "oklch(0.18 0.07 150 / 0.4)", borderColor: "oklch(0.35 0.10 150)", color: "var(--green)" }}>
          <window.I.Check size={12} />
          <span>נטענו 14 שדות אוטומטית — תוכלו לערוך הכל בשלבים הבאים.</span>
        </div>
      )}

      <div className="divider" />
      <button className="btn btn-ghost" onClick={skip}>או דלגו ומלאו ידנית →</button>
    </div>
  );
}

function StepBasics({ data, setField }) {
  return (
    <div className="col gap-14">
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <div className="field">
          <label>שם החברה <span className="req">*</span></label>
          <input className="input" value={data.name} onChange={(e) => setField("name", e.target.value)} placeholder="לדוגמה: Skylight Dynamics" />
        </div>
        <div className="field">
          <label>שנת הקמה</label>
          <input className="input mono" type="number" value={data.founded} onChange={(e) => setField("founded", +e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>תחום פעילות ראשי <span className="req">*</span></label>
        <div className="flex wrap gap-6">
          {window.SECTORS.map((s) => (
            <span key={s.id} className={"chip" + (data.sectors.includes(s.id) ? " active" : "")}
                  onClick={() => setField("sectors", data.sectors.includes(s.id) ? data.sectors.filter((x) => x !== s.id) : [...data.sectors, s.id])}>
              <span style={{ width: 7, height: 7, borderRadius: 50, background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="help">סמנו 1–3 תחומים שהכי מייצגים אתכם.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>שלב החברה</label>
          <select className="select" value={data.stage} onChange={(e) => setField("stage", e.target.value)}>
            {window.STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>גודל (מועסקים)</label>
          <input className="input mono" value={data.size} onChange={(e) => setField("size", e.target.value)} placeholder="לדוגמה 35" />
        </div>
        <div className="field">
          <label>מטה</label>
          <input className="input" value={data.hq} onChange={(e) => setField("hq", e.target.value)} placeholder="Tel Aviv" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>אתר אינטרנט</label>
          <input className="input ltr mono" dir="ltr" value={data.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://…" />
        </div>
        <div className="field">
          <label>LinkedIn</label>
          <input className="input ltr mono" dir="ltr" value={data.linkedin} onChange={(e) => setField("linkedin", e.target.value)} placeholder="linkedin.com/company/…" />
        </div>
      </div>
    </div>
  );
}

function StepTech({ data, setField, setData }) {
  return (
    <div className="col gap-14">
      <div className="hint-ai">
        <window.I.Sparkles size={12} />
        <span>פרטו את 3 הטכנולוגיות שמייחדות אתכם. AI יזהה אוטומטית טכנולוגיות סמוכות וייצר Tags.</span>
      </div>
      {data.tech.map((t, i) => (
        <div key={i} className="field">
          <label>טכנולוגיית ליבה #{i+1}{i === 0 && <span className="req">*</span>}</label>
          <input className="input" value={t} onChange={(e) => {
            const arr = [...data.tech]; arr[i] = e.target.value; setData((d) => ({ ...d, tech: arr }));
          }} placeholder="לדוגמה: L-band SAR analytics" />
        </div>
      ))}
      <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
              onClick={() => setData((d) => ({ ...d, tech: [...d.tech, ""] }))}>
        <window.I.Plus size={12} /> הוסף טכנולוגיה
      </button>
    </div>
  );
}

function StepOffer({ data, setField, setData }) {
  const updateArr = (key, i, v) => {
    const arr = [...data[key]]; arr[i] = v; setData((d) => ({ ...d, [key]: arr }));
  };
  return (
    <div className="col gap-14">
      <div className="field">
        <label>מה אתם מציעים לאקוסיסטם?</label>
        {data.offers.map((o, i) => (
          <input key={i} className="input" style={{ marginBottom: 8 }} value={o}
                 onChange={(e) => updateArr("offers", i, e.target.value)}
                 placeholder={`הצעה ${i+1} — לדוגמה: Maritime monitoring API`} />
        ))}
        <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
                onClick={() => setData((d) => ({ ...d, offers: [...d.offers, ""] }))}>
          <window.I.Plus size={12} /> הוסף הצעה
        </button>
      </div>

      <div className="field">
        <label>מה אתם מחפשים?</label>
        {data.needs.map((o, i) => (
          <input key={i} className="input" style={{ marginBottom: 8 }} value={o}
                 onChange={(e) => updateArr("needs", i, e.target.value)}
                 placeholder={`צורך ${i+1} — לדוגמה: Distribution partners ב-EU`} />
        ))}
      </div>

      <div className="field">
        <label>לקוחות / שותפים נוכחיים (אופציונלי)</label>
        <textarea className="textarea" value={data.customers} onChange={(e) => setField("customers", e.target.value)}
                  placeholder="לדוגמה: NASA, Allied MoDs, Insurance" />
      </div>
    </div>
  );
}

function StepReadiness({ data, setField }) {
  return (
    <div className="col gap-14">
      <div className="field">
        <label>רמת מוכנות לעבודה</label>
        <div className="flex wrap gap-6">
          {window.READINESS.map((r) => (
            <span key={r} className={"chip" + (data.readiness === r ? " active" : "")} onClick={() => setField("readiness", r)}>
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="field">
        <label>עבודה עם גופים ממשלתיים/ביטחוניים</label>
        <div className="flex wrap gap-6">
          {["לא רלוונטי","סיווג בסיסי","מסווג מלא","Defense Cleared"].map((r) => (
            <span key={r} className={"chip" + (data.govReady === r ? " active" : "")} onClick={() => setField("govReady", r)}>
              {r}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>תקציב פרויקט מינ׳ ($K)</label>
          <input className="input mono" type="number" value={data.budgetMin} onChange={(e) => setField("budgetMin", +e.target.value)} />
        </div>
        <div className="field">
          <label>תקציב פרויקט מקס׳ ($K)</label>
          <input className="input mono" type="number" value={data.budgetMax} onChange={(e) => setField("budgetMax", +e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>תחומי עניין באקוסיסטם</label>
        <div className="flex wrap gap-6">
          {window.SECTORS.map((s) => (
            <span key={s.id} className={"chip" + (data.interests.includes(s.id) ? " active" : "")}
                  onClick={() => setField("interests", data.interests.includes(s.id) ? data.interests.filter((x) => x !== s.id) : [...data.interests, s.id])}>
              <span style={{ width: 7, height: 7, borderRadius: 50, background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepReview({ data }) {
  return (
    <div className="col gap-14">
      <div className="hint-ai" style={{ background: "oklch(0.18 0.07 150 / 0.4)", borderColor: "oklch(0.35 0.10 150)", color: "var(--green)" }}>
        <window.I.Check size={12} />
        <span>הפרופיל מוכן לשיגור. לאחר השליחה: ביקורת קצרה (~24 ש׳) ואז פרסום באקוסיסטם.</span>
      </div>
      <PreviewCard data={data} large />

      <div className="card" style={{ background: "var(--bg-1)" }}>
        <div className="card-title" style={{ marginBottom: 10 }}><span className="dot violet" /> AI בודק את התקציר</div>
        <div className="col gap-6" style={{ fontSize: 12 }}>
          {[
            ["סווגנו תחום ראשי ככ-‎\"" + (window.SECTORS.find((s)=>s.id===data.sectors[0])?.label || "—") + "\"", "ok"],
            ["נמצאו 12 חברות עם חפיפת תחום או טכנולוגיה", "ok"],
            ["3 עובדים בארגון מתאימים בקרוב", "ok"],
            ["מומלץ להעמיק את שדה 'מה אתם מחפשים' — פחות מ-20 מילים", "warn"],
          ].map(([t, st], i) => (
            <div key={i} className="flex center gap-8">
              {st === "ok" ? <window.I.Check size={12} style={{ color: "var(--green)" }} /> : <window.I.Flag size={12} style={{ color: "var(--amber)" }} />}
              <span style={{ color: "var(--text-2)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ data, large }) {
  const sectorObj = window.SECTORS.find((s) => s.id === data.sectors[0]);
  return (
    <div className="co-card" style={{ cursor: "default", ...(large ? { maxWidth: 460 } : {}) }}>
      <div className="co-head">
        <div className="co-logo" style={{ background: `linear-gradient(135deg, ${sectorObj ? sectorObj.color : "oklch(0.3 0.06 270)"}, oklch(0.18 0.04 270))` }}>
          {(data.name || "—").split(" ").slice(0,2).map((w) => w[0]).join("").toUpperCase() || "•"}
        </div>
        <div className="col" style={{ minWidth: 0 }}>
          <div className="co-name">{data.name || "—"}</div>
          <div className="co-meta">🇮🇱 {(data.hq || "—").toUpperCase()} · {data.stage}</div>
        </div>
      </div>
      <div className="co-blurb tiny">
        {data.offers[0] ? `${data.offers[0]} — ` : ""}
        חברה ב-{sectorObj ? sectorObj.label : "Space"} מ-{data.country}, {data.size || "?"} מועסקים.
      </div>
      <div className="co-tags">
        {data.sectors.slice(0, 3).map((s) => <SectorPill key={s} id={s} />)}
        {data.sectors.length === 0 && <span className="dim tiny">תוסיפו תחומים…</span>}
      </div>
    </div>
  );
}

window.OnboardView = OnboardView;
