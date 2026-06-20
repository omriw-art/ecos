// ecos — Root app
// Holds: active view, selected company (for profile), copilot drawer, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typo": "sans",
  "density": "regular",
  "accent": ["#8B5CF6", "#3B82F6"]
}/*EDITMODE-END*/;

const VIEW_TITLES = {
  dashboard:    { title: "Mission Control",   crumb: "DASHBOARD · LIVE"              },
  companies:    { title: "חברות",            crumb: "ECOSYSTEM · COMPANIES"          },
  company:      { title: "פרופיל חברה",      crumb: "ECOSYSTEM · COMPANIES · PROFILE" },
  capabilities: { title: "יכולות חלל",       crumb: "ECOSYSTEM · CAPABILITIES"       },
  map:          { title: "מפת אקוסיסטם",     crumb: "ECOSYSTEM · GRAPH"              },
  matches:      { title: "התאמות לעובדים",   crumb: "INTELLIGENCE · MATCH"           },
  copilot:      { title: "AI Copilot",        crumb: "INTELLIGENCE · COPILOT"         },
  people:       { title: "ארגון",             crumb: "INTELLIGENCE · PEOPLE"          },
  onboard:      { title: "Onboarding",        crumb: "ACTIONS · NEW COMPANY"          },
  settings:     { title: "הגדרות",           crumb: "ACTIONS · SETTINGS"             },
};

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("dashboard");
  const [companyId, setCompanyId] = React.useState(null);
  const [copilotOpen, setCopilotOpen] = React.useState(false);

  // Apply typography + density class to body
  React.useEffect(() => {
    document.body.className =
      `typo-${t.typo} density-${t.density}`;
    // Set accent variables
    if (Array.isArray(t.accent) && t.accent.length >= 2) {
      document.documentElement.style.setProperty("--blue", t.accent[1]);
      document.documentElement.style.setProperty("--violet", t.accent[0]);
    }
  }, [t]);

  // Listen for ⌘K / Esc to open copilot
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCopilotOpen((v) => !v);
      } else if (e.key === "Escape") {
        setCopilotOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goCompany = (id) => { setCompanyId(id); setView("company"); };
  const goNav = (id) => {
    if (id === "copilot") { setCopilotOpen(true); return; }
    setView(id);
  };

  const head = VIEW_TITLES[view] || { title: "ecos", crumb: "" };

  return (
    <div className="shell" data-screen-label={view}>
      <Sidebar active={view === "company" ? "companies" : view} onChange={goNav} />
      <main className="main">
        <Topbar title={head.title} crumb={head.crumb} onOpenCopilot={() => setCopilotOpen(true)} />
        {view === "dashboard"    && <Dashboard onOpenCompany={goCompany} onNav={goNav} />}
        {view === "companies"    && <CompaniesView onOpenCompany={goCompany} />}
        {view === "company"      && <CompanyProfile id={companyId} onBack={() => setView("companies")} onNav={goNav} onOpenCompany={goCompany} />}
        {view === "capabilities" && <CapabilitiesView onOpenCompany={goCompany} onNav={goNav} />}
        {view === "map"          && <MapView onOpenCompany={goCompany} />}
        {view === "matches"   && <MatchesView onOpenCompany={goCompany} />}
        {view === "people"    && <PeopleView onNav={goNav} />}
        {view === "onboard"   && <OnboardView />}
        {view === "settings"  && <SettingsView />}
      </main>

      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />

      <window.TweaksPanel>
        <window.TweakSection label="טיפוגרפיה" />
        <window.TweakRadio label="Display font" value={t.typo}
          options={["sans","serif","mono"]}
          onChange={(v) => setTweak("typo", v)} />
        <window.TweakSection label="צפיפות" />
        <window.TweakRadio label="Density" value={t.density}
          options={["compact","regular","spacious"]}
          onChange={(v) => setTweak("density", v)} />
        <window.TweakSection label="פלטה" />
        <window.TweakColor label="Accent" value={t.accent}
          options={[
            ["#8B5CF6", "#3B82F6"],
            ["#06B6D4", "#3B82F6"],
            ["#F59E0B", "#EF4444"],
            ["#10B981", "#06B6D4"],
            ["#EC4899", "#8B5CF6"],
          ]}
          onChange={(v) => setTweak("accent", v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
