// ecos — Dashboard (לוח ניהול אקו־סיסטם)
// Answers: what needs attention, what opportunities are active, and where ecosystem gaps exist.

function Dashboard({ onOpenCompany, onNav }) {
  const COMPANIES = asArray(window.COMPANIES);
  const OPPORTUNITIES = asArray(window.OPPORTUNITIES);
  const REVIEW_QUEUE = asArray(window.REVIEW_QUEUE);
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
  const pendingReviews = REVIEW_QUEUE.filter((q) => !["approved", "done", "resolved", "dismissed", "archived"].includes(norm(q.status)));
  const opportunityCounts = getOpportunityCounts(OPPORTUNITIES);
  const needThemes = getNeedThemes(allNeeds);
  const capabilityThemes = getCapabilityCoverage(COMPANIES);
  const copilotSuggestions = getCopilotSuggestions({ REVIEW_QUEUE, OPPORTUNITIES, COMPANIES, allNeeds });

  const [importPreview, setImportPreview] = React.useState(null);
  const importInputRef = React.useRef(null);

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      window.toast && window.toast("ייבוא Excel: ייצא את הקובץ כ-CSV UTF-8 ואז ייבא את קובץ ה-CSV.", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ext === "csv") {
        try {
          const companies = parseCSVCompanies(ev.target.result);
          if (!companies.length) {
            window.toast && window.toast("לא נמצאו חברות תקינות בקובץ ה-CSV", "err");
            return;
          }
          setImportPreview({ importType: "external-csv", exportedAt: null, companies, submissions: [], fileName: file.name });
        } catch (err) {
          window.toast && window.toast("שגיאת קריאת CSV — " + (err.message || err), "err");
        }
      } else {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (parsed.app && parsed.app !== "Ecosystem OS") {
            window.toast && window.toast("הקובץ אינו מיצוא של Ecosystem OS", "err");
            return;
          }
          let companies, submissions, importType, exportedAt;
          if (parsed.app === "Ecosystem OS") {
            if (!Array.isArray(parsed.companies)) {
              window.toast && window.toast("קובץ לא תקין — חסר מערך companies", "err");
              return;
            }
            companies = parsed.companies;
            submissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];
            importType = "ecosystem-os";
            exportedAt = parsed.exportedAt || null;
          } else if (Array.isArray(parsed)) {
            companies = parsed;
            submissions = [];
            importType = "external-json";
            exportedAt = null;
          } else if (Array.isArray(parsed.companies)) {
            companies = parsed.companies;
            submissions = [];
            importType = "external-json";
            exportedAt = null;
          } else {
            window.toast && window.toast("קובץ לא תקין — לא נמצאו חברות", "err");
            return;
          }
          const valid = companies
            .filter(c => c && typeof c === "object" && !Array.isArray(c))
            .map(c => importType === "external-json"
              ? Object.assign({}, c, { name: text(c.name || c.companyName || c.company || "") })
              : c)
            .filter(c => text(c.name || ""));
          if (!valid.length) {
            window.toast && window.toast("לא נמצאו חברות תקינות בקובץ", "err");
            return;
          }
          setImportPreview({ importType, exportedAt, companies: valid, submissions, fileName: file.name });
        } catch (err) {
          window.toast && window.toast("שגיאת קריאת JSON — " + (err.message || err), "err");
        }
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const prevCompanies = window.CompanyStore ? window.CompanyStore.getCompanies() : [];
    const prevSubmissions = window.SubmissionStore ? window.SubmissionStore.getSubmissions() : [];
    try {
      window.CompanyStore.saveCompanies(importPreview.companies);
      window.SubmissionStore.saveSubmissions(importPreview.submissions);
      window.toast && window.toast(
        `ייבוא הושלם — ${importPreview.companies.length} חברות, ${importPreview.submissions.length} הגשות · טוען מחדש…`,
        "ok"
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      try {
        window.CompanyStore && window.CompanyStore.saveCompanies(prevCompanies);
        window.SubmissionStore && window.SubmissionStore.saveSubmissions(prevSubmissions);
      } catch (_) {}
      setImportPreview(null);
      window.toast && window.toast("ייבוא נכשל — הנתונים שוחזרו. " + (err.message || err), "err");
    }
  };

  const exportLocalData = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        exportedAt: new Date().toISOString(),
        app: "Ecosystem OS",
        companies: window.CompanyStore ? window.CompanyStore.getCompanies() : COMPANIES,
        submissions: window.SubmissionStore ? window.SubmissionStore.getSubmissions() : [],
      };
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
    const headers = "name,description,website,sector,location,capabilities,needs,offers";
    const example = [
      "Example Company",
      "Short description of what the company does",
      "https://example.com",
      "earth-obs",
      "Tel Aviv",
      "SAR imaging;AI analysis",
      "Pilot customers;Funding",
      "Remote sensing data",
    ].map((v) => `"${v}"`).join(",");
    const csv = "﻿" + headers + "\n" + example + "\n";
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
    if (!window.confirm("איפוס לנתוני ברירת מחדל?\n\nפעולה זו תמחק את כל השינויים המקומיים ותשחזר את חברות ה-seed המקוריות. כל הייבואים וההגשות יימחקו.")) return;
    try {
      window.CompanyStore.resetCompaniesToSeed();
      window.SubmissionStore.saveSubmissions([]);
      window.toast && window.toast("איפוס הושלם — נתוני ברירת מחדל שוחזרו · טוען מחדש…", "ok");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      window.toast && window.toast("איפוס נכשל — " + (err.message || err), "err");
    }
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>לוח ניהול אקו־סיסטם</h2>
          <div className="sub">
            מיפוי חברות, יכולות, צרכים והזדמנויות — דמו מקומי
          </div>
        </div>
        <div className="ops">
          <span className="pill mono" title="נתונים מקומיים · לא מחובר לשרת">LOCAL · DEMO</span>
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
          <button className="btn" onClick={resetLocalData} title="מוחק שינויים מקומיים ומשחזר את נתוני ה-seed המקוריים">
            <window.I.Bolt size={13} /> איפוס לדאטה התחלתי
          </button>
          <button className="btn btn-primary" onClick={() => onNav("onboard")}>
            <window.I.Plus size={13} /> הוסף חברה
          </button>
        </div>
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
        needs={allNeeds}
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
        <ActionQueue items={pendingReviews} />
      </div>

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

function StrategicBar({ companies, activeCompanies, strategicCompanies, openOpportunities, needs, pendingReviews, onNav }) {
  return (
    <div className="kpi-grid">
      <Kpi label="סך ארגונים" value={companies.length} trend="כל הרשומות במאגר המקומי" accent="oklch(0.7 0.18 250 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="חברות פעילות" value={activeCompanies.length} trend="חברות שסומנו כפעילות או אסטרטגיות" accent="oklch(0.7 0.15 145 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="חברות אסטרטגיות" value={strategicCompanies.length} trend="דורשות בדיקה או החלטה" accent="oklch(0.78 0.15 80 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="הזדמנויות פתוחות" value={openOpportunities.length} trend="פעילות, בבדיקה או בסגירה" accent="oklch(0.7 0.18 295 / 0.18)" />
      <Kpi label="צרכים פתוחים" value={needs.length} trend={`${unique(needs.map((n) => n.companyId)).length} חברות עם צרכים שהוזנו`} accent="oklch(0.65 0.20 200 / 0.18)" />
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
          Funnel baseline preserved: {funnel.map((f) => `${f.stage || "Stage"} ${f.n || 0}`).join(" · ")}
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
        {!sorted.length && <EmptyState text="אין פעולות שממתינות לטיפול." />}
      </div>
    </div>
  );
}

function OpportunitiesRadar({ opportunities, counts }) {
  const top = opportunities.slice().sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).slice(0, 5);
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot violet" /> Opportunities Radar</div>
        <span className="pill mono">{opportunities.length} TRACKED</span>
      </div>
      <div style={grid("repeat(4, 1fr)", 10)}>
        <Metric label="Active" value={counts.active} />
        <Metric label="Closing soon" value={counts.closingSoon} tone="amber" />
        <Metric label="Review / draft" value={counts.review} tone="violet" />
        <Metric label="Global" value={counts.global} />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {top.map((opp) => <OpportunityRow key={opp.id || opp.title} opportunity={opp} />)}
        {!top.length && <EmptyState text="No opportunities loaded. The dashboard will render when OPPORTUNITIES is added." />}
      </div>
    </div>
  );
}

function NeedsRadar({ needs, themes, companiesWithNeeds }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot cyan" /> Needs Radar</div>
        <span className="pill">{companiesWithNeeds.length} companies</span>
      </div>
      <div style={grid("repeat(2, 1fr)", 10)}>
        <Metric label="Total needs" value={needs.length} />
        <Metric label="Repeated themes" value={themes.filter((t) => t.count > 1).length} tone="amber" />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {themes.map((theme) => <BarRow key={theme.label} label={theme.label} value={theme.count} max={theme.max} color={theme.color} />)}
        {!themes.length && <EmptyState text="No company needs are populated yet." />}
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
        <div className="card-title"><span className="dot amber" /> Strategic Companies</div>
        <span className="pill amber"><window.I.Star size={10} fill={true} /> {companies.length}</span>
      </div>
      <div className="col gap-8">
        {companies.slice(0, 8).map((c) => (
          <button key={c.id || c.name} className="btn btn-ghost" style={{ justifyContent: "stretch", textAlign: "start", padding: 8 }} onClick={() => onOpenCompany(c.id)}>
            <SafeCoLogo company={c} size={30} />
            <div className="col grow" style={{ minWidth: 0 }}>
              <div className="flex between center gap-8">
                <span style={truncateStyle()}>{c.name}</span>
                <span className="pill mono">{text(c.readiness) || "Unclassified"}</span>
              </div>
              <div className="mono tiny" style={{ color: "var(--text-4)" }}>
                {categoryLabel(c)} · {asArray(c.tech).length} tech · {asArray(c.needs).length} needs
              </div>
            </div>
          </button>
        ))}
        {!companies.length && <EmptyState text="No strategic companies have been flagged yet." />}
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
        <div className="card-title"><span className="dot" /> Capability Gaps</div>
        <span className="pill rose">{weak.length} weak</span>
      </div>
      <div className="col gap-8">
        {themes.map((theme) => <BarRow key={theme.label} label={theme.label} value={theme.count} max={theme.max} color={theme.color} />)}
      </div>
      <div className="divider" />
      <div style={grid("1fr 1fr", 12)}>
        <CapabilityList title="Strong coverage" items={strong} tone="green" />
        <CapabilityList title="Weak coverage" items={weak} tone="rose" />
      </div>
      {!!sectorDist.length && (
        <div className="muted tiny" style={{ marginTop: 10 }}>
          Sector baseline preserved from {sectorDist.length} ecosystem sectors.
        </div>
      )}
    </div>
  );
}

function RecentActivity({ activity }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot green" /> Recent Activity</div>
        <button className="btn-ghost btn" disabled title="היסטוריה מלאה — בקרוב">לכל ההיסטוריה</button>
      </div>
      <div className="col gap-10">
        {activity.slice(0, 8).map((a, i) => <ActivityRow key={a.id || i} item={a} />)}
        {!activity.length && <EmptyState text="No activity feed is available yet." />}
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
          <span style={opportunityTitleStyle()}>{opportunity.title || "Untitled opportunity"}</span>
          <span className="pill mono">{opportunity.status || "Active"}</span>
        </div>
        <div className="mono tiny" style={{ color: "var(--text-4)" }}>
          {opportunity.type || "Opportunity"} · deadline {opportunity.deadline || "TBD"} {opportunity.global === true ? "· GLOBAL" : ""}
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
        {!items.length && <div className="muted tiny">None detected.</div>}
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

function getCopilotSuggestions({ REVIEW_QUEUE, OPPORTUNITIES, COMPANIES, allNeeds }) {
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

  const strategicReview = REVIEW_QUEUE.find((q) => norm(q.type).includes("ai suggestion") || norm(q.title).includes("strategic"));
  const publishable = REVIEW_QUEUE.find((q) => norm(q.status).includes("ready to publish"));
  const staleStrategic = REVIEW_QUEUE.find((q) => norm(q.title).includes("strategic") && norm(q.title).includes("profile"));
  const closing = OPPORTUNITIES.find((o) => norm(o.status).includes("closing"));
  const companiesWithNeeds = unique(allNeeds.map((n) => n.companyName));
  const suggestions = [
    topMatch && {
      title: "High-confidence ecosystem match",
      text: `${topMatch.source.name} and ${topMatch.target.name} scored ${topMatch.score}% compatibility. ${topMatch.sharedCapabilities && topMatch.sharedCapabilities.length ? "Shared: " + topMatch.sharedCapabilities.slice(0, 2).join(", ") + "." : (topMatch.reasons && topMatch.reasons[0]) || "Complementary signals."} Consider facilitating an introduction.`,
      tags: ["match", topMatch.confidence || "signal"],
    },
    biggestGap && {
      title: "Ecosystem capability gap",
      text: `No companies are currently mapped to "${biggestGap.label || biggestGap.name}". This is a coverage blind spot in the ecosystem knowledge graph.`,
      tags: ["capability", "gap"],
    },
    strategicReview && {
      title: "Strategic profile needs review",
      text: `${strategicReview.objectName || strategicReview.title} is waiting for human review before it becomes official ecosystem knowledge.`,
      tags: ["review", "strategic"],
    },
    publishable && {
      title: "Opportunity ready to publish",
      text: `${publishable.objectName || publishable.title} appears ready for admin review and publication to relevant companies.`,
      tags: ["opportunity", "publish"],
    },
    closing && {
      title: "Closing opportunity requires attention",
      text: `${closing.title} is marked closing soon. Confirm eligibility and notify matching companies before the deadline.`,
      tags: ["deadline", "opportunity"],
    },
    companiesWithNeeds.length > 1 && {
      title: "Companies with matching needs / offers",
      text: `${companiesWithNeeds.slice(0, 4).join(", ")} report active needs. Compare them with company offers before opening introductions.`,
      tags: ["needs", "matching"],
    },
    staleStrategic && {
      title: "Stale strategic company profile",
      text: `${staleStrategic.objectName || staleStrategic.title} should be reviewed because strategic records need stronger governance cadence.`,
      tags: ["profile", "governance"],
    },
  ].filter(Boolean);

  while (suggestions.length < 3) {
    suggestions.push({
      title: "Knowledge graph enrichment candidate",
      text: `${COMPANIES.filter((c) => !text(c.readiness)).length} companies still need readiness classification before the health model is reliable.`,
      tags: ["data quality", "readiness"],
    });
  }
  return suggestions.slice(0, 5);
}

function categoryLabel(company) {
  const sectorId = asArray(company.sectors)[0];
  const sector = asArray(window.SECTORS).find((s) => s.id === sectorId);
  return (sector && sector.label) || sectorId || company.stage || "Uncategorized";
}

// ── CSV import utilities ──

function parseCSVLine(line) {
  const cells = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { field += line[i++]; }
      }
      cells.push(field.trim());
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { cells.push(line.slice(i).trim()); break; }
      cells.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  if (line.endsWith(",")) cells.push("");
  return cells;
}

const CSV_COL_MAP = {
  name: "name", company: "name", companyname: "name", "שם": "name", "שםחברה": "name",
  description: "blurb", blurb: "blurb", about: "blurb", summary: "blurb", "תיאור": "blurb",
  website: "website", url: "website", link: "website", "אתר": "website",
  city: "hq", companyscity: "hq", companycity: "hq", "עיר": "hq",
  location: "location", "מיקום": "location",
  country: "country", "מדינה": "country",
  stage: "stage", fundingstage: "stage",
  yearestablished: "founded", founded: "founded",
  sector: "sector", sectors: "sector", industry: "sector", category: "sector", "תחום": "sector", "סקטור": "sector",
  subcategory: "subCategory",
  capabilities: "tech", capability: "tech", tags: "tech", tag: "tech", tech: "tech", technology: "tech", technologies: "tech",
  "טכנולוגיות": "tech", "יכולות": "tech", "תגיות": "tech",
  needs: "needs", need: "needs", "צרכים": "needs", "צורך": "needs",
  offers: "offers", offer: "offers", solutions: "offers", "הצעה": "offers", "פתרונות": "offers",
};

const SECTOR_COL_MAP = {
  // Space/tech → canonical sector IDs
  eo: "earth-obs", earthobs: "earth-obs",
  communication: "comms", comms: "comms",
  defense: "defense",
  launchpropulsion: "propulsion", launchers: "launchers", propulsion: "propulsion",
  spacesystemmanufacturing: "manufacturing", manufacturing: "manufacturing",
  groundsystems: "manufacturing", inspacerdmanufacturing: "manufacturing",
  inspaceservicesinfrastructure: "manufacturing", explorationresourceutilization: "manufacturing",
  aidata: "ai-data", computingsoftwareanddatasolutions: "ai-data", pnt: "ai-data",
  healthtech: "life-sci",
  energy: "energy", sar: "sar",
  // Non-canonical → honest descriptive labels (not real sector IDs)
  education: "education", educationoutreach: "education",
  research: "research", researchanddevelopment: "research",
  academic: "academic", academicandresearchinstitutions: "academic",
  accelerator: "accelerator", acceleratorsinnovationhubs: "accelerator",
  investment: "investment", investmentventuresupport: "investment",
  consulting: "consulting", consultingengineeringservices: "consulting",
  government: "government",
  legal: "legal", legalinsurancepolicy: "legal",
};

function normCol(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9֐-׿]/g, "");
}

function parseCSVCompanies(csvText) {
  const clean = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;
  const rows = clean.split(/\r?\n|\r/).filter(l => l.trim()).map(parseCSVLine);
  const nameKeys = new Set(["name", "company", "companyname", "שם", "שםחברה"]);
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (rows[i].slice(0, 6).some(c => nameKeys.has(normCol(c)))) { headerIdx = i; break; }
  }
  const headers = rows[headerIdx].map(normCol);
  const usedIds = new Set();
  return rows.slice(headerIdx + 1).map(function(row) {
    const raw = {};
    headers.forEach(function(h, i) {
      const field = CSV_COL_MAP[h];
      const val = row[i] ? row[i].trim() : "";
      if (field && val) raw[field] = val;
    });
    if (!raw.name) return null;
    const sectorKey = normCol(raw.subCategory || raw.sector || "");
    const rawSectorText = (raw.subCategory || raw.sector || "").trim();
    const sector = SECTOR_COL_MAP[sectorKey] || rawSectorText || "other";
    const splitMV = function(v) { return v ? String(v).split(/[,;|]/).map(function(s) { return s.trim(); }).filter(Boolean) : []; };
    const base = raw.name.toLowerCase().replace(/[^a-z0-9֐-׿]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "co";
    let id = base + "-csv";
    let n = 2;
    while (usedIds.has(id)) id = base + "-csv-" + n++;
    usedIds.add(id);
    return {
      id: id,
      name: raw.name,
      blurb: raw.blurb || "",
      website: raw.website || "",
      hq: raw.hq || raw.location || raw.country || "Israel",
      country: raw.country || "Israel",
      stage: raw.stage || "Seed",
      founded: Number(raw.founded) || 0,
      sectors: [sector],
      tech: splitMV(raw.tech),
      needs: splitMV(raw.needs),
      offers: splitMV(raw.offers),
    };
  }).filter(function(c) { return c && c.name; });
}

window.Dashboard = Dashboard;
