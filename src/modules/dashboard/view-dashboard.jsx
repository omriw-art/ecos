// ecos — Dashboard (Admin Mission Control)
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

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Admin Mission Control</h2>
          <div className="sub">
            Ecosystem OS · Israeli Space Ecosystem — admin intelligence, governance, opportunities, and gaps
          </div>
        </div>
        <div className="ops">
          <span className="pill mono" title="נתונים מקומיים · לא מחובר לשרת">LOCAL · DEMO</span>
          <button className="btn" disabled title="ייצוא — בקרוב">
            <window.I.Upload size={13} /> ייצוא דו"ח
          </button>
          <button className="btn btn-primary" onClick={() => onNav("onboard")}>
            <window.I.Plus size={13} /> הוסף חברה
          </button>
        </div>
      </div>

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
      <Kpi label="Total organizations" value={companies.length} trend="All ecosystem records" accent="oklch(0.7 0.18 250 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="Active companies" value={activeCompanies.length} trend="Readiness: Active / Strategic" accent="oklch(0.7 0.15 145 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="Strategic companies" value={strategicCompanies.length} trend="Flagged for admin attention" accent="oklch(0.78 0.15 80 / 0.18)" onClick={() => onNav("companies")} />
      <Kpi label="Open opportunities" value={openOpportunities.length} trend="Active, review, or closing soon" accent="oklch(0.7 0.18 295 / 0.18)" />
      <Kpi label="Open needs" value={needs.length} trend={`${unique(needs.map((n) => n.companyId)).length} companies reporting needs`} accent="oklch(0.65 0.20 200 / 0.18)" />
      <Kpi label="Pending reviews" value={pendingReviews.length} trend="Human approval required" accent="oklch(0.72 0.20 30 / 0.18)" />
    </div>
  );
}

function EcosystemHealth({ companies, companiesWithReadiness, companiesWithNeeds, companiesWithTech, strategicCompanies, readiness, funnel }) {
  const readinessRows = getReadinessDistribution(companies, readiness);
  const completeness = Math.round(((companiesWithReadiness.length + companiesWithNeeds.length + companiesWithTech.length) / Math.max(companies.length * 3, 1)) * 100);
  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title"><span className="dot green" /> Ecosystem Health</div>
        <span className="pill mono">{completeness}% COMPLETE</span>
      </div>
      <div style={grid("repeat(5, 1fr)", 10)}>
        <Metric label="With readiness" value={companiesWithReadiness.length} />
        <Metric label="Missing readiness" value={companies.length - companiesWithReadiness.length} tone="amber" />
        <Metric label="With needs" value={companiesWithNeeds.length} />
        <Metric label="With tech" value={companiesWithTech.length} />
        <Metric label="Strategic" value={strategicCompanies.length} tone="violet" />
      </div>
      <div className="divider" />
      <div className="col gap-8">
        {readinessRows.map((row) => <BarRow key={row.label} label={row.label} value={row.count} max={row.max} color={row.color} />)}
        {!readinessRows.length && <EmptyState text="No readiness data available yet." />}
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
        <div className="card-title"><span className="dot amber" /> Action Queue</div>
        <span className="pill amber">{items.length} pending</span>
      </div>
      <div className="col gap-8">
        {sorted.map((item) => (
          <QueueRow key={item.id || item.title} item={item} />
        ))}
        {!sorted.length && <EmptyState text="No review items waiting for admin action." />}
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
        <div className="card-title"><span className="dot violet" /> AI Insights / Copilot Suggestions</div>
        <span className="pill violet"><window.I.Sparkles size={10} /> Draft suggestions</span>
      </div>
      <div className="muted tiny" style={{ marginBottom: 10 }}>Human approval required · no auto-publish behavior</div>
      <div className="col gap-8">
        {suggestions.map((s) => (
          <AiInsight key={s.title} title={s.title} text={s.text} tags={s.tags || []} />
        ))}
      </div>
    </div>
  );
}

function QueueRow({ item }) {
  const tone = priorityTone(item.priority);
  return (
    <div style={rowStyle()}>
      <span className={`pill ${tone}`}>{item.priority || "Medium"}</span>
      <div className="col grow" style={{ minWidth: 0 }}>
        <div className="flex between center gap-8">
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{item.title || item.type || "Review item"}</span>
          <span className="mono tiny" style={{ color: "var(--text-4)" }}>{item.status || "Pending"}</span>
        </div>
        <div className="mono tiny" style={{ color: "var(--text-4)" }}>{item.type || item.objectType || "Review"} · {item.objectName || item.owner || "ecosystem"}</div>
        {item.recommendedAction && <div className="muted tiny" style={{ marginTop: 4 }}>{item.recommendedAction}</div>}
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
      <div className="mono tiny" style={{ color: "var(--text-4)", textTransform: "uppercase" }}>{label}</div>
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

window.Dashboard = Dashboard;
