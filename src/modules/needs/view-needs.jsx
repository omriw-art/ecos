// ecos — Needs & Opportunities Board (P16A, matching P16D, admin needs P16E)
// Two independent local sources feed one board:
//  1. organization.needs (string array on company records) — unchanged,
//     still the single source of truth for org-submitted needs, still
//     written through CompanyStore.updateCompany exactly as before.
//  2. NeedsStore (localStorage) — admin-created needs/opportunities that are
//     NOT tied to a specific organization ("internal" / "opportunity").
// The two never overlap: needs entered as "צורך של ארגון" are still saved
// straight into organization.needs (existing, less-risky path), never
// duplicated into NeedsStore. Matches are computed live via
// MatchEngine.rankOrganizationsForNeed — deterministic keyword overlap,
// no AI, no network.

const NEED_TYPE_LABELS = {
  pilot: "פיילוט", customer: "לקוח", funding: "מימון", technology: "טכנולוגיה",
  data: "דאטה", regulation: "רגולציה", partner: "שותף", research: "מחקר", other: "אחר",
};
const PRIORITY_LABELS = { high: "גבוהה", medium: "בינונית", low: "נמוכה" };
const STATUS_LABELS = { new: "חדש", reviewing: "בבדיקה", matching: "בהתאמה", "in-progress": "בטיפול" };

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
        sourceLabel: "צורך מארגון",
        sourceOrgId: c.id,
        sourceOrgName: c.name,
        organizationType: c.organizationType,
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
      sourceLabel: n.sourceType === "opportunity" ? "הזדמנות שזוהתה" : "צורך פנימי",
      sourceOrgId: n.sourceOrganizationId,
      sourceOrgName: null,
      organizationType: null,
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
      <div className="muted tiny" style={{ marginBottom: 8 }}>התאמות מחושבות מהמאגר המקומי · מבוסס על יכולות, תגיות והצעות · ללא AI וללא מקור חיצוני</div>
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
                    <span className="pill" style={{ fontSize: 10.5 }}>{window.spaceSegmentShortLabel ? window.spaceSegmentShortLabel(m.organization.spaceSegment) : ""}</span>
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

function NeedsView({ onOpenCompany }) {
  const [companies, setCompanies] = React.useState(() => getLocalCompanies());
  const [adminNeeds, setAdminNeeds] = React.useState(() => getAdminNeeds());
  const [q, setQ] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("all");

  const [sourceType, setSourceType] = React.useState("internal");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [addOrgId, setAddOrgId] = React.useState("");
  const [spaceSegment, setSpaceSegment] = React.useState("other");
  const [needType, setNeedType] = React.useState("other");
  const [priority, setPriority] = React.useState("medium");

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

  const resetForm = () => {
    setTitle(""); setDescription(""); setAddOrgId(""); setSpaceSegment("other"); setNeedType("other"); setPriority("medium");
  };

  const submitNeed = (e) => {
    e.preventDefault();
    const titleText = title.trim();
    if (!titleText) return;

    if (sourceType === "organization") {
      if (!addOrgId) return;
      const target = companies.find((c) => c.id === addOrgId);
      if (!target) return;
      const nextNeeds = [...(target.needs || []), titleText];
      if (window.CompanyStore && typeof window.CompanyStore.updateCompany === "function") {
        window.CompanyStore.updateCompany(addOrgId, { needs: nextNeeds });
      }
      window.toast && window.toast(`הצורך נוסף ל-${target.name}`, "ok");
    } else {
      if (window.NeedsStore && typeof window.NeedsStore.createNeed === "function") {
        window.NeedsStore.createNeed({
          title: titleText,
          description: description.trim(),
          sourceType,
          spaceSegment,
          needType,
          priority,
          status: "new",
        });
      }
      window.toast && window.toast(sourceType === "opportunity" ? "ההזדמנות נוספה ללוח" : "הצורך הפנימי נוסף ללוח", "ok");
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

  const updateAdminNeedStatus = (id, status) => {
    if (window.NeedsStore && typeof window.NeedsStore.updateNeed === "function") {
      window.NeedsStore.updateNeed(id, { status });
      refresh();
    }
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>לוח צרכים והזדמנויות</h2>
          <div className="sub">{boardItems.length} רשומות · מהמאגר המקומי</div>
        </div>
      </div>

      {/* Add need/opportunity */}
      <form className="card" onSubmit={submitNeed}>
        <div className="card-hd"><div className="card-title"><span className="dot" /> הוספת צורך או הזדמנות</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700 }}>סוג מקור</label>
            <select className="select" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="internal">צורך פנימי</option>
              <option value="organization">צורך של ארגון</option>
              <option value="opportunity">הזדמנות שזוהתה</option>
            </select>
          </div>
          {sourceType === "organization" && (
            <div className="field">
              <label style={{ fontSize: 14, fontWeight: 700 }}>ארגון</label>
              <select className="select" value={addOrgId} onChange={(e) => setAddOrgId(e.target.value)}>
                <option value="">בחרו ארגון…</option>
                {sortedCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {sourceType !== "organization" && (
            <>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סגמנט פעילות</label>
                <select className="select" value={spaceSegment} onChange={(e) => setSpaceSegment(e.target.value)}>
                  {(window.SPACE_SEGMENTS || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>סוג צורך</label>
                <select className="select" value={needType} onChange={(e) => setNeedType(e.target.value)}>
                  {(window.NeedsStore ? window.NeedsStore.NEED_TYPES : []).map((t) => <option key={t} value={t}>{NEED_TYPE_LABELS[t] || t}</option>)}
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 14, fontWeight: 700 }}>עדיפות</label>
                <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {(window.NeedsStore ? window.NeedsStore.PRIORITIES : []).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p] || p}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700 }}>{sourceType === "organization" ? "תיאור הצורך" : "כותרת"}</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
                   placeholder={sourceType === "organization" ? "לדוגמה: שותף הפצה באירופה" : "לדוגמה: חיבור ללקוחות בתחום Earth Observation"} />
          </div>
          {sourceType !== "organization" && (
            <div className="field">
              <label style={{ fontSize: 14, fontWeight: 700 }}>תיאור (אופציונלי)</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)}
                     placeholder="פרטים נוספים על הצורך או ההזדמנות" />
            </div>
          )}
        </div>
        <div className="flex center gap-8" style={{ marginTop: 14 }}>
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || (sourceType === "organization" && !addOrgId)}>
            <window.I.Plus size={13} /> {sourceType === "organization" ? "הוסף צורך" : sourceType === "opportunity" ? "הוסף הזדמנות" : "הוסף צורך פנימי"}
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
              <div style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 6 }}>אין עדיין צרכים במאגר המקומי</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>אפשר להוסיף צורך פנימי, הזדמנות שזוהתה, או צורך של ארגון קיים.</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-3)" }}>לא נמצאו רשומות תואמות לסינון הנוכחי.</div>
          )}
        </div>
      ) : (
        <div className="col gap-8">
          {filtered.map((item) => {
            const co = item.sourceOrgId ? companies.find((c) => c.id === item.sourceOrgId) : null;
            return (
              <div key={item.id} className="card" style={{ padding: 14 }}>
                <div className="flex gap-12" style={{ alignItems: "flex-start" }}>
                  {co && <window.CoLogo company={co} size={36} />}
                  <div className="col grow" style={{ minWidth: 0, gap: 4 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div style={{ fontSize: 15, color: "var(--text-1)", lineHeight: 1.5, fontWeight: 600 }}>{item.title}</div>
                      {item.kind === "admin" && (
                        <button className="icon-btn" title="מחק רשומה" onClick={() => deleteAdminNeed(item.id)}>
                          <window.I.X size={13} />
                        </button>
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
                      {item.spaceSegment && <span className="pill" style={{ fontSize: 11 }}>{window.spaceSegmentShortLabel ? window.spaceSegmentShortLabel(item.spaceSegment) : item.spaceSegment}</span>}
                      {item.needType && <span className="pill" style={{ fontSize: 11 }}>{NEED_TYPE_LABELS[item.needType] || item.needType}</span>}
                      {item.priority && <span className="pill" style={{ fontSize: 11 }}>עדיפות {PRIORITY_LABELS[item.priority] || item.priority}</span>}
                      {item.kind === "admin" ? (
                        <select className="select" style={{ fontSize: 11, padding: "2px 6px", minHeight: "auto" }}
                                value={item.status || "new"} onChange={(e) => updateAdminNeedStatus(item.id, e.target.value)}>
                          {(window.NeedsStore ? window.NeedsStore.STATUSES : []).map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                        </select>
                      ) : null}
                      <span className="mono tiny" style={{ color: "var(--text-4)" }}>מהמאגר המקומי</span>
                    </div>
                  </div>
                </div>
                <NeedMatches item={item} companies={companies} onOpenCompany={onOpenCompany} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NeedsView });
