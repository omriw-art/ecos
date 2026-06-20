// ecos — App shell: Sidebar (RTL right side) + Topbar
// Owns navigation state via props.

const NAV = [
  { id: "dashboard",    label: "דשבורד",          icon: "Grid",     section: "מבט-על" },
  { id: "companies",    label: "חברות",           icon: "Building", section: "מבט-על", count: () => window.COMPANIES.length },
  { id: "capabilities", label: "יכולות חלל",      icon: "Layers",   section: "מבט-על" },
  { id: "map",          label: "מפת אקוסיסטם",    icon: "Network",  section: "מבט-על" },

  { id: "matches",   label: "התאמות לעובדים", icon: "Sparkles",  section: "Intelligence" },
  { id: "copilot",   label: "AI Copilot",     icon: "Cpu",       section: "Intelligence" },
  { id: "people",    label: "ארגון",          icon: "Users",     section: "Intelligence", count: () => window.PEOPLE.length },

  { id: "onboard",   label: "Onboarding לחברה", icon: "Rocket",  section: "פעולות" },
  { id: "settings",  label: "הגדרות",         icon: "Settings",  section: "פעולות" },
];

function Sidebar({ active, onChange }) {
  const sections = [...new Set(NAV.map((n) => n.section))];
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
          {NAV.filter((n) => n.section === sec).map((n) => {
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

function Topbar({ title, crumb, onOpenCopilot, viewActions }) {
  return (
    <header className="topbar">
      <div className="col" style={{ gap: 2 }}>
        <h1>{title}</h1>
        {crumb && <div className="crumb mono">{crumb}</div>}
      </div>

      <div className="search">
        <window.I.Search size={14} />
        <input placeholder="חיפוש חברה, טכנולוגיה, אדם או פרויקט…" />
        <span className="kbd">⌘K</span>
      </div>

      {viewActions}

      <button className="icon-btn" title="התראות">
        <window.I.Bell size={15} />
      </button>
      <button className="icon-btn glow" onClick={onOpenCopilot} title="AI Copilot">
        <window.I.Sparkles size={15} />
      </button>
    </header>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.NAV = NAV;
