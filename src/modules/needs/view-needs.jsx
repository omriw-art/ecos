// ecos — Needs Board (P16A)
// Flattens organization.needs across all local organizations into one
// searchable board, and lets the user append a local need to an existing
// organization. No new store: organization.needs (string array) stays the
// single source of truth — this view only derives from it and writes back
// through the existing CompanyStore.updateCompany, exactly like the company
// editor does. No matching-around-needs yet (that's a later batch).

function needText(rawNeed) {
  if (typeof rawNeed === "string") return rawNeed;
  if (rawNeed && typeof rawNeed === "object") {
    return String(rawNeed.text || rawNeed.label || rawNeed.name || JSON.stringify(rawNeed));
  }
  return String(rawNeed || "");
}

function getLocalCompanies() {
  if (window.CompanyStore && typeof window.CompanyStore.getCompanies === "function") {
    return window.CompanyStore.getCompanies();
  }
  return window.COMPANIES || [];
}

function flattenNeeds(companies) {
  const rows = [];
  companies.forEach((c) => {
    (c.needs || []).forEach((rawNeed, idx) => {
      const text = needText(rawNeed).trim();
      if (!text) return;
      rows.push({
        id: `${c.id}::${idx}`,
        companyId: c.id,
        companyName: c.name,
        text,
        organizationType: c.organizationType,
        spaceSegment: c.spaceSegment,
        sectors: c.sectors || [],
      });
    });
  });
  return rows;
}

function NeedsView({ onOpenCompany }) {
  const [companies, setCompanies] = React.useState(() => getLocalCompanies());
  const [q, setQ] = React.useState("");
  const [orgTypeFilter, setOrgTypeFilter] = React.useState("all");
  const [addOrgId, setAddOrgId] = React.useState("");
  const [addText, setAddText] = React.useState("");

  const refresh = () => setCompanies(getLocalCompanies());

  const sortedCompanies = React.useMemo(
    () => companies.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [companies]
  );

  const allNeeds = React.useMemo(() => flattenNeeds(companies), [companies]);

  const filtered = allNeeds.filter((n) => {
    if (orgTypeFilter !== "all" && (n.organizationType || "other") !== orgTypeFilter) return false;
    if (q) {
      const hay = `${n.text} ${n.companyName}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const submitNeed = (e) => {
    e.preventDefault();
    const text = addText.trim();
    if (!addOrgId || !text) return;
    const target = companies.find((c) => c.id === addOrgId);
    if (!target) return;
    const nextNeeds = [...(target.needs || []), text];
    if (window.CompanyStore && typeof window.CompanyStore.updateCompany === "function") {
      window.CompanyStore.updateCompany(addOrgId, { needs: nextNeeds });
    }
    setAddText("");
    refresh();
    window.toast && window.toast(`הצורך נוסף ל-${target.name}`, "ok");
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>לוח צרכים</h2>
          <div className="sub">{allNeeds.length} צרכים מ-{companies.length} ארגונים · מהמאגר המקומי</div>
        </div>
      </div>

      {/* Add need */}
      <form className="card" onSubmit={submitNeed}>
        <div className="card-hd"><div className="card-title"><span className="dot" /> הוספת צורך לארגון קיים</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700 }}>ארגון</label>
            <select className="select" value={addOrgId} onChange={(e) => setAddOrgId(e.target.value)}>
              <option value="">בחרו ארגון…</option>
              {sortedCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 14, fontWeight: 700 }}>תיאור הצורך</label>
            <input className="input" value={addText} onChange={(e) => setAddText(e.target.value)}
                   placeholder="לדוגמה: שותף הפצה באירופה" />
          </div>
        </div>
        <div className="flex center gap-8" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-primary" disabled={!addOrgId || !addText.trim()}>
            <window.I.Plus size={13} /> הוסף צורך
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div className="flex center gap-8 wrap">
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>סוג ארגון</span>
          <span className={"chip" + (orgTypeFilter === "all" ? " active" : "")} onClick={() => setOrgTypeFilter("all")}>הכל</span>
          {(window.ORGANIZATION_TYPES || []).map((t) => (
            <span key={t.id} className={"chip" + (orgTypeFilter === t.id ? " active" : "")} onClick={() => setOrgTypeFilter(t.id)}>{t.label}</span>
          ))}
          <div className="grow" />
          <div className="search" style={{ flex: "none", width: 260, padding: "5px 10px" }}>
            <window.I.Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש צורך או ארגון…" />
          </div>
        </div>
      </div>

      {/* Board */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <window.I.Compass size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          {allNeeds.length === 0 ? (
            <>
              <div style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 6 }}>אין עדיין צרכים במאגר המקומי</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>אפשר להוסיף צורך לארגון קיים כדי להתחיל לבנות לוח צרכים.</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-3)" }}>לא נמצאו צרכים תואמים לסינון הנוכחי.</div>
          )}
        </div>
      ) : (
        <div className="col gap-8">
          {filtered.map((n) => {
            const co = companies.find((c) => c.id === n.companyId);
            return (
              <div key={n.id} className="card" style={{ padding: 14 }}>
                <div className="flex gap-12" style={{ alignItems: "flex-start" }}>
                  {co && <window.CoLogo company={co} size={36} />}
                  <div className="col grow" style={{ minWidth: 0, gap: 4 }}>
                    <div style={{ fontSize: 15, color: "var(--text-1)", lineHeight: 1.5 }}>{n.text}</div>
                    <div className="flex center gap-8 wrap">
                      <span
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)", cursor: "default" }}
                        onClick={() => onOpenCompany && onOpenCompany(n.companyId)}
                      >
                        {n.companyName}
                      </span>
                      <span className="pill" style={{ fontSize: 11 }}>{window.orgTypeLabel ? window.orgTypeLabel(n.organizationType) : (n.organizationType || "אחר")}</span>
                      <span className="pill" style={{ fontSize: 11 }}>{window.spaceSegmentShortLabel ? window.spaceSegmentShortLabel(n.spaceSegment) : (n.spaceSegment || "אחר")}</span>
                      <span className="mono tiny" style={{ color: "var(--text-4)" }}>מהמאגר המקומי</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NeedsView });
