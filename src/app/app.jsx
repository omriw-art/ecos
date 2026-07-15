// ecos — Root app
// Holds: active view, selected company (for profile), copilot drawer, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typo": "sans",
  "density": "regular",
  "accent": ["#8B5CF6", "#3B82F6"]
}/*EDITMODE-END*/;

const VIEW_TITLES = {
  dashboard:    { title: "לוח ניהול",         crumb: "דשבורד"                        },
  "company-overview": { title: "סקירת חברה", crumb: "תצוגת חברה · דמו"               },
  "growth-tools": { title: "הזדמנויות צמיחה", crumb: "תצוגת חברה · דמו"              },
  companies:    { title: "ארגונים",           crumb: "ECOSYSTEM · COMPANIES"          },
  company:      { title: "פרופיל ארגון",     crumb: "ECOSYSTEM · COMPANIES · PROFILE" },
  capabilities: { title: "יכולות חלל",       crumb: "ECOSYSTEM · CAPABILITIES"       },
  map:          { title: "מפת אקוסיסטם",     crumb: "ECOSYSTEM · GRAPH"              },
  needs:        { title: "לוח צרכים",        crumb: "צרכים"                          },
  matches:      { title: "התאמות לצרכים",    crumb: "INTELLIGENCE · MATCH"           },
  copilot:      { title: "חיפוש חכם",         crumb: "INTELLIGENCE · COPILOT"         },
  people:       { title: "ארגון",             crumb: "INTELLIGENCE · PEOPLE"          },
  onboard:      { title: "Onboarding",        crumb: "ACTIONS · NEW COMPANY"          },
  settings:     { title: "הגדרות",           crumb: "ACTIONS · SETTINGS"             },
};

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [companies, setCompanies] = React.useState(() => window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []));
  const [view, setView] = React.useState("dashboard");
  const [companyId, setCompanyId] = React.useState(null);
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  // Product view "perspective" (view-as). Presentational only — never an
  // authorization signal. Defaults to admin so Admin behaviour is unchanged.
  const [perspective, setPerspectiveState] = React.useState(
    () => (window.EcosPerspective ? window.EcosPerspective.get().perspective : "admin")
  );
  const showPerspectiveSwitcher = !!(window.EcosFlags && window.EcosFlags.perspectiveSwitcher);

  React.useEffect(() => {
    window.COMPANIES = companies;
  }, [companies]);

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
  const changePerspective = (next) => {
    const previous = perspective;
    const applied = window.EcosPerspective ? window.EcosPerspective.setPerspective(next).perspective : next;
    setPerspectiveState(applied);
    // Entering the company perspective always lands on its dedicated overview
    // (the whole point of this perspective) rather than wherever the admin
    // view happened to be — "dashboard" would otherwise still count as valid
    // company nav and never trigger the generic fallback below.
    if (applied === "company" && previous !== "company") {
      setView("company-overview");
      return;
    }
    // Otherwise, if the current view isn't in the new perspective's nav, fall
    // back to the dashboard (present in every perspective). The company
    // *profile* detail view ("company") is reachable from every perspective.
    const allowed = window.navForPerspective ? window.navForPerspective(applied).map((n) => n.id) : null;
    if (allowed && view !== "company" && allowed.indexOf(view) === -1) setView("dashboard");
  };
  const createCompany = (input) => {
    const company = window.CompanyStore.createCompany(input);
    setCompanies(window.CompanyStore.getCompanies());
    return company;
  };
  const updateCompany = (id, patch) => {
    const company = window.CompanyStore.updateCompany(id, patch);
    setCompanies(window.CompanyStore.getCompanies());
    return company;
  };
  const refreshCompanies = () => {
    setCompanies(window.CompanyStore.getCompanies());
  };

  const head = VIEW_TITLES[view] || { title: "ecos", crumb: "" };

  return (
    <div className="shell" data-screen-label={view}>
      <Sidebar active={view === "company" ? "companies" : view} onChange={goNav} perspective={perspective} />
      <main className="main">
        <Topbar title={head.title} crumb={head.crumb} onOpenCopilot={() => setCopilotOpen(true)} onOpenCompany={goCompany}
                perspective={perspective} onChangePerspective={changePerspective} showPerspectiveSwitcher={showPerspectiveSwitcher} />
        {view === "dashboard"    && <Dashboard onOpenCompany={goCompany} onNav={goNav} />}
        {view === "company-overview" && <CompanyOverviewView onOpenCompany={goCompany} onNav={goNav} />}
        {view === "growth-tools" && <GrowthToolsView />}
        {view === "companies"    && <CompaniesView onOpenCompany={goCompany} onCreateCompany={createCompany} />}
        {view === "company"      && <CompanyProfile id={companyId} onBack={() => setView("companies")} onNav={goNav} onOpenCompany={goCompany} onUpdateCompany={updateCompany} />}
        {view === "capabilities" && <CapabilitiesView onOpenCompany={goCompany} onNav={goNav} />}
        {view === "map"          && <MapView onOpenCompany={goCompany} />}
        {view === "needs"     && <NeedsView onOpenCompany={goCompany} />}
        {view === "matches"   && <MatchesView onOpenCompany={goCompany} />}
        {view === "people"    && <PeopleView onNav={goNav} />}
        {view === "onboard"   && <OnboardView onCompaniesChanged={refreshCompanies} onOpenCompany={goCompany} />}
        {view === "settings"  && <SettingsView />}
      </main>

      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {(window.EcosFlags && window.EcosFlags.debugPanel) && (
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
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
