// ecos — App shell: Sidebar (RTL right side) + Topbar
// Owns navigation state via props.

const NAV = [
  { id: "dashboard",    label: "דשבורד",          icon: "Grid",     section: "מבט-על" },
  { id: "companies",    label: "ארגונים",         icon: "Building", section: "מבט-על", count: () => (window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || [])).length },
  { id: "capabilities", label: "יכולות חלל",      icon: "Layers",   section: "מבט-על" },
  { id: "map",          label: "מפת אקוסיסטם",    icon: "Network",  section: "מבט-על" },
  { id: "needs",        label: "צרכים",           icon: "Compass",  section: "מבט-על" },

  { id: "matches",   label: "התאמות לצרכים", icon: "Sparkles",  section: "Intelligence" },
  { id: "copilot",   label: "חיפוש חכם",     icon: "Cpu",       section: "Intelligence" },
  { id: "people",    label: "ארגון",          icon: "Users",     section: "Intelligence" },

  { id: "onboard",   label: "Onboarding לחברה", icon: "Rocket",  section: "פעולות" },
  { id: "settings",  label: "הגדרות",         icon: "Settings",  section: "פעולות" },
];

// Perspective-aware navigation. Admin sees the full nav, byte-identical to
// before. Company nav is deliberately minimal — feed landing, its own
// organization's profile, and the shared growth-tools catalog — not the
// admin entity-browsing nav (dashboard/companies-directory/capabilities/map/
// needs/matches/copilot/people). "הארגון שלי" opens only the acting
// company's own profile (App.goNav special-cases this id to resolve and open
// the acting company directly) — it is not the admin companies directory,
// and a company can never browse other organizations through it. The rest
// of the admin nav is still reachable via onNav from within the feed (e.g.
// "open opportunity", "add a need"), just not primary navigation. Partner
// keeps its existing (broader) nav unchanged. This is a presentational lens,
// never an access-control boundary.
const PERSPECTIVE_ADMIN_ONLY = new Set(["onboard", "settings"]);
const COMPANY_OVERVIEW_ITEM = { id: "company-overview", label: "פיד הזדמנויות", icon: "Satellite", section: "מבט-על" };
const MY_ORGANIZATION_ITEM = { id: "my-organization", label: "הארגון שלי", icon: "Building", section: "מבט-על" };
const PARTNER_OVERVIEW_ITEM = { id: "partner-overview", label: "סביבת שותף", icon: "Users", section: "מבט-על" };
const GROWTH_TOOLS_ITEM = { id: "growth-tools", label: "הזדמנויות צמיחה", icon: "Trend", section: "מבט-על" };
function navForPerspective(perspective) {
  if (perspective === "company") {
    return [COMPANY_OVERVIEW_ITEM, MY_ORGANIZATION_ITEM, GROWTH_TOOLS_ITEM];
  }
  if (perspective === "partner") {
    // Growth Tools is shared read-only reference between Company and Partner
    // — same catalog, same disclaimer, no partner-specific eligibility.
    return [PARTNER_OVERVIEW_ITEM, ...NAV.filter((n) => !PERSPECTIVE_ADMIN_ONLY.has(n.id)), GROWTH_TOOLS_ITEM];
  }
  return NAV;
}

function Sidebar({ active, onChange, perspective }) {
  const items = navForPerspective(perspective);
  const sections = [...new Set(items.map((n) => n.section))];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">ecos</div>
          <div className="brand-sub">Space Ecosystem OS</div>
        </div>
      </div>

      {sections.map((sec) => (
        <React.Fragment key={sec}>
          <div className="nav-section">{sec}</div>
          {items.filter((n) => n.section === sec).map((n) => {
            const IconCmp = window.I[n.icon];
            return (
              <div
                key={n.id}
                className={"nav-item" + (active === n.id ? " active" : "")}
                onClick={() => onChange(n.id)}
              >
                <IconCmp size={16} />
                <span>{n.label}</span>
                {n.count && <span className="nav-count mono">{n.count()}</span>}
              </div>
            );
          })}
        </React.Fragment>
      ))}

      <div className="sidebar-foot">
        <div className="sidebar-avatar">RA</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>רון אבני</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>VP Innovation</div>
        </div>
      </div>
    </aside>
  );
}

function SearchBox({ onOpenCompany }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  const dropRef  = React.useRef(null);

  const searchCompanies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  const results = q.trim().length === 0 ? [] : searchCompanies.filter((c) => {
    const hay = [c.name, c.country, c.hq, c.blurb].concat(c.tech || []).concat(c.sectors || []).join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  }).slice(0, 8);

  // Keep dropdown positioned under the input using a DOM div appended to body
  React.useEffect(() => {
    const el = document.createElement("div");
    el.id = "global-search-drop";
    el.style.cssText = "position:fixed;z-index:9999;display:none;background:#0c1120;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden;box-shadow:0 20px 60px -10px rgba(0,0,0,.85);min-width:320px";
    document.body.appendChild(el);
    dropRef.current = el;
    const hide = (e) => { if (!el.contains(e.target) && e.target !== inputRef.current) el.style.display = "none"; };
    document.addEventListener("mousedown", hide);
    return () => { document.removeEventListener("mousedown", hide); el.remove(); };
  }, []);

  React.useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    if (results.length === 0) { el.style.display = "none"; return; }

    const r = inputRef.current ? inputRef.current.closest(".search-wrap").getBoundingClientRect() : null;
    if (r) { el.style.top = (r.bottom + 6) + "px"; el.style.left = r.left + "px"; el.style.width = r.width + "px"; }

    el.innerHTML = "";
    results.forEach((c) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06)";

      let logoEl;
      if (c.logo) {
        logoEl = document.createElement("img");
        logoEl.src = c.logo;
        logoEl.style.cssText = "width:26px;height:26px;border-radius:6px;object-fit:contain;background:#fff;padding:2px;flex-shrink:0";
      } else {
        logoEl = document.createElement("div");
        logoEl.style.cssText = "width:26px;height:26px;border-radius:6px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0";
        logoEl.textContent = [...(c.name || "?")][0];
      }

      const infoWrap = document.createElement("div");
      infoWrap.style.cssText = "flex:1;min-width:0";
      const nameEl = document.createElement("div");
      nameEl.style.cssText = "font-weight:600;font-size:13px;color:#eaf0ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
      nameEl.textContent = c.name;
      const blurbEl = document.createElement("div");
      blurbEl.style.cssText = "font-size:11px;color:#6c7898;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
      blurbEl.textContent = c.blurb || "";
      infoWrap.appendChild(nameEl);
      infoWrap.appendChild(blurbEl);

      const stageEl = document.createElement("div");
      stageEl.style.cssText = "font-size:10px;color:#6c7898;white-space:nowrap;flex-shrink:0";
      stageEl.textContent = c.stage || "";

      row.appendChild(logoEl);
      row.appendChild(infoWrap);
      row.appendChild(stageEl);

      row.onmouseenter = () => row.style.background = "rgba(255,255,255,.07)";
      row.onmouseleave = () => row.style.background = "transparent";
      row.onmousedown  = () => { el.style.display = "none"; setQ(""); onOpenCompany && onOpenCompany(c.id); };
      el.appendChild(row);
    });
    el.style.display = "block";
  }, [results]);

  const onKey = (e) => {
    if (e.key === "Escape") { setQ(""); if (dropRef.current) dropRef.current.style.display = "none"; }
    if (e.key === "Enter" && results[0]) { if (dropRef.current) dropRef.current.style.display = "none"; setQ(""); onOpenCompany && onOpenCompany(results[0].id); }
  };

  return (
    <div className="search-wrap" style={{ flex: 1, maxWidth: 520 }}>
      <div className="search" style={{ maxWidth: "100%" }}>
        <window.I.Search size={14} />
        <input
          ref={inputRef}
          placeholder="חיפוש חברה, טכנולוגיה, אדם או פרויקט…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        {q
          ? <span style={{ cursor: "pointer", opacity: 0.5, fontSize: 12 }} onMouseDown={() => { setQ(""); if (dropRef.current) dropRef.current.style.display = "none"; }}>✕</span>
          : <span className="kbd">⌘K</span>
        }
      </div>
    </div>
  );
}

// Demo "view-as" switcher. Presentational only — it changes what the UI shows,
// not what the user is allowed to do. Deliberately no "logged in as", avatar,
// logout, or lock iconography; the honest sub-label makes clear it is not a login.
const PERSPECTIVE_OPTIONS = [
  { id: "admin",   label: "גוף מנהל" },
  { id: "company", label: "חברה" },
  { id: "partner", label: "שותף" },
];
function PerspectiveSwitcher({ perspective, onChange }) {
  return (
    <div className="flex center gap-8" role="group" aria-label="החלפת תצוגת דמו"
         title="החלפת תצוגת דמו · לא כניסת משתמש"
         style={{ flex: "none" }}>
      <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "var(--text-3)", whiteSpace: "nowrap" }}>תצוגה כ־</span>
      <div className="flex" style={{ gap: 4 }}>
        {PERSPECTIVE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={"chip" + (perspective === opt.id ? " active" : "")}
            style={{ fontSize: 12, padding: "4px 10px" }}
            aria-pressed={perspective === opt.id}
            onClick={() => onChange && onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--text-4)", whiteSpace: "nowrap" }}>דמו · לא כניסת משתמש</span>
    </div>
  );
}

function Topbar({ title, crumb, onOpenCopilot, viewActions, onOpenCompany, perspective, onChangePerspective, showPerspectiveSwitcher }) {
  return (
    <header className="topbar">
      <div className="col" style={{ gap: 2 }}>
        <h1>{title}</h1>
        {crumb && <div className="crumb mono">{crumb}</div>}
      </div>

      <SearchBox onOpenCompany={onOpenCompany} />

      {viewActions}

      {showPerspectiveSwitcher && (
        <PerspectiveSwitcher perspective={perspective} onChange={onChangePerspective} />
      )}

      <button className="icon-btn" disabled title="התראות — בקרוב">
        <window.I.Bell size={15} />
      </button>
      <button className="icon-btn glow" onClick={onOpenCopilot} title="חיפוש חכם">
        <window.I.Sparkles size={15} />
      </button>
    </header>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.NAV = NAV;
window.navForPerspective = navForPerspective;
