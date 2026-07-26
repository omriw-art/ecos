// ecos — local smart-search drawer + People (Org) view + small Settings view.

function Copilot({ open, onClose }) {
  const [messages, setMessages] = React.useState([
    { role: "ai", text: "שלום. אני חיפוש חכם על מאגר החברות המקומי — אפשר לשאול אותי על חברה, טכנולוגיה או תחום." },
  ]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const send = async () => {
    if (!draft.trim()) return;
    const q = draft.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setDraft("");
    setBusy(true);
    setTimeout(() => {
      const ql = q.toLowerCase();
      // Local keyword search only — filters the actual local COMPANIES records.
      // No canned/invented replies: every response here is derived from local data.
      const searchCompanies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
      const hits = searchCompanies.filter((c) => {
        const hay = [c.name, c.blurb, ...(c.tech || []), ...(c.sectors || [])].join(" ").toLowerCase();
        return ql.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
      }).slice(0, 5);
      const reply = hits.length > 0
        ? `מצאתי ${hits.length} חברות רלוונטיות בנתונים המקומיים: ${hits.map((c) => c.name).join(", ")}. לפרטים — פתח את פרופיל החברה ישירות.`
        : "לא נמצאו תוצאות במאגר המקומי";
      setMessages((m) => [...m, { role: "ai", text: reply }]);
      setBusy(false);
    }, 900);
  };

  const suggested = [
    "מצא לי חברות ISAM ישראליות מוכנות לפיילוט",
    "סכם את האקוסיסטם של SAR נכון להיום",
    "אילו חברות עונות על הצרכים של Elbit Systems?",
    "Hawkeye vs Spire — מי מתאים יותר ל-ISR?",
  ];

  return (
    <>
      <div className={"drawer-backdrop" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")}>
        <div className="drawer-hd">
          <div style={{ width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--violet), var(--blue))",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <window.I.Sparkles size={14} style={{ color: "white" }} />
          </div>
          <div className="col" style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ecos · חיפוש חכם</div>
            <div className="mono tiny" style={{ color: "var(--text-4)" }}>{busy ? "מחפש…" : "demo · נתונים מקומיים"}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><window.I.X size={14} /></button>
        </div>

        <div className="drawer-body">
          {messages.map((m, i) => (
            <div key={i} className={"chat-bubble " + m.role} style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          ))}
          {busy && (
            <div className="chat-bubble ai pulse" style={{ width: 60 }}>
              <span>•••</span>
            </div>
          )}

          {!busy && (
            <div className="col gap-6" style={{ marginTop: 4 }}>
              <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>הצעות</div>
              {suggested.map((s, i) => (
                <div key={i} className="chip" style={{ padding: "8px 12px", cursor: "default" }}
                     onClick={() => setDraft(s)}>
                  <window.I.Sparkles size={11} style={{ color: "var(--violet)" }} />
                  <span style={{ fontSize: 12 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <div className="flex gap-8 center" style={{
            background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10, padding: 8,
          }}>
            <input style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: "var(--text-1)", fontSize: 13, fontFamily: "inherit" }}
                   placeholder="חפש חברה, טכנולוגיה או תחום…"
                   value={draft} onChange={(e) => setDraft(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="btn btn-primary" style={{ padding: "5px 10px" }} onClick={send}>
              <window.I.Send size={12} />
            </button>
          </div>
          <div className="tiny dim mono" style={{ textAlign: "center", marginTop: 6 }}>
            ⌘K לפתיחה מהירה · Esc לסגירה
          </div>
        </div>
      </aside>
    </>
  );
}


/* ────────────────────────── People (Org) ────────────────────────── */

function PeopleView({ onNav }) {
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הארגון שלי</h2>
          <div className="sub">ניהול אנשי צוות אינו חלק מהדמו המקומי הנוכחי</div>
        </div>
      </div>

      <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <window.I.Users size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 6 }}>אין נתונים זמינים בשלב הדמו המקומי</div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>האקוסיסטם כאן מתועד לפי חברות, יכולות וצרכים — לא לפי אנשי צוות.</div>
      </div>
    </div>
  );
}


/* ────────────────────────── Settings (minimal) ────────────────────────── */

// Admin Organization Intake / Company Accounts MVP — the one real "login
// screen" in the product: username + credential -> CompanyAccountStore ->
// companyId -> onCompanyLogin (app.jsx) enters that company's existing
// canonical profile through the same acting-company lens Admin's own
// "view-as" already uses. Never touches CompanyStore directly and never
// sees a credentialHash — CompanyAccountStore.authenticate is the only
// thing this component calls.
function CompanySignInPanel({ onCompanyLogin }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = (e) => {
    e.preventDefault();
    const result = window.CompanyAccountStore ? window.CompanyAccountStore.authenticate(username, password) : null;
    if (!result) {
      setError("שם משתמש או סיסמה שגויים");
      return;
    }
    setError("");
    setUsername("");
    setPassword("");
    if (onCompanyLogin) onCompanyLogin(result.companyId);
    window.toast("מחובר בתור החברה", "ok");
  };

  return (
    <div className="card">
      <div className="card-hd"><div className="card-title"><span className="dot" /> כניסת חברה (דמו מקומי)</div></div>
      <div className="muted tiny" style={{ marginBottom: 10 }}>
        אימות מול חשבונות שנוצרו בעמוד "ארגונים" · מקומי בלבד, לא אימות אמיתי.
      </div>
      <form className="col gap-10" onSubmit={submit}>
        <input className="input" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" />
        <input className="input" type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
        {error && <div style={{ color: "var(--rose)", fontSize: 13 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>כניסה</button>
      </form>
    </div>
  );
}

function SettingsView({ onCompanyLogin }) {
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הגדרות</h2>
          <div className="sub">הרשאות, נראות, אינטגרציות. הגדרות שלא יוצרות פגיעה ב-data.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <CompanySignInPanel onCompanyLogin={onCompanyLogin} />
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot" /> אינטגרציות</div></div>
          <div className="col gap-10">
            {[
              { name: "LinkedIn Talent", state: "off", note: "לא מחובר · בקרוב" },
              { name: "Crunchbase Pro",  state: "off", note: "לא מחובר · בקרוב" },
              { name: "Salesforce CRM",  state: "off", note: "לא מחובר · בקרוב" },
              { name: "Snowflake",       state: "off", note: "לא מחובר · בקרוב" },
              { name: "Microsoft Teams", state: "off", note: "לא מחובר · בקרוב" },
            ].map((x) => (
              <div key={x.name} className="flex center between" style={{
                padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8,
              }}>
                <div className="col">
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{x.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{x.note}</div>
                </div>
                <span className={"pill " + (x.state === "ok" ? "green" : x.state === "warn" ? "amber" : "")}>
                  {x.state === "ok" ? "פעיל" : x.state === "warn" ? "התראה" : "לא מחובר"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot violet" /> משקלי Scoring</div></div>
          <div className="col gap-14">
            {[
              ["התאמה לצרכים", 35, "var(--blue)"],
              ["פוטנציאל שיתוף פעולה", 25, "var(--violet)"],
              ["חדשנות", 15, "var(--cyan)"],
              ["רלוונטיות אסטרטגית", 15, "var(--amber)"],
              ["מוכנות", 10, "var(--green)"],
            ].map(([l, v, col]) => (
              <FitBar key={l} label={l} score={v} color={col} />
            ))}
          </div>
          <div className="divider" />
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled title="Scoring מחושב אוטומטית מהנתונים הקיימים"><window.I.Bolt size={12} /> הריצו מחדש על כל המאגר</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Copilot, PeopleView, SettingsView });
