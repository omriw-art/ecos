// ecos — Admin Demand Board: needs, opportunities, and challenges (P16A/D/E/G)
// Two independent local sources feed one board:
//  1. organization.needs (string array on company records) — unchanged,
//     still the single source of truth for org-submitted needs, still
//     written through CompanyStore.updateCompany exactly as before. Not
//     editable/deletable from here (see "עריכה דרך פרופיל הארגון" note).
//  2. NeedsStore (localStorage) — admin-created needs/opportunities/
//     challenges, fully editable/deletable here.
// Matches are computed live via MatchEngine.rankOrganizationsForNeed —
// deterministic keyword overlap, no AI, no network.

const SOURCE_TYPE_OPTIONS = [
  { id: "internal", label: "צורך פנימי" },
  { id: "organization", label: "צורך של ארגון" },
  { id: "opportunity", label: "הזדמנות שזוהתה" },
];
const SPACE_SEGMENT_OPTIONS = [
  { id: "upstream", label: "Upstream / תשתיות וחלל" },
  { id: "space-in", label: "Space-In / פעילות בחלל" },
  { id: "downstream", label: "Downstream / שירותים ודאטה" },
  { id: "development-research", label: "Development & Research / פיתוח ומחקר" },
  { id: "services-ecosystem", label: "Services Ecosystem / שירותי אקו־סיסטם" },
  { id: "other", label: "אחר" },
];
const NEED_TYPE_OPTIONS = [
  { id: "pilot", label: "פיילוט" },
  { id: "customer", label: "לקוח" },
  { id: "funding", label: "מימון" },
  { id: "technology", label: "טכנולוגיה" },
  { id: "data", label: "דאטה" },
  { id: "regulation", label: "רגולציה" },
  { id: "partner", label: "שותף" },
  { id: "research", label: "מחקר" },
  { id: "challenge", label: "אתגר" },
  { id: "other", label: "אחר" },
];
const PRIORITY_OPTIONS = [
  { id: "high", label: "גבוהה" },
  { id: "medium", label: "בינונית" },
  { id: "low", label: "נמוכה" },
];
const NEED_STATUS_OPTIONS = [
  { id: "new", label: "חדש" },
  { id: "reviewing", label: "בבדיקה" },
  { id: "matching", label: "בהתאמה" },
  { id: "in-progress", label: "בטיפול" },
  { id: "done", label: "הושלם" },
];

function optLabel(options, id, fallback) {
  const found = options.find((o) => o.id === id);
  return found ? found.label : (fallback || id || "אחר");
}

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

function getAdminNeeds() {
  if (window.NeedsStore && typeof window.NeedsStore.getNeeds === "function") {
    return window.NeedsStore.getNeeds();
  }
  return [];
}

// Flattens both sources into one board-item shape.
function buildBoardItems(companies, adminNeeds) {
  const items = [];
  companies.forEach((c) => {
    (c.needs || []).forEach((rawNeed, idx) => {
      const t = needText(rawNeed).trim();
      if (!t) return;
      items.push({
        id: `${c.id}::${idx}`,
        kind: "organization",
        title: t,
        description: "",
        sourceType: "organization",
        sourceLabel: optLabel(SOURCE_TYPE_OPTIONS, "organization"),
        sourceOrgId: c.id,
        sourceOrgName: c.name,
        spaceSegment: c.spaceSegment,
        needType: null,
        priority: null,
        status: null,
        matchText: t,
        excludeId: c.id,
      });
    });
  });
  adminNeeds.forEach((n) => {
    items.push({
      id: n.id,
      kind: "admin",
      title: n.title,
      description: n.description,
      sourceType: n.sourceType,
      sourceLabel: optLabel(SOURCE_TYPE_OPTIONS, n.sourceType),
      sourceOrgId: n.sourceOrganizationId,
      sourceOrgName: null,
      spaceSegment: n.spaceSegment,
      needType: n.needType,
      priority: n.priority,
      status: n.status,
      matchText: [n.title, n.description, n.needType, n.spaceSegment].filter(Boolean).join(" "),
      excludeId: n.sourceOrganizationId,
    });
  });
  return items;
}

function NeedMatches({ item, companies, onOpenCompany }) {
  const [showAll, setShowAll] = React.useState(false);
  const matches = React.useMemo(() => {
    if (!window.MatchEngine || typeof window.MatchEngine.rankOrganizationsForNeed !== "function") return [];
    return window.MatchEngine.rankOrganizationsForNeed(item.matchText, companies, { limit: 8, minScore: 15, excludeId: item.excludeId });
  }, [item, companies]);

  const visible = showAll ? matches : matches.slice(0, 3);
  const confidenceLabel = (c) => c === "high" ? "התאמה גבוהה" : c === "medium" ? "התאמה בינונית" : "התאמה נמוכה";

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-1)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>ארגונים מתאימים</div>
      <div className="muted tiny" style={{ marginBottom: 8 }}>התאמות מחושבות מהמאגר המקומי · ללא AI וללא מקור חיצוני</div>
      {!matches.length ? (
        <div className="muted" style={{ fontSize: 13 }}>לא נמצאו התאמות במאגר המקומי</div>
      ) : (
        <>
          <div className="col gap-6">
            {visible.map((m) => (
              <div key={m.id} className="flex center gap-10" onClick={() => onOpenCompany && onOpenCompany(m.organization.id)}
                   style={{ padding: 8, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8, cursor: "default" }}>
                <window.CoLogo company={m.organization} size={28} />
                <div className="col grow" style={{ minWidth: 0 }}>
                  <div className="flex center gap-6 wrap">
                    <span style={{ fontSize: 14, color: "var(--text-1)" }}>{m.organization.name}</span>
                    <span className="pill" style={{ fontSize: 10.5 }}>{window.orgTypeLabel ? window.orgTypeLabel(m.organization.organizationType) : ""}</span>
                  </div>
                  {!!m.reasons.length && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{m.reasons.join(" · ")}</div>}
                </div>
                <span className="pill" style={{ fontSize: 11 }}>{confidenceLabel(m.confidence)}</span>
              </div>
            ))}
          </div>
          {matches.length > 3 && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12.5 }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "הצג פחות" : `הצג עוד (${matches.length - 3})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Shared classification field-set used by both the create form and the
// inline edit form, so options/labels never drift apart.
function NeedClassificationFields({ form, setField, sortedCompanies }) {
  return (
    <>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סוג מקור</label>
        <select className="select" value={form.sourceType} onChange={(e) => setField("sourceType", e.target.value)}>
          {SOURCE_TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      {form.sourceType === "organization" && (
        <div className="field">
          <label style={{ fontSize: 14, fontWeight: 700 }}>ארגון</label>
          <select className="select" value={form.sourceOrganizationId || ""} onChange={(e) => setField("sourceOrganizationId", e.target.value)}>
            <option value="">בחרו ארגון…</option>
            {sortedCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סגמנט פעילות</label>
        <select className="select" value={form.spaceSegment} onChange={(e) => setField("spaceSegment", e.target.value)}>
          {SPACE_SEGMENT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סוג צורך</label>
        <select className="select" value={form.needType} onChange={(e) => setField("needType", e.target.value)}>
          {NEED_TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>עדיפות</label>
        <select className="select" value={form.priority} onChange={(e) => setField("priority", e.target.value)}>
          {PRIORITY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סטטוס</label>
        <select className="select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
          {NEED_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
    </>
  );
}

const EMPTY_FORM = { sourceType: "internal", title: "", description: "", sourceOrganizationId: "", spaceSegment: "other", needType: "other", priority: "medium", status: "new" };

function EditNeedForm({ item, sortedCompanies, onSave, onCancel }) {
  const [form, setForm] = React.useState(() => ({
    sourceType: item.sourceType,
    title: item.title,
    description: item.description || "",
    sourceOrganizationId: item.sourceOrgId || "",
    spaceSegment: item.spaceSegment || "other",
    needType: item.needType || "other",
    priority: item.priority || "medium",
    status: item.status || "new",
  }));
  const setField = (k, v) => setForm((prev) => Object.assign({}, prev, { [k]: v }));

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>מקור וסיווג</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
        <NeedClassificationFields form={form} setField={setField} sortedCompanies={sortedCompanies} />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>תיאור</div>
      <div className="field" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 700 }}>כותרת</label>
        <input className="input" value={form.title} onChange={(e) => setField("title", e.target.value)} />
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>תיאור (אופציונלי)</label>
        <input className="input" value={form.description} onChange={(e) => setField("description", e.target.value)} />
      </div>
      <div className="flex center gap-8" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" disabled={!form.title.trim()} onClick={() => onSave(form)}>
          <window.I.Check size={13} /> שמור שינויים
        </button>
        <button type="button" className="btn" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
}

function NeedsView({ onOpenCompany }) {
  const [companies, setCompanies] = React.useState(() => getLocalCompanies());
  const [adminNeeds, setAdminNeeds] = React.useState(() => getAdminNeeds());
  const [q, setQ] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(() => Object.assign({}, EMPTY_FORM));

  const refresh = () => {
    setCompanies(getLocalCompanies());
    setAdminNeeds(getAdminNeeds());
  };

  const sortedCompanies = React.useMemo(
    () => companies.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [companies]
  );

  const boardItems = React.useMemo(() => buildBoardItems(companies, adminNeeds), [companies, adminNeeds]);

  const filtered = boardItems.filter((item) => {
    if (sourceFilter !== "all" && item.kind !== sourceFilter) return false;
    if (q) {
      const hay = `${item.title} ${item.description} ${item.sourceOrgName || ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const setField = (k, v) => setForm((prev) => Object.assign({}, prev, { [k]: v }));
  const resetForm = () => setForm(Object.assign({}, EMPTY_FORM));

  const submitNeed = (e) => {
    e.preventDefault();
    const titleText = form.title.trim();
    if (!titleText) return;

    // Organization needs still go through the existing, less-risky path:
    // appended straight to organization.needs, exactly as before.
    if (form.sourceType === "organization") {
      if (!form.sourceOrganizationId) return;
      const target = companies.find((c) => c.id === form.sourceOrganizationId);
      if (!target) return;
      const nextNeeds = [...(target.needs || []), titleText];
      if (window.CompanyStore && typeof window.CompanyStore.updateCompany === "function") {
        window.CompanyStore.updateCompany(form.sourceOrganizationId, { needs: nextNeeds });
      }
      window.toast && window.toast(`הצורך נוסף ל-${target.name}`, "ok");
    } else {
      if (window.NeedsStore && typeof window.NeedsStore.createNeed === "function") {
        window.NeedsStore.createNeed({
          title: titleText,
          description: form.description.trim(),
          sourceType: form.sourceType,
          spaceSegment: form.spaceSegment,
          needType: form.needType,
          priority: form.priority,
          status: form.status,
        });
      }
      window.toast && window.toast(form.sourceType === "opportunity" ? "ההזדמנות נוספה ללוח" : "הצורך הפנימי נוסף ללוח", "ok");
    }

    resetForm();
    refresh();
  };

  const deleteAdminNeed = (id) => {
    if (window.NeedsStore && typeof window.NeedsStore.deleteNeed === "function") {
      window.NeedsStore.deleteNeed(id);
      refresh();
    }
  };

  const saveEdit = (id, editForm) => {
    if (window.NeedsStore && typeof window.NeedsStore.updateNeed === "function") {
      window.NeedsStore.updateNeed(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        sourceType: editForm.sourceType,
        sourceOrganizationId: editForm.sourceType === "organization" ? editForm.sourceOrganizationId : null,
        spaceSegment: editForm.spaceSegment,
        needType: editForm.needType,
        priority: editForm.priority,
        status: editForm.status,
      });
      window.toast && window.toast("השינויים נשמרו", "ok");
    }
    setEditingId(null);
    refresh();
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>לוח צרכים והזדמנויות</h2>
          <div className="sub">ניהול צרכים, אתגרים והזדמנויות מהמאגר המקומי · {boardItems.length} רשומות</div>
        </div>
      </div>

      {/* Create need/opportunity/challenge */}
      <form className="card" onSubmit={submitNeed}>
        <div className="card-hd"><div className="card-title"><span className="dot" /> יצירת צורך / הזדמנות / אתגר</div></div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>מקור</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700 }}>סוג מקור</label>
            <select className="select" value={form.sourceType} onChange={(e) => setField("sourceType", e.target.value)}>
              {SOURCE_TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          {form.sourceType === "organization" && (
            <div className="field">
              <label style={{ fontSize: 14, fontWeight: 700 }}>ארגון</label>
              <select className="select" value={form.sourceOrganizationId} onChange={(e) => setField("sourceOrganizationId", e.target.value)}>
                <option value="">בחרו ארגון…</option>
                {sortedCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {form.sourceType !== "organization" && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>סיווג</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סגמנט פעילות</label>
                <select className="select" value={form.spaceSegment} onChange={(e) => setField("spaceSegment", e.target.value)}>
                  {SPACE_SEGMENT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סוג צורך</label>
                <select className="select" value={form.needType} onChange={(e) => setField("needType", e.target.value)}>
                  {NEED_TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>ניהול</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>עדיפות</label>
                <select className="select" value={form.priority} onChange={(e) => setField("priority", e.target.value)}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סטטוס</label>
                <select className="select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                  {NEED_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>תיאור</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700 }}>{form.sourceType === "organization" ? "תיאור הצורך" : "כותרת"}</label>
            <input className="input" value={form.title} onChange={(e) => setField("title", e.target.value)}
                   placeholder={form.sourceType === "organization" ? "לדוגמה: שותף הפצה באירופה" : "לדוגמה: חיבור ללקוחות בתחום Earth Observation"} />
          </div>
          {form.sourceType !== "organization" && (
            <div className="field">
              <label style={{ fontSize: 14, fontWeight: 700 }}>תיאור (אופציונלי)</label>
              <input className="input" value={form.description} onChange={(e) => setField("description", e.target.value)}
                     placeholder="פרטים נוספים על הצורך, האתגר או ההזדמנות" />
            </div>
          )}
        </div>
        <div className="flex center gap-8" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-primary" disabled={!form.title.trim() || (form.sourceType === "organization" && !form.sourceOrganizationId)}>
            <window.I.Plus size={13} /> {form.sourceType === "organization" ? "הוסף צורך" : form.sourceType === "opportunity" ? "הוסף הזדמנות" : "הוסף צורך פנימי"}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div className="flex center gap-8 wrap">
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>מקור</span>
          <span className={"chip" + (sourceFilter === "all" ? " active" : "")} onClick={() => setSourceFilter("all")}>הכל</span>
          <span className={"chip" + (sourceFilter === "organization" ? " active" : "")} onClick={() => setSourceFilter("organization")}>צורך מארגון</span>
          <span className={"chip" + (sourceFilter === "admin" ? " active" : "")} onClick={() => setSourceFilter("admin")}>פנימי / הזדמנות</span>
          <div className="grow" />
          <div className="search" style={{ flex: "none", width: 260, padding: "5px 10px" }}>
            <window.I.Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש צורך, תיאור או ארגון…" />
          </div>
        </div>
      </div>

      {/* Board */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <window.I.Compass size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          {boardItems.length === 0 ? (
            <>
              <div style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 6 }}>אין עדיין צרכים או הזדמנויות במאגר המקומי</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>אפשר ליצור צורך פנימי, אתגר, הזדמנות שזוהתה או צורך של ארגון קיים.</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-3)" }}>לא נמצאו רשומות תואמות לסינון הנוכחי.</div>
          )}
        </div>
      ) : (
        <div className="col gap-8">
          {filtered.map((item) => {
            const co = item.sourceOrgId ? companies.find((c) => c.id === item.sourceOrgId) : null;
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className="card" style={{ padding: 14 }}>
                <div className="flex gap-12" style={{ alignItems: "flex-start" }}>
                  {co && <window.CoLogo company={co} size={36} />}
                  <div className="col grow" style={{ minWidth: 0, gap: 4 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div style={{ fontSize: 15, color: "var(--text-1)", lineHeight: 1.5, fontWeight: 600 }}>{item.title}</div>
                      {item.kind === "admin" && !isEditing && (
                        <div className="flex gap-4">
                          <button type="button" className="icon-btn" title="ערוך" onClick={() => setEditingId(item.id)}>
                            <window.I.Settings size={13} />
                          </button>
                          <button type="button" className="icon-btn" title="מחק רשומה" onClick={() => deleteAdminNeed(item.id)}>
                            <window.I.X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    {!!item.description && <div style={{ fontSize: 13.5, color: "var(--text-3)" }}>{item.description}</div>}
                    <div className="flex center gap-8 wrap" style={{ marginTop: 2 }}>
                      <span className="pill" style={{ fontSize: 11 }}>{item.sourceLabel}</span>
                      {co && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)", cursor: "default" }} onClick={() => onOpenCompany && onOpenCompany(co.id)}>
                          {co.name}
                        </span>
                      )}
                      {item.spaceSegment && <span className="pill" style={{ fontSize: 11 }}>{optLabel(SPACE_SEGMENT_OPTIONS, item.spaceSegment)}</span>}
                      {item.needType && <span className="pill" style={{ fontSize: 11 }}>{optLabel(NEED_TYPE_OPTIONS, item.needType)}</span>}
                      {item.priority && <span className="pill" style={{ fontSize: 11 }}>עדיפות {optLabel(PRIORITY_OPTIONS, item.priority)}</span>}
                      {item.status && <span className="pill" style={{ fontSize: 11 }}>{optLabel(NEED_STATUS_OPTIONS, item.status)}</span>}
                      {item.kind === "organization" && (
                        <span className="mono tiny" style={{ color: "var(--text-4)" }}>עריכה דרך פרופיל הארגון</span>
                      )}
                      <span className="mono tiny" style={{ color: "var(--text-4)" }}>מהמאגר המקומי</span>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <EditNeedForm
                    item={item}
                    sortedCompanies={sortedCompanies}
                    onSave={(editForm) => saveEdit(item.id, editForm)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <NeedMatches item={item} companies={companies} onOpenCompany={onOpenCompany} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NeedsView });
