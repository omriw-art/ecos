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

function SearchBox({ onOpenCompany }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  const dropRef  = React.useRef(null);

  const results = q.trim().length === 0 ? [] : (window.COMPANIES || []).filter((c) => {
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
      const logo = c.logo
        ? `<img src="${c.logo}" style="width:26px;height:26px;border-radius:6px;object-fit:contain;background:#fff;padding:2px;flex-shrink:0">`
        : `<div style="width:26px;height:26px;border-radius:6px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0">${c.name[0]}</div>`;
      row.innerHTML = `${logo}<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;color:#eaf0ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div><div style="font-size:11px;color:#6c7898;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.blurb || ""}</div></div><div style="font-size:10px;color:#6c7898;white-space:nowrap;flex-shrink:0">${c.stage || ""}</div>`;
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
          onChange={(e) => { setQ(e.target.value); console.log("q=", e.target.value, "companies=", (window.COMPANIES||[]).length, "drop=", dropRef.current); }}
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

function Topbar({ title, crumb, onOpenCopilot, viewActions, onOpenCompany }) {
  return (
    <header className="topbar">
      <div className="col" style={{ gap: 2 }}>
        <h1>{title}</h1>
        {crumb && <div className="crumb mono">{crumb}</div>}
      </div>

      <SearchBox onOpenCompany={onOpenCompany} />

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
