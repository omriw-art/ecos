// ecos — Client-facing onboarding flow.
// One thing per screen. Friendly. No jargon.

const SECTOR_ICONS = {
  launch:    "🚀",
  eo:        "🛰️",
  sar:       "📡",
  comms:     "📶",
  ai:        "🧠",
  robotics:  "🤖",
  isam:      "🏗️",
  debris:    "♻️",
  lunar:     "🌑",
  defense:   "🛡️",
  ground:    "🗼",
  propulsion:"⚡",
};

const SUGGESTIONS_OFFERS = [
  "תמונות לוויין יומיות",
  "אנליטיקת AI לתשתיות",
  "Hosted payloads",
  "תקשורת לוויינית VSAT",
  "שירותי שיגור",
  "מעבדה במיקרו-G",
  "מיפוי תת-קרקעי",
  "ניטור ימי",
];
const SUGGESTIONS_NEEDS = [
  "שותף הפצה ב-EU",
  "Anchor customer",
  "גישה ל-Ground Network",
  "פיילוט עם משרד הביטחון",
  "פלטפורמת AI ל-Edge",
  "Lead investor — Series A",
  "מסלולים ל-LEO",
  "שותף לפיתוח משותף",
];

function JoinApp() {
  const [step, setStep] = React.useState("welcome");
  const [history, setHistory] = React.useState([]);
  const [data, setData] = React.useState({
    name: "",
    sectors: [],
    blurb: "",
    offers: [],
    needs: [],
    stage: "",
    country: "ישראל",
    hq: "",
    contactName: "",
    contactRole: "",
    email: "",
  });

  const setField = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const STEPS_ORDER = ["who", "what", "describe", "offer", "want", "stage", "contact", "review", "done"];
  const progressIdx = STEPS_ORDER.indexOf(step);
  const progressMax = STEPS_ORDER.length - 1;

  const goto = (s) => {
    setHistory((h) => step !== "welcome" ? [...h, step] : h);
    setStep(s);
  };
  const back = () => {
    const last = history[history.length - 1];
    if (last) {
      setHistory((h) => h.slice(0, -1));
      setStep(last);
    } else if (step !== "welcome") {
      setStep("welcome");
    }
  };
  const next = () => {
    const idx = STEPS_ORDER.indexOf(step);
    if (idx >= 0 && idx < STEPS_ORDER.length - 1) goto(STEPS_ORDER[idx + 1]);
  };

  return (
    <div className="join-shell">
      <div className="starfield" />

      <header className="join-top">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <div className="brand-name">ecos</div>
            <div className="brand-sub">Space Ecosystem</div>
          </div>
        </div>
        <div className="links">
          <a>למה להצטרף?</a>
          <a>שאלות נפוצות</a>
          <a href="ecos.html" style={{ color: "var(--text-2)" }}>כניסת חברים →</a>
        </div>
      </header>

      <main className="join-stage">
        {step !== "welcome" && step !== "done" && step !== "import" && (
          <ProgressBar idx={progressIdx - 1} total={progressMax - 1} />
        )}

        {step === "welcome" && <Welcome onGo={(s) => goto(s)} />}
        {step === "import"  && <ImportScreen onDone={() => { applyMockImport(setData); goto("describe"); }} />}
        {step === "who"     && <StepWho data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "what"    && <StepWhat data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "describe"&& <StepDescribe data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "offer"   && <StepOffer data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "want"    && <StepWant data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "stage"   && <StepStage data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "contact" && <StepContact data={data} setField={setField} onNext={next} onBack={back} />}
        {step === "review"  && <StepReview data={data} onNext={() => goto("done")} onBack={back} onEdit={(s) => goto(s)} />}
        {step === "done"    && <DoneScreen data={data} />}
      </main>
    </div>
  );
}

function ProgressBar({ idx, total }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "0 80px", display: "flex", justifyContent: "center" }}>
      <div className="progress" style={{ width: "100%", maxWidth: 720, marginTop: -8, marginBottom: 0 }}>
        {Array.from({ length: total + 1 }).map((_, i) => (
          <div key={i} className={"bar " + (i < idx ? "done" : i === idx ? "active" : "")} />
        ))}
      </div>
    </div>
  );
}

/* ============================ Welcome ============================ */

function Welcome({ onGo }) {
  return (
    <div className="join-card slide-anim" style={{ textAlign: "center" }}>
      <div className="join-eyebrow" style={{ justifyContent: "center" }}>
        <span className="dot" /> מצטרפים לאקוסיסטם החלל הישראלי
      </div>
      <h1 className="join-title">
        החברה שלכם, מחוברת.<br />
        <span className="accent">לאלפי הזדמנויות.</span>
      </h1>
      <p className="join-sub" style={{ margin: "0 auto" }}>
        ecos הוא מאגר חכם של מאות חברות חלל, סוכנויות ומובילי תעשייה.
        הצטרפו פעם אחת — והמערכת מחברת אתכם אוטומטית לשותפים, ללקוחות ולפרויקטים שמתאימים לכם.
      </p>

      <div className="welcome-grid">
        <div className="welcome-option" onClick={() => onGo("import")}>
          <div className="ic-bg linkedin"><window.I.Linkedin size={22} style={{ color: "white" }} /></div>
          <h3>הירשמו עם LinkedIn</h3>
          <div className="meta">המהיר ביותר. נמלא עבורכם 80% מהפרטים אוטומטית מהפרופיל של החברה.</div>
          <div className="time"><span className="dot" /> כמינוט אחד</div>
        </div>
        <div className="welcome-option" onClick={() => onGo("who")}>
          <div className="ic-bg manual"><window.I.Plus size={22} style={{ color: "white" }} /></div>
          <h3>מלאו ידנית</h3>
          <div className="meta">שאלות פשוטות, אחת אחת. אנחנו נשמור התקדמות אוטומטית כדי שתוכלו לחזור.</div>
          <div className="time"><span className="dot" /> 3–4 דקות</div>
        </div>
      </div>

      <div className="trust-strip">
        <span className="label">חברים באקוסיסטם</span>
        <span className="item">IAI</span>
        <span className="item">רפאל</span>
        <span className="item">ICEYE</span>
        <span className="item">Planet</span>
        <span className="item">Ramon.Space</span>
        <span className="item">+ 280</span>
      </div>
    </div>
  );
}

/* ============================ Import animation ============================ */

function ImportScreen({ onDone }) {
  const [log, setLog] = React.useState([]);
  const steps = [
    "מתחבר ל-LinkedIn…",
    "טוען פרופיל החברה",
    "מנתח 'About' ועדכונים אחרונים",
    "סורק את אתר החברה",
    "מסווג תחום פעילות וטכנולוגיות",
    "יוצר Tags חכמים",
    "מוכן — נעבור איתכם על הפרטים",
  ];
  React.useEffect(() => {
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setLog((l) => [...l, steps[i - 1]]);
      if (i >= steps.length) {
        clearInterval(tick);
        setTimeout(onDone, 700);
      }
    }, 480);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="join-card slide-anim" style={{ textAlign: "center" }}>
      <div className="loader-ring" style={{ margin: "0 auto 24px" }} />
      <h2 className="join-title" style={{ fontSize: 28 }}>
        רגע אחד, אנחנו <span className="accent">מכירים אתכם</span>
      </h2>
      <p className="join-sub" style={{ margin: "0 auto" }}>
        ה-AI שלנו ממלא עבורכם את הטופס. אל תסגרו את החלון.
      </p>
      <div className="import-log">
        {log.map((l, i) => (
          <div key={i} className={"line done"}>
            <window.I.Check size={14} style={{ color: "oklch(0.7 0.18 150)" }} />
            <span>{l}</span>
          </div>
        ))}
        {log.length < steps.length && (
          <div className="line">
            <div className="pulse" style={{ width: 14, height: 14, borderRadius: 50, background: "oklch(0.65 0.18 260)", boxShadow: "0 0 8px oklch(0.65 0.18 260)" }} />
            <span>{steps[log.length]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function applyMockImport(setData) {
  setData({
    name: "Skylight Dynamics",
    sectors: ["sar","ai"],
    blurb: "אנחנו מפתחים פלטפורמת ניתוח AI שמנצלת SAR בעוצמה נמוכה לזיהוי דליפות צנרת, פעילות ימית והערכת תשתיות — ב-30 דקות מרגע הצילום.",
    offers: ["Maritime monitoring API", "Edge SAR processing", "תמונות בזמן אמת"],
    needs: ["Distribution partners ב-EU", "Anchor customer ביטחוני"],
    stage: "Series A",
    country: "ישראל",
    hq: "Tel Aviv",
    contactName: "",
    contactRole: "",
    email: "",
  });
}

/* ============================ Step: WHO (name) ============================ */

function StepShell({ eyebrow, title, sub, children, onNext, onBack, nextLabel = "המשך", nextDisabled, step, total }) {
  return (
    <div className="join-card slide-anim">
      <div className="join-eyebrow"><span className="dot" /> {eyebrow}</div>
      <h2 className="join-title" style={{ fontSize: 34 }}>{title}</h2>
      {sub && <p className="join-sub">{sub}</p>}
      <div style={{ marginTop: 36 }}>{children}</div>
      <div className="join-foot">
        <button className="btn btn-ghost btn-big" onClick={onBack}><window.I.ArrowRight size={14} /> חזרה</button>
        <div style={{ flex: 1 }} />
        {step && <div className="join-step">שלב {step} מתוך {total}</div>}
        <button className="btn btn-primary btn-big" onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <window.I.ArrowLeft size={14} />
        </button>
      </div>
    </div>
  );
}

function StepWho({ data, setField, onNext, onBack }) {
  const inputRef = React.useRef();
  React.useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <StepShell
      eyebrow="התחלה · שאלה 1 מתוך 7"
      title="איך קוראים לחברה שלכם?"
      sub="הכניסו את השם הרשמי. נציג אותו ככה בדיוק לחברים אחרים באקוסיסטם."
      onNext={onNext} onBack={onBack}
      nextDisabled={!data.name.trim()}
      step={1} total={7}
    >
      <input
        ref={inputRef}
        className="big-input"
        value={data.name}
        onChange={(e) => setField("name", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && data.name.trim() && onNext()}
        placeholder="לדוגמה: Skylight Dynamics"
      />
    </StepShell>
  );
}

/* ============================ Step: WHAT (sectors) ============================ */

function StepWhat({ data, setField, onNext, onBack }) {
  const toggle = (id) => setField("sectors",
    data.sectors.includes(id) ? data.sectors.filter((x) => x !== id) : [...data.sectors, id]);
  return (
    <StepShell
      eyebrow="שאלה 2 מתוך 7"
      title="באיזה תחום אתם פעילים?"
      sub="בחרו 1–3 תחומים שהכי מייצגים אתכם. אפשר תמיד לעדכן."
      onNext={onNext} onBack={onBack}
      nextDisabled={data.sectors.length === 0}
      step={2} total={7}
    >
      <div className="choice-grid">
        {window.SECTORS.map((s) => (
          <div key={s.id}
               className={"choice" + (data.sectors.includes(s.id) ? " active" : "")}
               onClick={() => toggle(s.id)}
               style={{ "--sector-color": s.color }}>
            <div className="ic">{SECTOR_ICONS[s.id]}</div>
            <div className="lbl">{s.label}</div>
            <div className="check"><window.I.Check size={11} style={{ color: "white" }} /></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-4)", textAlign: "center" }}>
        בחרתם {data.sectors.length} {data.sectors.length === 1 ? "תחום" : "תחומים"}
      </div>
    </StepShell>
  );
}

/* ============================ Step: DESCRIBE (one line) ============================ */

function StepDescribe({ data, setField, onNext, onBack }) {
  const ref = React.useRef();
  React.useEffect(() => { ref.current?.focus(); }, []);
  return (
    <StepShell
      eyebrow="שאלה 3 מתוך 7"
      title="במשפט אחד — מה אתם עושים?"
      sub="הסבירו כמו שהייתם מסבירים לחבר. כן צריך לאיפיין, אבל לא צריך מילים יפות."
      onNext={onNext} onBack={onBack}
      nextDisabled={!data.blurb.trim()}
      step={3} total={7}
    >
      <textarea
        ref={ref}
        className="big-textarea"
        value={data.blurb}
        onChange={(e) => setField("blurb", e.target.value)}
        placeholder="אנחנו עוזרים ל­חברות חשמל לאתר דליפות בצינורות תת-קרקעיים, באמצעות אלגוריתמי AI על תמונות SAR מהחלל."
        rows={4}
      />
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-4)", display: "flex", justifyContent: "space-between" }}>
        <span>{data.blurb.length} תווים</span>
        <span>✨ AI יסכם וייצר תיוגים אוטומטיים</span>
      </div>
    </StepShell>
  );
}

/* ============================ Step: OFFER ============================ */

function TagInput({ value, onChange, placeholder, suggestions }) {
  const [draft, setDraft] = React.useState("");
  const add = (v) => {
    const t = (v || draft).trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setDraft("");
  };
  const remove = (t) => onChange(value.filter((x) => x !== t));
  return (
    <div>
      <div className="tag-input">
        {value.map((t) => (
          <span key={t} className="tag">
            {t}
            <span className="x" onClick={() => remove(t)}>×</span>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
            if (e.key === "Backspace" && !draft && value.length) remove(value[value.length - 1]);
          }}
          onBlur={() => draft && add()}
          placeholder={value.length === 0 ? placeholder : "הוסיפו עוד · Enter כדי לאשר"}
        />
      </div>
      {suggestions && (
        <div className="suggestions">
          {suggestions.filter((s) => !value.includes(s)).slice(0, 6).map((s) => (
            <span key={s} className="sugg" onClick={() => add(s)}>
              <span className="plus">+</span> {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StepOffer({ data, setField, onNext, onBack }) {
  return (
    <StepShell
      eyebrow="שאלה 4 מתוך 7"
      title="מה אתם מציעים?"
      sub="מוצרים, שירותים, יכולות. הקלידו כל אחד ולחצו Enter, או בחרו מההצעות שלנו."
      onNext={onNext} onBack={onBack}
      nextDisabled={data.offers.length === 0}
      step={4} total={7}
    >
      <TagInput
        value={data.offers}
        onChange={(v) => setField("offers", v)}
        placeholder="לדוגמה: תמונות לוויין יומיות"
        suggestions={SUGGESTIONS_OFFERS}
      />
    </StepShell>
  );
}

/* ============================ Step: WANT ============================ */

function StepWant({ data, setField, onNext, onBack }) {
  return (
    <StepShell
      eyebrow="שאלה 5 מתוך 7"
      title="ומה אתם מחפשים?"
      sub="שותפויות, לקוחות, ספקים, או יכולות חסרות. זה הצומת הכי חשוב להתאמות."
      onNext={onNext} onBack={onBack}
      nextDisabled={data.needs.length === 0}
      step={5} total={7}
    >
      <TagInput
        value={data.needs}
        onChange={(v) => setField("needs", v)}
        placeholder="לדוגמה: שותף הפצה ב-EU"
        suggestions={SUGGESTIONS_NEEDS}
      />
    </StepShell>
  );
}

/* ============================ Step: STAGE ============================ */

function StepStage({ data, setField, onNext, onBack }) {
  const stages = [
    { id: "Seed",       title: "Seed",       sub: "טרום-מוצר / MVP" },
    { id: "Series A",   title: "Series A",   sub: "מוצר ב-shipping" },
    { id: "Series B",   title: "Series B",   sub: "growth, צוות 30–100" },
    { id: "Growth",     title: "Growth",     sub: "scale-up מהיר" },
    { id: "Public",     title: "Public",     sub: "חברה ציבורית" },
    { id: "Enterprise", title: "Enterprise", sub: "תאגיד / סוכנות" },
  ];
  return (
    <StepShell
      eyebrow="שאלה 6 מתוך 7"
      title="באיזה שלב אתם?"
      sub="זה עוזר לנו לחבר אתכם למשקיעים, ללקוחות ולשותפים בגודל המתאים."
      onNext={onNext} onBack={onBack}
      nextDisabled={!data.stage}
      step={6} total={7}
    >
      <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {stages.map((s) => (
          <div key={s.id}
               className={"choice" + (data.stage === s.id ? " active" : "")}
               onClick={() => setField("stage", s.id)}
               style={{ "--sector-color": "oklch(0.65 0.18 260)" }}>
            <div className="lbl" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{s.title}</div>
            <div className="sub">{s.sub}</div>
            <div className="check"><window.I.Check size={11} style={{ color: "white" }} /></div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            מדינה
          </div>
          <input className="input" value={data.country} onChange={(e) => setField("country", e.target.value)} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            מטה
          </div>
          <input className="input" value={data.hq} onChange={(e) => setField("hq", e.target.value)} placeholder="Tel Aviv" />
        </div>
      </div>
    </StepShell>
  );
}

/* ============================ Step: CONTACT ============================ */

function StepContact({ data, setField, onNext, onBack }) {
  const valid = data.contactName.trim() && /\S+@\S+\.\S+/.test(data.email);
  return (
    <StepShell
      eyebrow="שאלה אחרונה"
      title="אל מי לחזור?"
      sub="אנחנו לא מספאמים. הפרטים האלה רק לאישור הפרופיל ולהתחברויות שאתם תאשרו."
      onNext={onNext} onBack={onBack}
      nextLabel="המשך לסקירה"
      nextDisabled={!valid}
      step={7} total={7}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field">
          <label>שם מלא <span className="req">*</span></label>
          <input className="input" value={data.contactName} onChange={(e) => setField("contactName", e.target.value)} placeholder="מאיה לוי" />
        </div>
        <div className="field">
          <label>תפקיד</label>
          <input className="input" value={data.contactRole} onChange={(e) => setField("contactRole", e.target.value)} placeholder="VP Business Development" />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>אימייל בעבודה <span className="req">*</span></label>
          <input className="input ltr mono" dir="ltr" value={data.email} onChange={(e) => setField("email", e.target.value)} placeholder="maya@company.com" type="email" />
        </div>
      </div>

      <div style={{
        marginTop: 24, padding: 16, borderRadius: 12,
        background: "oklch(0.16 0.04 270 / 0.5)",
        border: "1px solid var(--line-1)",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <div style={{ flex: "none", width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, var(--blue), var(--violet))",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <window.I.Eye size={14} style={{ color: "white" }} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 500, color: "var(--text-1)", marginBottom: 2 }}>הפרופיל שלכם פרטי</div>
          רק מנהלי ecos יראו את הפרטים שלכם. חיבורים לחברות אחרות תמיד דורשים אישור שלכם מראש.
        </div>
      </div>
    </StepShell>
  );
}

/* ============================ Step: REVIEW ============================ */

function StepReview({ data, onNext, onBack, onEdit }) {
  const sectorLabels = data.sectors.map((s) => window.SECTORS.find((x) => x.id === s)?.label).filter(Boolean).join(" · ");
  return (
    <div className="join-card slide-anim">
      <div className="join-eyebrow"><span className="dot" /> סקירה אחרונה</div>
      <h2 className="join-title" style={{ fontSize: 34 }}>אלה הפרטים שלכם.<br /><span className="accent">נראה טוב?</span></h2>
      <p className="join-sub">בדקו והגישו. נחזור אליכם תוך 24 שעות עם פרופיל מוכן.</p>

      <div style={{ marginTop: 32 }}>
        <ReviewBlock label="חברה" editTo="who" onEdit={onEdit}>
          <div className="review-row"><span className="k">שם</span><span className="v">{data.name || "—"}</span></div>
          <div className="review-row"><span className="k">תחום</span><span className="v">{sectorLabels || "—"}</span></div>
          <div className="review-row"><span className="k">שלב</span><span className="v">{data.stage || "—"}</span></div>
          <div className="review-row"><span className="k">מיקום</span><span className="v">{data.hq ? `${data.hq}, ${data.country}` : data.country}</span></div>
        </ReviewBlock>

        <ReviewBlock label="עוסקים ב" editTo="describe" onEdit={onEdit}>
          <div style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6, padding: "8px 0" }}>
            {data.blurb || <span style={{ color: "var(--text-4)" }}>—</span>}
          </div>
        </ReviewBlock>

        <ReviewBlock label="מציעים" editTo="offer" onEdit={onEdit}>
          <div className="flex wrap gap-6" style={{ padding: "8px 0" }}>
            {data.offers.length === 0 ? <span style={{ color: "var(--text-4)" }}>—</span> :
              data.offers.map((o) => <span key={o} className="tag">{o}</span>)}
          </div>
        </ReviewBlock>

        <ReviewBlock label="מחפשים" editTo="want" onEdit={onEdit}>
          <div className="flex wrap gap-6" style={{ padding: "8px 0" }}>
            {data.needs.length === 0 ? <span style={{ color: "var(--text-4)" }}>—</span> :
              data.needs.map((o) => <span key={o} className="tag">{o}</span>)}
          </div>
        </ReviewBlock>

        <ReviewBlock label="איש קשר" editTo="contact" onEdit={onEdit} last>
          <div className="review-row"><span className="k">שם</span><span className="v">{data.contactName || "—"}</span></div>
          <div className="review-row"><span className="k">תפקיד</span><span className="v">{data.contactRole || "—"}</span></div>
          <div className="review-row"><span className="k">אימייל</span><span className="v mono ltr">{data.email || "—"}</span></div>
        </ReviewBlock>
      </div>

      <div className="join-foot">
        <button className="btn btn-ghost btn-big" onClick={onBack}><window.I.ArrowRight size={14} /> חזרה</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-xl" onClick={onNext}>
          <window.I.Send size={14} /> שגרו את הפרופיל
        </button>
      </div>
    </div>
  );
}

function ReviewBlock({ label, children, editTo, onEdit, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)" }}>
          {label}
        </div>
        <span style={{ fontSize: 11.5, color: "var(--text-3)", cursor: "default" }} onClick={() => onEdit(editTo)}>
          ערוך
        </span>
      </div>
      {children}
    </div>
  );
}

/* ============================ Done ============================ */

function DoneScreen({ data }) {
  return (
    <div className="join-card slide-anim" style={{ textAlign: "center" }}>
      <div className="success-mark">
        <window.I.Check size={42} style={{ color: "white" }} sw={2.5} />
      </div>
      <div className="join-eyebrow" style={{ justifyContent: "center" }}>
        <span className="dot" style={{ background: "oklch(0.7 0.18 150)", boxShadow: "0 0 10px oklch(0.7 0.18 150)" }} />
        שיגור הצליח
      </div>
      <h2 className="join-title" style={{ fontSize: 36 }}>
        ברוכים הבאים <span className="accent">לאקוסיסטם.</span>
      </h2>
      <p className="join-sub" style={{ margin: "0 auto" }}>
        {data.name ? <><b style={{ color: "var(--text-1)" }}>{data.name}</b> נמצאת ברשימת ההצטרפות. </> : null}
        תוך 24 שעות נשלח לכם מייל ב-<span className="mono ltr" style={{ color: "var(--text-1)" }}>{data.email}</span> עם פרופיל החברה מוכן וקישור לדשבורד שלכם.
      </p>

      <div style={{
        marginTop: 36, padding: 28,
        background: "linear-gradient(180deg, oklch(0.16 0.04 270 / 0.6), oklch(0.12 0.025 270 / 0.6))",
        border: "1px solid var(--line-2)", borderRadius: 16,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>
          מה קורה עכשיו?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {[
            ["1", "ביקורת AI", "ה-AI עובר על הפרטים ויוצר Tags + פרופיל ציבורי", "oklch(0.7 0.18 260)"],
            ["2", "אישור צוות", "מנהל אקוסיסטם אישי בודק ומאשר ב-24 שעות", "oklch(0.72 0.18 295)"],
            ["3", "התאמות חיות", "תקבלו 5 חיבורים מומלצים ראשונים במייל", "oklch(0.7 0.18 150)"],
          ].map(([n, t, d, c]) => (
            <div key={n} style={{ textAlign: "start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `linear-gradient(135deg, ${c}, oklch(from ${c} 0.4 c h))`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
                marginBottom: 8,
              }}>{n}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12 }}>
        <a href="ecos.html" className="btn btn-primary btn-big" style={{ textDecoration: "none" }}>
          הציצו בדשבורד <window.I.ArrowLeft size={14} />
        </a>
        <button className="btn btn-ghost btn-big" onClick={() => location.reload()}>
          הוסיפו עוד חברה
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<JoinApp />);
