// ecos — AI Copilot drawer + People (Org) view + small Settings view.

function Copilot({ open, onClose }) {
  const [messages, setMessages] = React.useState([
    { role: "ai", text: "שלום רון. אני ה-Copilot של ecos. אני יכול לחפש חברות, להציע חיבורים, לחשב התאמה לעובד, או לכתוב סיכום אקוסיסטם. ננסה?" },
    { role: "user", text: "מי החברות הכי רלוונטיות ל-Maya Levi (R&D AI) השבוע?" },
    { role: "ai", text: "מצאתי 3 מועמדות חזקות:\n• Ramon.Space — space-grade AI compute, חופפת ל-2 מתחומי העניין שלה.\n• HawkEye 360 — RF + AI, רלוונטית לפרויקט multi-INT שלה.\n• ASTERRA — L-band SAR + ML, פיילוט מצוין לתחום חדש.\n\nרוצה שאכין הצעת intro לכולן בבת-אחת?" },
  ]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const send = async () => {
    if (!draft.trim()) return;
    const q = draft.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setDraft("");
    setBusy(true);
    // Stubbed canned responses
    setTimeout(() => {
      const replies = {
        "default": "בדקתי במאגר. אני יכול להציע 5 חברות שעונות על הקריטריון. רוצה שאריץ scoring למודל ההתאמה?",
        "iceye":   "ICEYE: SAR Finland, 25cm רזולוציה, Defense Cleared. חופפת חזק ל-Capella ו-Umbra; שיתוף פעולה אפשרי על fusion עם HawkEye 360.",
        "lunar":   "באקוסיסטם הירחי: WeSpace (hopper), Helios (ISRU). מומלץ להזמין שיחה משולבת ב-Q3 בשיתוף ESA-LSI.",
      };
      const key = Object.keys(replies).find((k) => q.toLowerCase().includes(k)) || "default";
      setMessages((m) => [...m, { role: "ai", text: replies[key] }]);
      setBusy(false);
    }, 900);
  };

  const suggested = [
    "מצא לי חברות ISAM ישראליות מוכנות לפיילוט",
    "סכם את האקוסיסטם של SAR נכון להיום",
    "אילו עובדים מתאימים ל-Astroscale?",
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
            <div style={{ fontSize: 14, fontWeight: 600 }}>ecos · Copilot</div>
            <div className="mono tiny" style={{ color: "var(--text-4)" }}>{busy ? "חושב…" : "מקושר למאגר · live"}</div>
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
                   placeholder="שאל את ה-Copilot…"
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
  const { PEOPLE, COMPANIES } = window;
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הארגון שלי</h2>
          <div className="sub">{PEOPLE.length} עובדים פעילים · התאמות מתעדכנות כל לילה ב-02:00</div>
        </div>
        <div className="ops">
          <button className="btn" onClick={() => window.toast("ייבוא מ-Workday יהיה זמין בקרוב")}><window.I.Upload size={13} /> ייבוא מ-Workday</button>
          <button className="btn btn-primary" onClick={() => window.toast("הוספת עובד — בקרוב")}><window.I.Plus size={13} /> הוסף עובד</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
        {PEOPLE.map((p) => (
          <div key={p.id} className="card" style={{ position: "relative" }}>
            <div className="flex center gap-12">
              <div className="sidebar-avatar" style={{ width: 48, height: 48, fontSize: 15,
                   background: `linear-gradient(135deg, ${p.color}, oklch(from ${p.color} 0.4 c h))` }}>{p.avatar}</div>
              <div className="col grow">
                <div style={{ fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 600 }}>{p.name}</div>
                <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.05em" }}>{p.role.toUpperCase()}</div>
              </div>
              <span className="pill mono">{p.matches.length} matches</span>
            </div>

            <div className="divider" />

            <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>תחומי עניין</div>
            <div className="flex wrap gap-4" style={{ marginBottom: 10 }}>
              {p.interests.map((i) => <SectorPill key={i} id={i} />)}
            </div>

            <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>חברות חמות עבורו</div>
            <div className="flex wrap gap-6">
              {p.matches.slice(0, 4).map((id) => {
                const c = COMPANIES.find((x) => x.id === id); if (!c) return null;
                return <span key={id} className="chip"><CoLogo company={c} size={16} /> {c.name}</span>;
              })}
            </div>

            <div className="flex between center" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line-1)" }}>
              <button className="btn btn-ghost" onClick={() => window.toast("פרופיל מלא — בקרוב")}><window.I.Eye size={12} /> פרופיל מלא</button>
              <button className="btn" onClick={() => onNav("matches")}><window.I.Sparkles size={12} /> פתח matches</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ────────────────────────── Settings (minimal) ────────────────────────── */

function SettingsView() {
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>הגדרות</h2>
          <div className="sub">הרשאות, נראות, אינטגרציות. הגדרות שלא יוצרות פגיעה ב-data.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="dot" /> אינטגרציות</div></div>
          <div className="col gap-10">
            {[
              { name: "LinkedIn Talent", state: "ok", note: "מסונכרן · 4 דק׳" },
              { name: "Crunchbase Pro",  state: "ok", note: "מסונכרן · 12 דק׳" },
              { name: "Salesforce CRM",  state: "warn", note: "טוקן יפוג בעוד 3 ימים" },
              { name: "Snowflake",       state: "ok", note: "מסונכרן" },
              { name: "Microsoft Teams", state: "off", note: "לא מחובר" },
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
              ["התאמה לעובדים", 35, "var(--blue)"],
              ["פוטנציאל שיתוף פעולה", 25, "var(--violet)"],
              ["חדשנות", 15, "var(--cyan)"],
              ["רלוונטיות אסטרטגית", 15, "var(--amber)"],
              ["Readiness", 10, "var(--green)"],
            ].map(([l, v, col]) => (
              <FitBar key={l} label={l} score={v} color={col} />
            ))}
          </div>
          <div className="divider" />
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => window.toast("מריץ scoring מחדש… (demo)", "ok")}><window.I.Bolt size={12} /> הריצו מחדש על כל המאגר</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Copilot, PeopleView, SettingsView });
