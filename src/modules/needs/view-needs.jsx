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

// Source type stays fixed — it drives real save-path branching (organization
// needs still write to organization.needs), not just a display label.
const SOURCE_TYPE_OPTIONS = [
  { id: "internal", label: "צורך פנימי" },
  { id: "organization", label: "צורך של ארגון" },
  { id: "opportunity", label: "הזדמנות שזוהתה" },
];

// spaceSegment / needType / priority / status are admin-editable via
// TaxonomyStore (localStorage). These small helpers read it fresh each call
// so renames/additions/deactivations show up immediately everywhere.
const TAXONOMY_GROUPS = [
  { key: "spaceSegment", title: "סגמנט פעילות" },
  { key: "needType", title: "סוג צורך" },
  { key: "priority", title: "עדיפות" },
  { key: "status", title: "סטטוס" },
];

function optLabel(options, id, fallback) {
  const found = options.find((o) => o.id === id);
  return found ? found.label : (fallback || id || "אחר");
}

function taxGroup(groupKey) {
  return window.TaxonomyStore ? window.TaxonomyStore.getGroup(groupKey) : [];
}
function taxActive(groupKey, currentValue) {
  return window.TaxonomyStore ? window.TaxonomyStore.getActiveGroup(groupKey, currentValue) : [];
}
function taxLabel(groupKey, value) {
  return window.TaxonomyStore ? window.TaxonomyStore.labelFor(groupKey, value) : (value || "אחר");
}

// Display-only Hebrew labels for company.readiness's raw English values
// (the stored value stays untouched — matching logic compares raw values).
const READINESS_LABEL_HE = {
  "Initial contact": "קשר ראשוני",
  "Mapped": "ממופה",
  "Verified": "מאומת",
  "Active": "פעיל",
  "Strategic": "אסטרטגי",
  "Needs update": "דורש עדכון",
};
const PRIORITY_DOT = { high: "var(--rose)", medium: "var(--amber)", low: "var(--green)" };

function unique(items) {
  return Array.from(new Set(items));
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
    // Content-derived, not positional — shared with NeedsStore.listNeeds()
    // via organizationNeedId() so the Needs Board and the dashboard's need
    // count never disagree about a given need's id.
    const usedIds = new Set();
    (c.needs || []).forEach((rawNeed, idx) => {
      const t = needText(rawNeed).trim();
      if (!t) return;
      const id = (window.NeedsStore && typeof window.NeedsStore.organizationNeedId === "function")
        ? window.NeedsStore.organizationNeedId(c.id, t, usedIds)
        : `${c.id}::${idx}`;
      items.push({
        id,
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

const STRONG_MATCH_MIN_SCORE = 70;

function NeedMatches({ matches, onOpenCompany }) {
  const [showAll, setShowAll] = React.useState(false);
  const [strongOnly, setStrongOnly] = React.useState(false);
  const confidenceLabel = (c) => c === "high" ? "התאמה גבוהה" : c === "medium" ? "התאמה בינונית" : "התאמה נמוכה";

  const strongCount = matches.filter((m) => m.score >= STRONG_MATCH_MIN_SCORE).length;
  const scoped = strongOnly ? matches.filter((m) => m.score >= STRONG_MATCH_MIN_SCORE) : matches;
  const visible = showAll ? scoped : scoped.slice(0, 3);
  const topKeywords = unique(matches.slice(0, 3).flatMap((m) => m.keywordOverlap || [])).slice(0, 6);

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-1)" }}>
      <div className="flex center between wrap" style={{ marginBottom: 4, gap: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ארגונים מתאימים</div>
        {!!strongCount && (
          <button type="button" className={"chip" + (strongOnly ? " active" : "")} style={{ fontSize: 11 }}
                  onClick={() => setStrongOnly((v) => !v)}>
            התאמות חזקות (ציון {STRONG_MATCH_MIN_SCORE}+) · {strongCount}
          </button>
        )}
      </div>
      <div className="muted tiny" style={{ marginBottom: 8 }}>התאמות מחושבות מהמאגר המקומי · ללא AI וללא מקור חיצוני</div>
      {!!topKeywords.length && (
        <div className="flex gap-6 wrap" style={{ marginBottom: 8 }}>
          <span className="mono tiny" style={{ color: "var(--text-4)" }}>מילות מפתח בהתאמות:</span>
          {topKeywords.map((k) => <span key={k} className="pill" style={{ fontSize: 10.5 }}>{k}</span>)}
        </div>
      )}
      {!scoped.length ? (
        <div className="muted" style={{ fontSize: 13 }}>
          {matches.length ? "אין התאמות בעלות ציון חזק כזה — נסו לבטל את הסינון" : "לא נמצאו התאמות במאגר המקומי"}
        </div>
      ) : (
        <>
          <div className="col gap-6">
            {visible.map((m, i) => (
              <div key={m.id} className="flex center gap-10" onClick={() => onOpenCompany && onOpenCompany(m.organization.id)}
                   style={{ padding: 8, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8, cursor: "default" }}>
                <window.CoLogo company={m.organization} size={28} />
                <div className="col grow" style={{ minWidth: 0 }}>
                  <div className="flex center gap-6 wrap">
                    <span style={{ fontSize: 14, color: "var(--text-1)" }}>{m.organization.name}</span>
                    {i === 0 && !showAll && !strongOnly && <span className="pill blue" style={{ fontSize: 10 }}>התאמה מובילה</span>}
                    <span className="pill" style={{ fontSize: 10.5 }}>{window.orgTypeLabel ? window.orgTypeLabel(m.organization.organizationType) : ""}</span>
                    {m.organization.readiness && (
                      <span className="pill" style={{ fontSize: 10.5 }}>מוכנות: {READINESS_LABEL_HE[m.organization.readiness] || m.organization.readiness}</span>
                    )}
                  </div>
                  {!!m.reasons.length && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{m.reasons.join(" · ")}</div>}
                </div>
                <span className="mono tabnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)", flex: "none" }}>{m.score}%</span>
                <span className="pill" style={{ fontSize: 11, flex: "none" }}>{confidenceLabel(m.confidence)}</span>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 9px", flex: "none" }}
                        onClick={(e) => { e.stopPropagation(); onOpenCompany && onOpenCompany(m.organization.id); }}>
                  <window.I.ArrowLeft size={11} /> פתח
                </button>
              </div>
            ))}
          </div>
          {scoped.length > 3 && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12.5 }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "הצג פחות" : `הצג עוד (${scoped.length - 3})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Shared classification field-set used by both the create form and the
// inline edit form, so options/labels never drift apart. Option lists come
// from TaxonomyStore (admin-editable) — each includes the form's current
// value even if it was since deactivated, so an existing selection is never
// silently lost.
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
          {taxActive("spaceSegment", form.spaceSegment).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סוג צורך</label>
        <select className="select" value={form.needType} onChange={(e) => setField("needType", e.target.value)}>
          {taxActive("needType", form.needType).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>עדיפות</label>
        <select className="select" value={form.priority} onChange={(e) => setField("priority", e.target.value)}>
          {taxActive("priority", form.priority).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label style={{ fontSize: 14, fontWeight: 700 }}>סטטוס</label>
        <select className="select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
          {taxActive("status", form.status).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

// Local admin-editable option row: rename commits on blur (not every
// keystroke) to avoid writing to localStorage on every character.
function OptionRow({ option, onRename, onToggle }) {
  const [draftLabel, setDraftLabel] = React.useState(option.label);
  React.useEffect(() => setDraftLabel(option.label), [option.label]);

  return (
    <div className="flex center gap-8" style={{ opacity: option.isActive ? 1 : 0.5 }}>
      <input
        className="input"
        style={{ fontSize: 13, padding: "6px 10px" }}
        value={draftLabel}
        title="שינוי שם נשמר בעת יציאה מהשדה או Enter"
        onChange={(e) => setDraftLabel(e.target.value)}
        onBlur={() => { if (draftLabel.trim() && draftLabel !== option.label) onRename(option.value, draftLabel.trim()); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } }}
      />
      <button type="button" className={"chip" + (option.isActive ? " active" : "")} style={{ fontSize: 11, flex: "none" }}
              onClick={() => onToggle(option.value, !option.isActive)}>
        {option.isActive ? "פעיל" : "לא פעיל"}
      </button>
      {option.isDefault && <span className="mono tiny" style={{ color: "var(--text-4)", flex: "none" }}>ברירת מחדל</span>}
    </div>
  );
}

function OptionsGroupEditor({ groupKey, title, options, onAdd, onRename, onToggle, onReset }) {
  const [draft, setDraft] = React.useState("");
  const submitDraft = () => {
    const label = draft.trim();
    if (!label) return;
    onAdd(groupKey, label);
    setDraft("");
  };
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex center between" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{title}</div>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => onReset(groupKey)}>איפוס לברירת מחדל</button>
      </div>
      <div className="col gap-6" style={{ marginBottom: 10 }}>
        {options.map((o) => (
          <OptionRow key={o.value} option={o}
                     onRename={(value, label) => onRename(groupKey, value, label)}
                     onToggle={(value, isActive) => onToggle(groupKey, value, isActive)} />
        ))}
      </div>
      <div className="flex gap-8">
        <input className="input" style={{ fontSize: 13 }} value={draft} onChange={(e) => setDraft(e.target.value)}
               placeholder="הוספת אפשרות חדשה…"
               onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitDraft(); } }} />
        <button type="button" className="btn" onClick={submitDraft} disabled={!draft.trim()}>הוסף</button>
      </div>
    </div>
  );
}

function OptionsManagerPanel({ open, onToggleOpen, groups, onAdd, onRename, onToggleOption, onReset }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot" /> ניהול אפשרויות</div>
        <button type="button" className="btn btn-ghost" onClick={onToggleOpen}>{open ? "הסתר" : "הצג"}</button>
      </div>
      {open && (
        <>
          <div className="muted tiny" style={{ marginBottom: 10 }}>
            עריכת רשימות האפשרויות של סגמנט פעילות, סוג צורך, עדיפות וסטטוס עבור לוח הצרכים. סוג מקור קבוע ואינו ניתן לעריכה. לשינוי שם — ערכו את השדה ולחצו Enter או עברו הלאה.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {TAXONOMY_GROUPS.map((g) => (
              <OptionsGroupEditor key={g.key} groupKey={g.key} title={g.title} options={groups[g.key] || []}
                                   onAdd={onAdd} onRename={onRename} onToggle={onToggleOption} onReset={onReset} />
            ))}
          </div>
        </>
      )}
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
  const [showOptionsManager, setShowOptionsManager] = React.useState(false);
  const [taxonomyTick, setTaxonomyTick] = React.useState(0);

  const refresh = () => {
    setCompanies(getLocalCompanies());
    setAdminNeeds(getAdminNeeds());
  };

  const taxonomyGroups = React.useMemo(() => ({
    spaceSegment: taxGroup("spaceSegment"),
    needType: taxGroup("needType"),
    priority: taxGroup("priority"),
    status: taxGroup("status"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [taxonomyTick]);

  const handleAddOption = (groupKey, label) => {
    if (window.TaxonomyStore) window.TaxonomyStore.addOption(groupKey, label);
    setTaxonomyTick((t) => t + 1);
  };
  const handleRenameOption = (groupKey, value, label) => {
    if (window.TaxonomyStore) window.TaxonomyStore.updateOption(groupKey, value, { label });
    setTaxonomyTick((t) => t + 1);
  };
  const handleToggleOption = (groupKey, value, isActive) => {
    if (window.TaxonomyStore) window.TaxonomyStore.toggleOption(groupKey, value, isActive);
    setTaxonomyTick((t) => t + 1);
  };
  const handleResetGroup = (groupKey) => {
    if (window.TaxonomyStore) window.TaxonomyStore.resetGroup(groupKey);
    setTaxonomyTick((t) => t + 1);
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

      <OptionsManagerPanel
        open={showOptionsManager}
        onToggleOpen={() => setShowOptionsManager((v) => !v)}
        groups={taxonomyGroups}
        onAdd={handleAddOption}
        onRename={handleRenameOption}
        onToggleOption={handleToggleOption}
        onReset={handleResetGroup}
      />

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
                  {taxActive("spaceSegment", form.spaceSegment).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סוג צורך</label>
                <select className="select" value={form.needType} onChange={(e) => setField("needType", e.target.value)}>
                  {taxActive("needType", form.needType).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>ניהול</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>עדיפות</label>
                <select className="select" value={form.priority} onChange={(e) => setField("priority", e.target.value)}>
                  {taxActive("priority", form.priority).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סטטוס</label>
                <select className="select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                  {taxActive("status", form.status).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            const matches = window.MatchEngine && typeof window.MatchEngine.rankOrganizationsForNeed === "function"
              ? window.MatchEngine.rankOrganizationsForNeed(item.matchText, companies, { limit: 8, minScore: 15, excludeId: item.excludeId })
              : [];
            return (
              <div key={item.id} className="card" style={{ padding: 14 }}>
                <div className="flex gap-12" style={{ alignItems: "flex-start" }}>
                  {co && <window.CoLogo company={co} size={36} />}
                  <div className="col grow" style={{ minWidth: 0, gap: 4 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div className="flex center gap-8">
                        {item.priority && <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_DOT[item.priority] || "var(--text-4)", flex: "none" }} title={`עדיפות ${taxLabel("priority", item.priority)}`} />}
                        <div style={{ fontSize: 16, color: "var(--text-1)", lineHeight: 1.4, fontWeight: 700 }}>{item.title}</div>
                      </div>
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
                      {item.spaceSegment && <span className="pill" style={{ fontSize: 11 }}>{taxLabel("spaceSegment", item.spaceSegment)}</span>}
                      {item.needType && <span className="pill" style={{ fontSize: 11 }}>{taxLabel("needType", item.needType)}</span>}
                      {item.priority && <span className="pill" style={{ fontSize: 11 }}>עדיפות {taxLabel("priority", item.priority)}</span>}
                      {item.status && <span className="pill" style={{ fontSize: 11 }}>{taxLabel("status", item.status)}</span>}
                      <span className={"pill" + (matches.length ? " blue" : "")} style={{ fontSize: 11 }}>
                        {matches.length ? `${matches.length} התאמות` : "אין התאמות עדיין"}
                      </span>
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
                  <NeedMatches matches={matches} onOpenCompany={onOpenCompany} />
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
