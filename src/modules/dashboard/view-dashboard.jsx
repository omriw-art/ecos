// ecos — Dashboard (לוח ניהול אקו־סיסטם)
// Answers: what needs attention, what opportunities are active, and where ecosystem gaps exist.

function Dashboard({ onOpenCompany, onNav, onChangePerspective }) {
  const COMPANIES = asArray(window.COMPANIES);
  const OPPORTUNITIES = asArray(window.OPPORTUNITIES);
  const rawSubmissions = window.SubmissionStore ? window.SubmissionStore.getSubmissions() : [];
  const recentActivity = rawSubmissions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      tag: s.status === "approved" ? "opp" : s.status === "rejected" ? "reject" : "flag",
      who: "System",
      what: s.status === "approved" ? "אושרה והוספה לאקוסיסטם:" :
            s.status === "rejected" ? "נדחתה:" : "הוגשה לבדיקה:",
      to: s.companyName || s.name || "חברה",
      t: s.createdAt ? new Date(s.createdAt).toLocaleDateString("he-IL") : "",
    }));
  const SECTOR_DIST = asArray(window.SECTOR_DIST);
  const FUNNEL = asArray(window.FUNNEL);
  const READINESS = asArray(window.READINESS);

  const activeCompanies = COMPANIES.filter((c) => ["Active", "Strategic"].includes(c.readiness));
  const strategicCompanies = COMPANIES.filter((c) => c.strategic === true);
  const companiesWithNeeds = COMPANIES.filter((c) => hasItems(c.needs));
  const companiesWithTech = COMPANIES.filter((c) => hasItems(c.tech));
  const companiesWithReadiness = COMPANIES.filter((c) => text(c.readiness));
  const allNeeds = collectCompanyItems(COMPANIES, "needs");
  const openOpportunities = OPPORTUNITIES.filter((o) => !["expired", "closed", "archived"].includes(norm(o.status)));
  // Action Queue / "ממתין לאישור" reflect only real local join submissions —
  // the static REVIEW_QUEUE seed data is not surfaced here or in
  // CopilotSuggestions so it can't be mistaken for live admin activity.
  const pendingReviews = rawSubmissions
    .filter((s) => s.status === "pending")
    .map((s) => ({
      id: s.id,
      type: "New Company Submission",
      title: `הגשת חברה חדשה: ${s.companyName || s.name || "חברה"}`,
      objectType: "company",
      objectName: s.companyName || s.name,
      priority: "Medium",
      status: "Pending Review",
      recommendedAction: "בדוק פרטים ואשר או דחה בעמוד ה-Onboarding",
    }));
  const opportunityCounts = getOpportunityCounts(OPPORTUNITIES);
  const needThemes = getNeedThemes(allNeeds);
  const capabilityThemes = getCapabilityCoverage(COMPANIES);
  const copilotSuggestions = getCopilotSuggestions({ OPPORTUNITIES, COMPANIES, allNeeds });

  // Real local needs/opportunities — organization.needs + NeedsStore admin
  // needs, combined. No invented data: both sources already exist and are
  // written through their own stores (CompanyStore / NeedsStore).
  const needsList = window.NeedsStore ? window.NeedsStore.listNeeds() : [];
  const needStats = window.NeedsStore ? window.NeedsStore.getNeedStats() : { openTotal: 0, highPriority: 0, opportunities: 0, inProgress: 0 };
  const needQueueItems = needsList
    .filter((n) => n.kind === "admin" && n.status !== "done" && (n.priority === "high" || n.status === "reviewing" || n.status === "matching"))
    .map((n) => ({
      id: n.id,
      type: n.sourceLabel,
      title: n.title,
      objectType: "need",
      objectName: n.sourceOrgName || "לוח צרכים",
      priority: n.priority === "high" ? "High" : n.priority === "medium" ? "Medium" : "Low",
      status: NEED_STATUS_LABEL_HE[n.status] || "בטיפול",
      recommendedAction: "בדוק בלוח הצרכים ועדכן סטטוס",
    }));
  const combinedQueue = [...pendingReviews, ...needQueueItems];

  const [importPreview, setImportPreview] = React.useState(null);
  const importInputRef = React.useRef(null);
  const [hasResetBackup, setHasResetBackup] = React.useState(() => window.DemoDataService.hasBackup());

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      window.toast && window.toast("ייבוא Excel: ייצא את הקובץ כ-CSV UTF-8 ואז ייבא את קובץ ה-CSV.", "err");
      return;
    }
    if (file.size > window.ImportExportService.MAX_IMPORT_FILE_SIZE_BYTES) {
      window.toast && window.toast("הקובץ גדול מדי לייבוא", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ext === "csv") {
        try {
          const companies = window.ImportExportService.parseCSVCompanies(ev.target.result);
          if (!companies.length) {
            window.toast && window.toast("לא נמצאו חברות תקינות בקובץ ה-CSV", "err");
            return;
          }
          setImportPreview({ importType: "external-csv", exportedAt: null, companies, submissions: [], fileName: file.name });
        } catch (err) {
          window.toast && window.toast("שגיאת קריאת CSV — " + (err.message || err), "err");
        }
      } else {
        const result = window.ImportExportService.parseJSONImport(ev.target.result);
        if (!result.ok) {
          window.toast && window.toast(result.error, "err");
          return;
        }
        setImportPreview({
          importType: result.importType,
          exportedAt: result.exportedAt,
          companies: result.companies,
          submissions: result.submissions,
          fileName: file.name,
        });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const result = window.ImportExportService.applyImport(importPreview.companies, importPreview.submissions);
    if (result.ok) {
      window.toast && window.toast(
        `ייבוא הושלם — ${importPreview.companies.length} חברות, ${importPreview.submissions.length} הגשות · טוען מחדש…`,
        "ok"
      );
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setImportPreview(null);
      window.toast && window.toast("ייבוא נכשל — הנתונים שוחזרו. " + result.error, "err");
    }
  };

  const exportLocalData = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const payload = window.ImportExportService.buildExportPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecosystem-os-export-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.toast && window.toast(`הורדה מקומית הושלמה — ${payload.companies.length} חברות, ${payload.submissions.length} הגשות`, "ok");
    } catch (err) {
      window.toast && window.toast("ייצוא נכשל — " + (err.message || err), "err");
    }
  };

  const downloadCSVTemplate = () => {
    const csv = window.ImportExportService.buildCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecosystem-os-companies-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetLocalData = () => {
    if (!window.confirm(
      "איפוס לנתוני ברירת מחדל?\n\n" +
      "פעולה זו תמחק את כל השינויים המקומיים ותשחזר את חברות ה-seed המקוריות. כל הייבואים, ההגשות, הצרכים/ההזדמנויות ואפשרויות הסיווג המותאמות יימחקו.\n\n" +
      "מומלץ לבצע הורדה מקומית לפני האיפוס. המצב הנוכחי יישמר אוטומטית כגיבוי מקומי אחד שניתן לשחזר מהכפתור \"שחזר גיבוי אחרון\"."
    )) return;
    try {
      window.DemoDataService.resetToSeed();
      setHasResetBackup(true);
      window.toast && window.toast("איפוס הושלם — גיבוי מקומי נשמר, ניתן לשחזר מהכפתור \"שחזר גיבוי אחרון\" · טוען מחדש…", "ok");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      window.toast && window.toast("איפוס נכשל — " + (err.message || err), "err");
    }
  };

  const restoreLastBackup = () => {
    if (!window.DemoDataService.hasBackup()) {
      window.toast && window.toast("לא נמצא גיבוי מקומי לשחזור", "err");
      return;
    }
    if (!window.confirm("שחזור הגיבוי האחרון ידרוס את הנתונים המקומיים הנוכחיים. להמשיך?")) return;
    try {
      window.DemoDataService.restoreBackup();
      window.toast && window.toast("הגיבוי האחרון שוחזר · טוען מחדש…", "ok");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      window.toast && window.toast("שחזור נכשל — " + (err.message || err), "err");
    }
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>לוח ניהול אקו־סיסטם</h2>
          <div className="sub">
            מיפוי ארגונים (חברות, משקיעים, עמותות, אקדמיה ועוד), יכולות, צרכים והזדמנויות — דמו מקומי
          </div>
        </div>
        <div className="ops">
          <window.EnvBadge title="נתונים מקומיים · לא מחובר לשרת" />
          <input type="file" accept=".json,.csv,.xlsx,.xls,application/json,text/csv" ref={importInputRef} style={{ display: "none" }} onChange={handleImportFile} />
          <button className="btn" onClick={exportLocalData} title="הורדה מקומית — JSON עם כל הנתונים המקומיים">
            <window.I.Upload size={13} /> הורדה מקומית
          </button>
          <button className="btn" onClick={downloadCSVTemplate} title="ערכו באקסל ושמרו כ-CSV UTF-8 לפני ייבוא">
            <window.I.Download size={13} /> תבנית CSV
          </button>
          <button className="btn" onClick={() => importInputRef.current && importInputRef.current.click()} title="ייבוא מקומי — שחזור מקובץ JSON">
            <window.I.Download size={13} /> ייבוא מקומי
          </button>
          {(window.EcosFlags && window.EcosFlags.demoReset) && (
            <>
              <button className="btn" onClick={resetLocalData} title="מוחק שינויים מקומיים ומשחזר את נתוני ה-seed המקוריים">
                <window.I.Bolt size={13} /> איפוס לדאטה התחלתי
              </button>
              {hasResetBackup && (
                <button className="btn" onClick={restoreLastBackup} title="משחזר ארגונים, הגשות, צרכים/הזדמנויות ואפשרויות סיווג מהגיבוי המקומי האחרון שנשמר לפני האיפוס">
                  <window.I.Download size={13} /> שחזר גיבוי אחרון
                </button>
              )}
            </>
          )}
          <button className="btn" onClick={() => onNav("needs")} title="פתיחת לוח הצרכים להוספת צורך חדש">
            <window.I.Plus size={13} /> הוסף צורך
          </button>
          <button className="btn btn-primary" onClick={() => onNav("onboard")}>
            <window.I.Plus size={13} /> הוסף ארגון
          </button>
        </div>
      </div>

      {window.DemoFlowStrip && <window.DemoFlowStrip active="admin" />}

      {/* Showcase Landing Polish v1 (builds on Perspective Demo Script v1) —
          internal presenter's guide for walking the multi-perspective
          opportunity loop. Demo-only, local, non-auth; not an end-user
          feature, just a script + orientation for whoever runs the demo. */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> מסלול הדמו · לולאת הזדמנויות</div></div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>מדריך פנימי להצגת הדמו · תצוגת דמו מקומית בלבד · לא כניסת משתמש</div>
        <div className="flex gap-6 wrap" style={{ marginBottom: 12 }}>
          <span className="pill">גוף מנהל · ניהול מלא</span>
          <span className="pill">חברה · רואה הזדמנויות</span>
          <span className="pill">שותף · מפרסם הזדמנויות</span>
        </div>
        <ol style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: "var(--text-2)" }}>
          <li>עברו לתצוגת שותף ופרסמו הזדמנות</li>
          <li>עברו לתצוגת חברה וסמנו עניין</li>
          <li>חזרו לתצוגת שותף וראו signal מצטבר</li>
          <li>גוף מנהל רואה את כלל הצרכים וההזדמנויות</li>
        </ol>
        {onChangePerspective && window.EcosFlags && window.EcosFlags.perspectiveSwitcher && (
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => onChangePerspective("partner")}>
            <window.I.Rocket size={13} /> התחילו בתצוגת שותף
          </button>
        )}
      </div>

      {importPreview && (
        <div className="card" style={{ border: "1px solid oklch(0.55 0.15 80)", background: "oklch(0.14 0.04 80 / 0.35)" }}>
          <div className="card-hd">
            <div className="card-title"><span className="dot amber" /> אישור שחזור מקומי</div>
            <button className="icon-btn" onClick={() => setImportPreview(null)}><window.I.X size={14} /></button>
          </div>
          <div className="col gap-6" style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
            <div><span className="mono tiny" style={{ color: "var(--text-3)" }}>קובץ: </span>{importPreview.fileName}</div>
            <div>
              <span className="mono tiny" style={{ color: "var(--text-3)" }}>סוג: </span>
              <span className="pill">
                {importPreview.importType === "ecosystem-os" ? "Ecosystem OS Export"
                  : importPreview.importType === "external-csv" ? "External CSV"
                  : "External JSON"}
              </span>
            </div>
            {importPreview.exportedAt && (
              <div><span className="mono tiny" style={{ color: "var(--text-3)" }}>יוצא בתאריך: </span>
                {new Date(importPreview.exportedAt).toLocaleString("he-IL")}</div>
            )}
            <div><span className="mono tiny" style={{ color: "var(--text-3)" }}>חברות: </span>
              <strong>{importPreview.companies.length}</strong></div>
            <div><span className="mono tiny" style={{ color: "var(--text-3)" }}>הגשות: </span>
              <strong>{importPreview.submissions.length}</strong></div>
          </div>
          <div className="muted tiny" style={{ marginBottom: 12 }}>
            פעולה זו תחליף את כל הנתונים המקומיים הקיימים. הדף יטען מחדש לאחר הייבוא.
          </div>
          <div className="flex gap-8 center">
            <button className="btn btn-primary" onClick={confirmImport}><window.I.Check size={13} /> אשר שחזור</button>
            <button className="btn btn-ghost" onClick={() => setImportPreview(null)}>ביטול</button>
          </div>
        </div>
      )}

      <StrategicBar
        companies={COMPANIES}
        activeCompanies={activeCompanies}
        strategicCompanies={strategicCompanies}
        openOpportunities={openOpportunities}
        openNeedsTotal={needStats.openTotal}
        pendingReviews={pendingReviews}
        onNav={onNav}
      />

      <div style={grid("1fr 1.2fr", 14)}>
        <EcosystemHealth
          companies={COMPANIES}
          companiesWithReadiness={companiesWithReadiness}
          companiesWithNeeds={companiesWithNeeds}
          companiesWithTech={companiesWithTech}
          strategicCompanies={strategicCompanies}
          readiness={READINESS}
          funnel={FUNNEL}
        />
        <ActionQueue items={combinedQueue} />
      </div>

      <NeedsOpportunitiesPanel needsList={needsList} needStats={needStats} onNav={onNav} onOpenCompany={onOpenCompany} />

      <div style={grid("1fr 1fr", 14)}>
        <OpportunitiesRadar opportunities={OPPORTUNITIES} counts={opportunityCounts} />
        <NeedsRadar needs={allNeeds} themes={needThemes} companiesWithNeeds={companiesWithNeeds} />
      </div>

      <div style={grid("1fr 1fr", 14)}>
        <StrategicCompanies companies={strategicCompanies} onOpenCompany={onOpenCompany} />
        <CapabilityGaps themes={capabilityThemes} sectorDist={SECTOR_DIST} />
      </div>

      <div style={grid("1fr 1fr", 14)}>
        <RecentActivity activity={recentActivity} />
        <CopilotSuggestions suggestions={copilotSuggestions} />
      </div>
    </div>
  );
}

function StrategicBar({ companies, activeCompanies, strategicCompanies, openOpportunities, openNeedsTotal, pendingReviews, onNav }) {
  return (
    <div className="kpi-grid">
      <Kpi label="סך ארגונים" value={companies.length} trend="כל הרשומות במאגר המקומי" accent="oklch(0.7 0.18 250 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="ארגונים פעילים" value={activeCompanies.length} trend="ארגונים שסומנו כפעילים או אסטרטגיים" accent="oklch(0.7 0.15 145 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="שחקנים אסטרטגיים" value={strategicCompanies.length} trend="דורשים בדיקה או החלטה" accent="oklch(0.78 0.15 80 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="הזדמנויות פתוחות" value={openOpportunities.length} trend="פעילות, בבדיקה או בסגירה" accent="oklch(0.7 0.18 295 / 0.18)" />
      <Kpi label="צרכים פתוחים" value={openNeedsTotal} trend="צרכים מארגונים + צרכים פנימיים והזדמנויות" accent="oklch(0.65 0.20 200 / 0.18)" onClick={() => onNav("needs")} />
      <Kpi label="ממתין לאישור" value={pendingReviews.length} trend="הגשות שממתינות לאישור ידני" accent="oklch(0.72 0.20 30 / 0.18)" />
    </div>
  );
}

// Display-only Hebrew labels for the readiness field's raw English values
// (c.readiness in data.js stays untouched — matching logic compares raw values).
const READINESS_LABEL_HE = {
  "Initial contact": "קשר ראשוני",
  "Mapped": "ממופה",
  "Verified": "מאומת",
  "Active": "פעיל",
  "Strategic": "אסטרטגי",
  "Needs update": "דורש עדכון",
};

function EcosystemHealth({ companies, companiesWithReadiness, companiesWithNeeds, companiesWithTech, strategicCompanies, readiness, funnel }) {
  const readinessRows = getReadinessDistribution(companies, readiness);
  const completeness = Math.round(((companiesWithReadiness.length + companiesWithNeeds.length + companiesWithTech.length) / Math.max(companies.length * 3, 1)) * 100);
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot green" /> מצב האקו־סיסטם</div>
        <span className="pill">{completeness}% הושלם</span>
      </div>
      <div style={grid("repeat(5, 1fr)", 10)}>
        <Metric label="עם סטטוס" value={companiesWithReadiness.length} />
        <Metric label="חסר סטטוס" value={companies.length - companiesWithReadiness.length} tone="amber" />
        <Metric label="עם צרכים" value={companiesWithNeeds.length} />
        <Metric label="עם יכולות" value={companiesWithTech.length} />
        <Metric label="אסטרטגיות" value={strategicCompanies.length} tone="violet" />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {readinessRows.map((row) => <BarRow key={row.label} label={READINESS_LABEL_HE[row.label] || row.label} value={row.count} max={row.max} color={row.color} />)}
        {!readinessRows.length && <EmptyState text="אין נתוני מוכנות עדיין." />}
      </div>
      {!!funnel.length && (
        <div className="muted tiny" style={{ marginTop: 10 }}>
          נתוני משפך בסיסיים נשמרו: {funnel.map((f) => `${f.stage || "שלב"} ${f.n || 0}`).join(" · ")}
        </div>
      )}
    </div>
  );
}

function ActionQueue({ items }) {
  const sorted = items.slice().sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).slice(0, 5);
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot amber" /> פעולות נדרשות</div>
        <span className="pill amber">{items.length} ממתינות</span>
      </div>
      <div className="col gap-8">
        {sorted.map((item) => (
          <QueueRow key={item.id || item.title} item={item} />
        ))}
        {!sorted.length && <EmptyState text="אין כרגע פעולות שממתינות לטיפול" />}
      </div>
    </div>
  );
}

const NEED_STATUS_LABEL_HE = { new: "חדש", reviewing: "בבדיקה", matching: "בהתאמה", "in-progress": "בטיפול", done: "הושלם" };
const NEED_PRIORITY_LABEL_HE = { high: "גבוהה", medium: "בינונית", low: "נמוכה" };

function NeedsOpportunitiesPanel({ needsList, needStats, onNav, onOpenCompany }) {
  const latest = needsList
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot violet" /> צרכים והזדמנויות</div>
        <button className="btn btn-primary" onClick={() => onNav("needs")}>פתח בלוח צרכים</button>
      </div>
      <div className="muted tiny" style={{ marginBottom: 10 }}>נתונים מהמאגר המקומי · צרכי ארגונים + צרכים פנימיים והזדמנויות שזוהו</div>
      <div style={grid("repeat(4, 1fr)", 10)}>
        <Metric label="צרכים פתוחים" value={needStats.openTotal} />
        <Metric label="עדיפות גבוהה" value={needStats.highPriority} tone="amber" />
        <Metric label="הזדמנויות שזוהו" value={needStats.opportunities} tone="violet" />
        <Metric label="בהתאמה / בבדיקה / בטיפול" value={needStats.inProgress} />
      </div>
      <div className="divider" />
      {!latest.length ? (
        <div className="muted" style={{ padding: 16, border: "1px dashed var(--line-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ marginBottom: 10 }}>אין עדיין צרכים או הזדמנויות במאגר המקומי</div>
          <button className="btn" onClick={() => onNav("needs")}>הוסף צורך בלוח הצרכים</button>
        </div>
      ) : (
        <div className="col gap-8">
          {latest.map((n) => (
            <div key={n.id} className="flex center gap-10" style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
              <div className="col grow" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--text-1)" }}>{n.title}</div>
                <div className="flex center gap-6 wrap" style={{ marginTop: 2 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>{n.sourceLabel}</span>
                  {n.sourceOrgName && (
                    <span style={{ fontSize: 12, color: "var(--blue)", cursor: "default" }} onClick={() => onOpenCompany && n.sourceOrgId && onOpenCompany(n.sourceOrgId)}>
                      {n.sourceOrgName}
                    </span>
                  )}
                  {n.priority && <span className="pill" style={{ fontSize: 10.5 }}>עדיפות {NEED_PRIORITY_LABEL_HE[n.priority] || n.priority}</span>}
                  {n.status && <span className="pill" style={{ fontSize: 10.5 }}>{NEED_STATUS_LABEL_HE[n.status] || n.status}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunitiesRadar({ opportunities, counts }) {
  const top = opportunities.slice().sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).slice(0, 5);
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot violet" /> מכ״ם הזדמנויות</div>
        <span className="pill mono">{opportunities.length} במעקב</span>
      </div>
      <div style={grid("repeat(4, 1fr)", 10)}>
        <Metric label="פעילות" value={counts.active} />
        <Metric label="נסגרות בקרוב" value={counts.closingSoon} tone="amber" />
        <Metric label="בבדיקה / טיוטה" value={counts.review} tone="violet" />
        <Metric label="גלובלי" value={counts.global} />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {top.map((opp) => <OpportunityRow key={opp.id || opp.title} opportunity={opp} />)}
        {!top.length && <EmptyState text="אין הזדמנויות טעונות עדיין." />}
      </div>
    </div>
  );
}

function NeedsRadar({ needs, themes, companiesWithNeeds }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot cyan" /> מכ״ם צרכים</div>
        <span className="pill">{companiesWithNeeds.length} חברות</span>
      </div>
      <div style={grid("repeat(2, 1fr)", 10)}>
        <Metric label="סה״כ צרכים" value={needs.length} />
        <Metric label="נושאים חוזרים" value={themes.filter((t) => t.count > 1).length} tone="amber" />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {themes.map((theme) => <BarRow key={theme.label} label={theme.label} value={theme.count} max={theme.max} color={theme.color} />)}
        {!themes.length && <EmptyState text="אין עדיין צרכים שדווחו על ידי חברות." />}
      </div>
      <div className="divider" />
      <div className="flex gap-4 wrap">
        {companiesWithNeeds.slice(0, 8).map((c) => <span key={c.id} className="pill">{c.name}</span>)}
      </div>
    </div>
  );
}

function StrategicCompanies({ companies, onOpenCompany }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot amber" /> חברות אסטרטגיות</div>
        <span className="pill amber"><window.I.Star size={10} fill={true} /> {companies.length}</span>
      </div>
      <div className="col gap-8">
        {companies.slice(0, 8).map((c) => (
          <button key={c.id || c.name} className="btn btn-ghost" style={{ justifyContent: "stretch", textAlign: "start", padding: 8 }} onClick={() => onOpenCompany(c.id)}>
            <SafeCoLogo company={c} size={30} />
            <div className="col grow" style={{ minWidth: 0 }}>
              <div className="flex between center gap-8">
                <span style={truncateStyle()}>{c.name}</span>
                <span className="pill mono">{text(c.readiness) || "לא מסווג"}</span>
              </div>
              <div className="mono tiny" style={{ color: "var(--text-4)" }}>
                {categoryLabel(c)} · {asArray(c.tech).length} יכולות · {asArray(c.needs).length} צרכים
              </div>
            </div>
          </button>
        ))}
        {!companies.length && <EmptyState text="אין עדיין חברות שסומנו כאסטרטגיות." />}
      </div>
    </div>
  );
}

function CapabilityGaps({ themes, sectorDist }) {
  const strong = themes.filter((t) => ["strong", "moderate"].includes(t.level));
  const weak = themes.filter((t) => ["weak", "none"].includes(t.level));
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot" /> פערי יכולות</div>
        <span className="pill rose">{weak.length} פערים</span>
      </div>
      <div className="col gap-8">
        {themes.map((theme) => <BarRow key={theme.label} label={theme.label} value={theme.count} max={theme.max} color={theme.color} />)}
      </div>
      <div className="divider" />
      <div style={grid("1fr 1fr", 12)}>
        <CapabilityList title="כיסוי חזק" items={strong} tone="green" />
        <CapabilityList title="כיסוי חלש" items={weak} tone="rose" />
      </div>
      {!!sectorDist.length && (
        <div className="muted tiny" style={{ marginTop: 10 }}>
          נתוני סקטורים בסיסיים מ-{sectorDist.length} סקטורים באקוסיסטם.
        </div>
      )}
    </div>
  );
}

function RecentActivity({ activity }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot green" /> פעילות אחרונה</div>
        <button className="btn-ghost btn" disabled title="היסטוריה מלאה — בקרוב">לכל ההיסטוריה</button>
      </div>
      <div className="col gap-10">
        {activity.slice(0, 8).map((a, i) => <ActivityRow key={a.id || i} item={a} />)}
        {!activity.length && <EmptyState text="אין עדיין פעילות מתועדת." />}
      </div>
    </div>
  );
}

function CopilotSuggestions({ suggestions }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot violet" /> תובנות מהמאגר המקומי</div>
        <span className="pill violet"><window.I.Sparkles size={10} /> הצעות טיוטה</span>
      </div>
      <div className="muted tiny" style={{ marginBottom: 10 }}>מחושב מהנתונים המקומיים · דורש אישור אנושי · אין פרסום אוטומטי</div>
      <div className="col gap-8">
        {suggestions.map((s) => (
          <AiInsight key={s.title} title={s.title} text={s.text} tags={s.tags || []} />
        ))}
        {!suggestions.length && <EmptyState text="אין עדיין תובנות זמינות ממאגר הנתונים המקומי." />}
      </div>
    </div>
  );
}

// Display-only Hebrew labels for the demo REVIEW_QUEUE seed data — the raw
// English values in data.js stay untouched since priorityRank/priorityTone
// and status filtering compare against them directly.
const QUEUE_PRIORITY_HE = { High: "גבוה", Medium: "בינוני", Low: "נמוך" };
const QUEUE_STATUS_HE = {
  "Pending Review": "ממתין לבדיקה",
  "Needs Admin Decision": "דורש הכרעת מנהל",
  "Ready To Publish": "מוכן לפרסום",
};
const QUEUE_TYPE_HE = {
  "Company Profile Update": "עדכון פרופיל חברה",
  "Data Quality Issue": "בעיית איכות נתונים",
  "Imported Opportunity": "הזדמנות מיובאת",
  "New Company Submission": "הגשת חברה חדשה",
  "Stale Profile": "פרופיל לא מעודכן",
  "Sub-Technology Merge": "מיזוג תת-טכנולוגיה",
  "System Suggestion": "הצעת מערכת",
  "Technology Approval": "אישור טכנולוגיה",
};
function queueTitleHe(title) {
  if (!title) return title;
  if (title.startsWith("New company application:")) return title.replace("New company application:", "בקשת חברה חדשה:");
  return title;
}
function queueActionHe(action) {
  if (!action) return action;
  if (/^Verify/i.test(action)) return "בדוק פרטים ואשר או דחה";
  return action;
}

function QueueRow({ item }) {
  const tone = priorityTone(item.priority);
  return (
    <div style={rowStyle()}>
      <span className={`pill ${tone}`}>{QUEUE_PRIORITY_HE[item.priority] || item.priority || "בינוני"}</span>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="flex between center gap-8">
          <span style={{ fontWeight: 600, fontSize: 14 }}>{queueTitleHe(item.title) || QUEUE_TYPE_HE[item.type] || item.type || "פריט לבדיקה"}</span>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{QUEUE_STATUS_HE[item.status] || item.status || "ממתין"}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{QUEUE_TYPE_HE[item.type] || item.type || item.objectType || "בדיקה"} · {item.objectName || item.owner || "אקוסיסטם"}</div>
        {item.recommendedAction && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}>{queueActionHe(item.recommendedAction)}</div>}
      </div>
    </div>
  );
}

function OpportunityRow({ opportunity }) {
  return (
    <div style={rowStyle()}>
      <window.I.Briefcase size={14} style={{ color: opportunity.global ? "var(--violet)" : "var(--blue)", flex: "none" }} />
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="flex between center gap-8">
          <span style={opportunityTitleStyle()}>{opportunity.title || "הזדמנות ללא כותרת"}</span>
          <span className="pill mono">{opportunity.status || "פעילה"}</span>
        </div>
        <div className="mono tiny" style={{ color: "var(--text-4)" }}>
          {opportunity.type || "הזדמנות"} · תאריך יעד {opportunity.deadline || "לא נקבע"} {opportunity.global === true ? "· גלובלי" : ""}
        </div>
      </div>
    </div>
  );
}

function CapabilityList({ title, items, tone }) {
  return (
    <div>
      <div className={`pill ${tone}`} style={{ marginBottom: 8 }}>{title}</div>
      <div className="col gap-6">
        {items.slice(0, 4).map((item) => (
          <div key={item.label} className="flex between center gap-8 tiny">
            <span>{item.label}</span>
            <span className="mono tabnum">{item.count}</span>
          </div>
        ))}
        {!items.length && <div className="muted tiny">לא זוהה.</div>}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div style={{ padding: 10, border: "1px solid var(--line-1)", borderRadius: 8, background: "var(--bg-1)" }}>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</div>
      <div className={`tabnum ${tone || ""}`} style={{ fontSize: 22, fontWeight: 700, color: toneColor(tone) }}>{value}</div>
    </div>
  );
}

function SafeCoLogo({ company, size }) {
  if (window.CoLogo) {
    return <window.CoLogo company={company} size={size} />;
  }
  return (
    <div className="co-logo" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {(company.name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div className="flex center gap-10" style={{ fontSize: 12 }}>
      <div style={{ width: 150, color: "var(--text-2)", flex: "none" }}>{label}</div>
      <div className="grow" style={{ height: 18, background: "var(--bg-2)", borderRadius: 4, overflow: "hidden", border: "1px solid var(--line-1)" }}>
        <div style={{ width: `${pct}%`, minWidth: value > 0 ? 4 : 0, height: "100%", background: color || "var(--blue)" }} />
      </div>
      <div className="mono tabnum" style={{ width: 28, textAlign: "end" }}>{value}</div>
    </div>
  );
}

/* ── KPI card ── */
function Kpi({ label, value, trend, accent, onClick }) {
  return (
    <div className="kpi" style={{ "--accent": accent, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="label">{label}</div>
      <div className="value tabnum">{value}</div>
      <div className="trend">
        <span style={{ color: "var(--text-3)", fontSize: 11 }}>{trend}</span>
      </div>
    </div>
  );
}

/* ── Activity row ── */
function ActivityRow({ item }) {
  const tagColor = {
    intro:  "var(--blue)",
    ai:     "var(--violet)",
    flag:   "var(--amber)",
    opp:    "var(--green)",
    reject: "var(--rose)",
  }[item.tag] || "var(--text-3)";
  return (
    <div className="flex gap-8 center" style={{ fontSize: 12.5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: 50,
        background: tagColor, boxShadow: `0 0 6px ${tagColor}`, flex: "none",
      }} />
      <span style={{ flex: 1, color: "var(--text-2)" }}>
        <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{item.who || item.actor || "System"}</span>{" "}
        {item.what || item.action || "updated"}{" "}
        <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{item.to || item.target || ""}</span>
      </span>
      <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.t || item.createdAt || ""}</span>
    </div>
  );
}

/* ── Data insight card ── */
function AiInsight({ title, text, tags }) {
  return (
    <div style={{
      padding: 12, borderRadius: 8,
      background: "var(--bg-1)",
      border: "1px solid var(--line-1)",
    }}>
      <div className="flex center gap-6" style={{ marginBottom: 6 }}>
        <window.I.Sparkles size={13} style={{ color: "var(--violet)" }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>{text}</div>
      {!!tags.length && (
        <div className="flex gap-4 wrap" style={{ marginTop: 8 }}>
          {tags.map((t) => <span key={t} className="pill mono">{t}</span>)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="muted" style={{ padding: 12, border: "1px dashed var(--line-2)", borderRadius: 8 }}>{text}</div>;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return (value == null ? "" : String(value)).trim();
}

function norm(value) {
  return text(value).toLowerCase().replace(/[_-]+/g, " ");
}

function hasItems(value) {
  return asArray(value).length > 0;
}

function unique(items) {
  const out = [];
  items.forEach((item) => {
    if (item && out.indexOf(item) === -1) out.push(item);
  });
  return out;
}

function grid(columns, gap) {
  return { display: "grid", gridTemplateColumns: columns, gap };
}

function rowStyle() {
  return {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "8px 10px",
    border: "1px solid var(--line-1)",
    borderRadius: 8,
    background: "var(--bg-1)",
  };
}

function truncateStyle() {
  return { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
}

function opportunityTitleStyle() {
  return {
    fontWeight: 600,
    fontSize: 12.5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

function toneColor(tone) {
  return {
    amber: "var(--amber)",
    green: "var(--green)",
    rose: "var(--rose)",
    violet: "var(--violet)",
  }[tone] || "var(--text-1)";
}

function priorityRank(priority) {
  const ranks = { high: 0, medium: 1, low: 2 };
  const key = norm(priority);
  return Object.prototype.hasOwnProperty.call(ranks, key) ? ranks[key] : 3;
}

function priorityTone(priority) {
  return { high: "rose", medium: "amber", low: "green" }[norm(priority)] || "";
}

function collectCompanyItems(companies, field) {
  const items = [];
  companies.forEach((company) => {
    asArray(company[field]).forEach((item, idx) => {
      items.push({
        id: `${company.id || company.name}-${field}-${idx}`,
        companyId: company.id,
        companyName: company.name,
        text: typeof item === "string" ? item : (item.description || item.title || item.type || ""),
        raw: item,
      });
    });
  });
  return items;
}

function getOpportunityCounts(opportunities) {
  return opportunities.reduce((acc, opp) => {
    const status = norm(opp.status);
    if (status.includes("active")) acc.active += 1;
    if (status.includes("closing")) acc.closingSoon += 1;
    if (status.includes("review") || status.includes("draft")) acc.review += 1;
    if (opp.global === true) acc.global += 1;
    return acc;
  }, { active: 0, closingSoon: 0, review: 0, global: 0 });
}

function getReadinessDistribution(companies, readiness) {
  const labels = readiness.length ? readiness : unique(companies.map((c) => c.readiness)).filter(Boolean);
  const rows = labels.map((label, i) => ({
    label,
    count: companies.filter((c) => c.readiness === label).length,
    color: `oklch(0.62 0.16 ${145 + i * 24})`,
  }));
  const max = Math.max(...rows.map((r) => r.count), 1);
  return rows.map((row) => ({
    label: row.label,
    count: row.count,
    color: row.color,
    max,
  })).filter((row) => row.count > 0 || readiness.length);
}

function getNeedThemes(needs) {
  const defs = [
    { label: "Funding", keys: ["fund", "investment", "grant", "donor"], color: "var(--green)" },
    { label: "Lab / testing", keys: ["lab", "test", "testing", "certification"], color: "var(--amber)" },
    { label: "Pilot customers", keys: ["pilot", "customer", "anchor"], color: "var(--blue)" },
    { label: "Partners", keys: ["partner", "partnership", "collaboration"], color: "var(--violet)" },
    { label: "International market access", keys: ["international", "market", "export", "sales channel"], color: "oklch(0.65 0.18 200)" },
    { label: "Space qualification", keys: ["qualification", "space qualified", "mission access", "payload"], color: "var(--rose)" },
  ];
  const rows = defs.map((def) => ({
    label: def.label,
    count: needs.filter((need) => def.keys.some((key) => norm(need.text).includes(key))).length,
    color: def.color,
  }));
  const max = Math.max(...rows.map((r) => r.count), 1);
  return rows.map((row) => ({
    label: row.label,
    count: row.count,
    color: row.color,
    max,
  }));
}

function getCapabilityCoverage(companies) {
  const LEVEL_COLORS = { strong: "var(--green)", moderate: "var(--blue)", weak: "var(--amber)", none: "var(--rose)" };
  try {
    if (!window.CapabilityRegistry || typeof window.CapabilityRegistry.getCapabilityCoverage !== "function") return [];
    const coverage = window.CapabilityRegistry.getCapabilityCoverage(companies);
    const max = Math.max(...coverage.map((c) => c.count), 1);
    return coverage.map((c) => ({
      label: c.label || c.name || "Unknown",
      count: c.count || 0,
      color: LEVEL_COLORS[c.level] || "var(--text-4)",
      max,
      level: c.level || "none",
    }));
  } catch (e) {
    return [];
  }
}

const MATCH_CONFIDENCE_HE = { high: "גבוהה", medium: "בינונית", low: "נמוכה" };

function getCopilotSuggestions({ OPPORTUNITIES, COMPANIES, allNeeds }) {
  let topMatch = null;
  try {
    if (window.MatchEngine && typeof window.MatchEngine.generateCompanyMatches === "function") {
      const matches = window.MatchEngine.generateCompanyMatches(COMPANIES, { limit: 1, minScore: 40 });
      topMatch = matches[0] || null;
    }
  } catch (e) {}

  let biggestGap = null;
  try {
    if (window.CapabilityRegistry && typeof window.CapabilityRegistry.getCapabilityCoverage === "function") {
      biggestGap = window.CapabilityRegistry.getCapabilityCoverage(COMPANIES).find((c) => c.level === "none") || null;
    }
  } catch (e) {}

  const closing = OPPORTUNITIES.find((o) => norm(o.status).includes("closing"));
  const companiesWithNeeds = unique(allNeeds.map((n) => n.companyName));
  const suggestions = [
    topMatch && {
      title: "התאמה ברמת ביטחון גבוהה",
      text: `${topMatch.source.name} ו-${topMatch.target.name} קיבלו ציון התאמה של ${topMatch.score}% על בסיס יכולות וצרכים משותפים. כדאי לשקול חיבור בין החברות.`,
      tags: ["התאמה", MATCH_CONFIDENCE_HE[topMatch.confidence] || "איתות"],
    },
    biggestGap && {
      title: "פער יכולות באקוסיסטם",
      text: `אין כרגע חברות הממופות ל-"${biggestGap.label || biggestGap.name}". זהו פער כיסוי בגרף הידע של האקוסיסטם.`,
      tags: ["יכולת", "פער"],
    },
    closing && {
      title: "הזדמנות נסגרת דורשת התייחסות",
      text: `ההזדמנות "${closing.title}" מסומנת כנסגרת בקרוב. יש לוודא זכאות וליידע חברות מתאימות לפני המועד האחרון.`,
      tags: ["מועד אחרון", "הזדמנות"],
    },
    companiesWithNeeds.length > 1 && {
      title: "חברות עם צרכים והצעות תואמים",
      text: `${companiesWithNeeds.slice(0, 4).join(", ")} דיווחו על צרכים פעילים. כדאי להשוות מול ההצעות של חברות אחרות לפני פתיחת חיבורים.`,
      tags: ["צרכים", "התאמה"],
    },
  ].filter(Boolean);

  const unclassifiedCount = COMPANIES.filter((c) => !text(c.readiness)).length;
  if (unclassifiedCount > 0) {
    suggestions.push({
      title: "מועמד להעשרת מאגר הידע",
      text: `ל-${unclassifiedCount} חברות עדיין אין סיווג מוכנות (readiness). השלמת הסיווג תשפר את מהימנות מדדי הבריאות של האקוסיסטם.`,
      tags: ["איכות נתונים", "מוכנות"],
    });
  }
  return suggestions.slice(0, 5);
}

function categoryLabel(company) {
  const sectorId = asArray(company.sectors)[0];
  const sector = asArray(window.SECTORS).find((s) => s.id === sectorId);
  return (sector && sector.label) || sectorId || company.stage || "Uncategorized";
}

window.Dashboard = Dashboard;
