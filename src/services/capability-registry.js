// ecos — canonical capability registry and selectors.
// Keeps capabilities usable across static seed data and local MVP records.

(function () {
  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  const CAPABILITIES = [
    {
      id: "earth-obs",
      name: "תצפית מהלוויין",
      category: "space-data",
      description: "הדמיה, ניטור כדור הארץ וחישה מרחוק ממסלול לוויין",
      keywords: ["earth observation", "remote sensing", "imagery", "imaging", "change detection", "geospatial"],
      examples: ["Multi-spectral Imaging", "Video from Space", "Change Detection"],
    },
    {
      id: "comms",
      name: "תקשורת לוויינית",
      category: "space-infrastructure",
      description: "תקשורת לוויינית, אנטנות, מודמים ופרוטוקולי RF",
      keywords: ["communications", "satellite communications", "rf", "antenna", "vsat", "broadband", "optical satellite"],
      examples: ["Phased Array Antenna", "Ka/Ku Band", "LEO Broadband"],
    },
    {
      id: "ai-data",
      name: "AI ועיבוד נתונים",
      category: "software",
      description: "AI, עיבוד נתוני לוויין, למידת מכונה וניתוח תמונה",
      keywords: ["ai", "machine learning", "analytics", "computer vision", "signal processing", "data"],
      examples: ["Object Detection", "Signal Processing", "Onboard AI"],
    },
    {
      id: "propulsion",
      name: "הנעה ושינוע",
      category: "space-hardware",
      description: "הנעה חללית — מנועים, חמצנים ומיקרו-תרסיסים",
      keywords: ["propulsion", "thruster", "engine", "propellant", "mobility", "hopper"],
      examples: ["Electric Thruster", "Green Propellant", "Cold Gas System"],
    },
    {
      id: "manufacturing",
      name: "ייצור ומבנים",
      category: "space-hardware",
      description: "ייצור, מבנים, רכיבים חלליים ואינטגרציית מערכות",
      keywords: ["manufacturing", "integration", "payload", "component", "space-grade", "structure", "subsystem"],
      examples: ["Structural Components", "Space-Grade PCB", "System Integration"],
    },
    {
      id: "launchers",
      name: "שיגור",
      category: "access-to-space",
      description: "שיגור לחלל, כלי נשיאה, rideshare ופריסת לוויינים",
      keywords: ["launch", "launcher", "rideshare", "deployment", "access to space"],
      examples: ["Small Launch Vehicle", "Rideshare", "Deployment Service"],
    },
    {
      id: "sar",
      name: "SAR / מכ\"מ",
      category: "space-data",
      description: "SAR ופסיקות מכ\"מ לתצפית ביטחונית ואזרחית",
      keywords: ["sar", "radar", "isAR", "gmti", "synthetic aperture", "microwave"],
      examples: ["SAR Sensor", "ISAR", "GMTI Radar"],
    },
    {
      id: "life-sci",
      name: "מדעי החיים",
      category: "human-spaceflight",
      description: "ביולוגיה, רפואה ומניעת קרינה בסביבת חלל",
      keywords: ["life science", "bio", "medical", "radiation", "space medicine", "microgravity"],
      examples: ["Radiation Protection", "Bio-Sensors", "Space Medicine"],
    },
    {
      id: "energy",
      name: "אנרגיה בחלל",
      category: "space-hardware",
      description: "אנרגיה בחלל — פאנלים סולאריים, סוללות ומערכות כוח",
      keywords: ["energy", "power", "solar", "battery", "power management"],
      examples: ["Solar Array", "Space Battery", "Power Management"],
    },
    {
      id: "ground-seg",
      name: "מקטע קרקע",
      category: "space-operations",
      description: "תחנות קרקע, מרכזי שליטה ותוכנה מבצעית",
      keywords: ["ground station", "mission control", "tt&c", "ground network", "operations"],
      examples: ["Ground Station", "Mission Control Software", "TT&C"],
      virtual: true,
    },
    {
      id: "navigation",
      name: "ניווט ו-GNC",
      category: "space-hardware",
      description: "שליטה על מיקום ואוריינטציה, GNSS וניווט עצמאי",
      keywords: ["navigation", "gnc", "gnss", "star tracker", "attitude control", "landing"],
      examples: ["Star Tracker", "GNSS Receiver", "Attitude Control"],
      virtual: true,
    },
    {
      id: "isam",
      name: "שירותים בחלל",
      category: "space-operations",
      description: "תיקון לוויינים, תדלוק בחלל וניקוי פסולת חלל",
      keywords: ["isam", "servicing", "refueling", "debris", "on-orbit", "servicing arm"],
      examples: ["On-Orbit Refueling", "Debris Removal", "Servicing Arm"],
      virtual: true,
    },
    {
      id: "defense",
      name: "Defense / Dual-use",
      category: "dual-use",
      description: "יישומי חלל ודיפנס דו-שימושיים, חיישנים, מודיעין ומערכות מבצעיות",
      keywords: ["defense", "dual-use", "c4isr", "surveillance", "intelligence", "security"],
      examples: ["C4ISR", "Defense Payloads", "Dual-use Sensors"],
    },
  ];

  function normalizeCapabilityId(value) {
    return text(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeSearch(value) {
    return text(value).toLowerCase().replace(/\s+/g, " ");
  }

  function getAllCapabilities() {
    return CAPABILITIES.slice();
  }

  function findDefinition(value) {
    const normalizedId = normalizeCapabilityId(value);
    const normalizedText = normalizeSearch(value);
    return CAPABILITIES.find((cap) => {
      if (cap.id === normalizedId) return true;
      if (normalizeCapabilityId(cap.name) === normalizedId) return true;
      return asArray(cap.keywords).some((keyword) => normalizeSearch(keyword) === normalizedText);
    }) || null;
  }

  function matchKnownCapability(value) {
    const normalizedText = normalizeSearch(value);
    if (!normalizedText) return null;
    return CAPABILITIES.find((cap) => {
      if (cap.id === normalizeCapabilityId(value)) return true;
      return asArray(cap.keywords).some((keyword) => normalizedText.includes(normalizeSearch(keyword)));
    }) || null;
  }

  function customCapability(value) {
    const name = text(value);
    const id = normalizeCapabilityId(name);
    if (!id) return null;
    return {
      id,
      name,
      category: "custom",
      description: "יכולת מותאמת שנוספה מרשומת חברה מקומית.",
      keywords: [name],
      examples: [name],
      custom: true,
    };
  }

  function getCompanyCapabilityIds(company) {
    const explicit = []
      .concat(asArray(company && company.capabilities))
      .concat(asArray(company && company.tags))
      .concat(asArray(company && company.solutions));
    const ids = new Set();

    asArray(company && company.sectors).forEach((value) => {
      const def = findDefinition(value);
      ids.add(def ? def.id : normalizeCapabilityId(value));
    });

    explicit.forEach((value) => {
      const def = findDefinition(value);
      ids.add(def ? def.id : normalizeCapabilityId(value));
    });

    []
      .concat(asArray(company && company.tech))
      .concat(asArray(company && company.offers))
      .concat(asArray(company && company.needs))
      .forEach((value) => {
        const def = matchKnownCapability(value);
        if (def) ids.add(def.id);
      });

    return Array.from(ids).filter(Boolean);
  }

  function getCompanyCapabilities(company) {
    const definitionsById = new Map(CAPABILITIES.map((cap) => [cap.id, cap]));
    const explicitValues = []
      .concat(asArray(company && company.capabilities))
      .concat(asArray(company && company.tags))
      .concat(asArray(company && company.solutions));

    return getCompanyCapabilityIds(company).map((id) => {
      if (definitionsById.has(id)) return definitionsById.get(id);
      const source = explicitValues.find((value) => normalizeCapabilityId(value) === id) || id;
      return customCapability(source);
    }).filter(Boolean);
  }

  function getCapabilityCoverage(companies) {
    const companiesList = asArray(companies);
    const definitions = new Map(CAPABILITIES.map((cap) => [cap.id, Object.assign({}, cap, {
      label: cap.name,
      desc: cap.description,
      companies: [],
      count: 0,
      level: "none",
    })]));

    companiesList.forEach((company) => {
      getCompanyCapabilities(company).forEach((capability) => {
        if (!definitions.has(capability.id)) {
          definitions.set(capability.id, Object.assign({}, capability, {
            label: capability.name,
            desc: capability.description,
            companies: [],
            count: 0,
            level: "none",
          }));
        }
        definitions.get(capability.id).companies.push(company);
      });
    });

    return Array.from(definitions.values()).map((cap) => {
      const sector = asArray(window.SECTORS).find((s) => s.id === cap.id) || null;
      const companiesForCap = cap.companies.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      const count = companiesForCap.length;
      const level = count >= 12 ? "strong" : count >= 5 ? "moderate" : count >= 1 ? "weak" : "none";
      return Object.assign({}, cap, {
        label: cap.name || cap.label,
        desc: cap.description || cap.desc,
        sector,
        companies: companiesForCap,
        count,
        level,
      });
    });
  }

  window.CapabilityRegistry = {
    getAllCapabilities,
    normalizeCapabilityId,
    getCompanyCapabilityIds,
    getCompanyCapabilities,
    getCapabilityCoverage,
  };
})();
